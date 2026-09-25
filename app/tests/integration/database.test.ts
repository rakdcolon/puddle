import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import { beforeAll, afterAll, expect, test } from 'vitest'

// Real PostgreSQL engine in-process. Supabase's auth.jwt() boundary is modeled;
// the separate live-database suite exercises actual PostgREST and Supabase roles.
let db: PGlite
beforeAll(async()=>{
  db=new PGlite()
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;`)
  for(const name of readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort()) await db.exec(readFileSync(`supabase/migrations/${name}`,'utf8'))
})
afterAll(async()=>{await db?.close()})
test('all migrations replay on an empty database and seed valid puzzles',async()=>{
  const result=await db.query<{count:number}>('SELECT count(*)::int AS count FROM puzzles')
  expect(result.rows[0].count).toBe(3)
})
test('anonymous role sees only scheduled, non-deleted puzzles and no private tables',async()=>{
  await db.exec('BEGIN; SET LOCAL ROLE anon;')
  try {
    const rows=await db.query('SELECT issue_no FROM puzzles')
    expect(rows.rows).toHaveLength(1)
    expect(rows.rows[0]).toEqual({issue_no: (await db.query<{day:number}>('SELECT EXTRACT(DOY FROM CURRENT_DATE)::int AS day')).rows[0].day})
    for(const table of ['users','solves','anon_solves','submissions','user_settings']) expect((await db.query(`SELECT * FROM ${table}`)).rows).toEqual([])
  } finally {await db.exec('ROLLBACK')}
})
test('anonymous direct submissions are rejected by RLS',async()=>{
  await db.exec('BEGIN; SET LOCAL ROLE anon;')
  try {await expect(db.exec("INSERT INTO submissions (submitter_email,submitter_name,payload) VALUES ('test@example.invalid','test','{}')")).rejects.toThrow(/row-level security/)}
  finally {await db.exec('ROLLBACK')}
})
test('database enforces date-based editions and foreign keys',async()=>{
  await expect(db.exec('UPDATE puzzles SET issue_no=999')).rejects.toThrow(/check/)
  await expect(db.exec('UPDATE puzzles SET date_active=CURRENT_DATE, issue_no=EXTRACT(DOY FROM CURRENT_DATE)::int, vol=EXTRACT(YEAR FROM CURRENT_DATE)::int % 100 WHERE date_active=CURRENT_DATE+1')).rejects.toThrow(/unique/)
  await expect(db.exec("INSERT INTO anon_solves (client_id,puzzle_id,status) VALUES (gen_random_uuid(),gen_random_uuid(),'solved')")).rejects.toThrow(/foreign key/)
})

test('annual issue numbers repeat across years and renumbering preserves solve links',async()=>{
  await db.exec('BEGIN')
  try {
    const original = await db.query<{id:string}>('SELECT id FROM puzzles ORDER BY date_active LIMIT 1')
    const id = original.rows[0].id
    await db.query("INSERT INTO anon_solves (client_id,puzzle_id,status) VALUES (gen_random_uuid(),$1,'solved')", [id])
    await db.query("UPDATE puzzles SET date_active='2098-01-01',vol=98,issue_no=1 WHERE id=$1",[id])
    await db.exec("UPDATE puzzles SET date_active='2099-01-01',vol=99,issue_no=1 WHERE date_active=CURRENT_DATE+1")
    expect((await db.query('SELECT vol FROM puzzles WHERE issue_no=1 ORDER BY vol')).rows).toEqual([{vol:98},{vol:99}])
    expect((await db.query('SELECT puzzle_id FROM anon_solves WHERE puzzle_id=$1',[id])).rows).toEqual([{puzzle_id:id}])
  } finally {await db.exec('ROLLBACK')}
})
test('authenticated users cannot create their own row as admin',async()=>{
  await db.exec(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"sub":"test-sub"}';`)
  try {await expect(db.exec("INSERT INTO users (google_sub,display_name,email,is_admin) VALUES ('test-sub','Test','test@example.invalid',true)")).rejects.toThrow(/Cannot escalate/)}
  finally {await db.exec('ROLLBACK')}
})
test('authenticated users can create an ordinary own row but cannot promote it',async()=>{
  await db.exec(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"sub":"test-sub"}';`)
  try {
    await db.exec("INSERT INTO users (google_sub,display_name,email) VALUES ('test-sub','Test','test@example.invalid')")
    expect((await db.query('SELECT is_admin FROM users')).rows).toEqual([{is_admin:false}])
    await expect(db.exec('UPDATE users SET is_admin=true')).rejects.toThrow(/Cannot escalate/)
  } finally {await db.exec('ROLLBACK')}
})
