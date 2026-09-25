import environments from '../../config/environments.json' with { type: 'json' };

/** @param {Record<string, string | undefined>} env */
export function environmentName(env = process.env) {
  const inferred = env.VERCEL_ENV === 'production' ? 'prod' : env.VERCEL_ENV === 'preview' ? 'qa' : 'dev';
  const name = env.PUDDLE_ENV || inferred;
  if (!['dev', 'qa', 'prod'].includes(name)) throw new Error('PUDDLE_ENV must be dev, qa or prod');
  if (env.VERCEL_ENV === 'production' && name !== 'prod') throw new Error('Production hosting requires PUDDLE_ENV=prod');
  if (env.VERCEL_ENV === 'preview' && name !== 'qa') throw new Error('Preview hosting requires PUDDLE_ENV=qa');
  return name;
}

// Fixed project identities prevent a copied production .env from turning a test into a production write.
/** @param {Record<string, string | undefined>} env */
export function assertEnvironment(env = process.env) {
  const name = environmentName(env);
  const expected = environments[name];
  const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || 'http://invalid');
  const host = name === 'dev' && url.hostname === 'localhost' ? '127.0.0.1' : url.hostname;
  if (host !== expected.supabaseHost || url.port !== expected.supabasePort ||
      url.protocol !== (name === 'dev' ? 'http:' : 'https:') || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(`Supabase URL does not match the registered ${name} environment`);
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  return name;
}

/** @param {Record<string, string | undefined>} env */
export function assertTestEnvironment(env = process.env) {
  const name = assertEnvironment(env);
  if (name === 'prod') throw new Error('Write-capable tests and fixture setup cannot target production');
  if (name === 'qa' && env.PUDDLE_ALLOW_QA_TESTS !== '1') throw new Error('QA fixture writes require PUDDLE_ALLOW_QA_TESTS=1');
  return name;
}

/** @param {Record<string, string | undefined>} env */
export function scheduledJobsEnabled(env = process.env) {
  return environmentName(env) === 'prod';
}
