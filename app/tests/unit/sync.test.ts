import { expect, test } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { parseAndValidate } from '@/lib/puzzles/sync'
import { puzzle } from '../fixtures/puzzle'
const file = (value: unknown, name = 'test.json') => ({name,content:JSON.stringify(value)})
test('validates the entire committed puzzle archive', () => {
  const files = readdirSync('../puzzles').filter(n=>n.endsWith('.json')).map(name=>({name,content:readFileSync(`../puzzles/${name}`,'utf8')}))
  const result = parseAndValidate(files)
  expect(result.errors).toEqual([]);expect(result.puzzles.length).toBeGreaterThan(0)
  expect(new Set(result.puzzles.map(p=>p.date_active)).size).toBe(result.puzzles.length)
})
test('normalizes answers and restores reintroduced puzzles', () => {
  expect(parseAndValidate([file({...puzzle,answer:'  FIVE  ',deleted_at:'yesterday'})]).puzzles[0]).toMatchObject({answer:'five',deleted_at:null})
})
test('ignores templates and collects parse, shape, field, type and duplicate errors', () => {
  expect(parseAndValidate([file({},'template.json'),file({},'notes.txt')])).toEqual({puzzles:[],errors:[]})
  for (const value of [null,[],3,{}, {...puzzle,issue_no:'1'}, {...puzzle,prompt:'text'}, {...puzzle,title:4}]) {
    expect(parseAndValidate([file(value)]).errors.length).toBeGreaterThan(0)
  }
  expect(parseAndValidate([{name:'bad.json',content:'{'}]).errors[0]).toMatch(/invalid JSON/)
  expect(parseAndValidate([file(puzzle),file(puzzle,'other.json')]).errors[0]).toMatch(/duplicate/)
})
