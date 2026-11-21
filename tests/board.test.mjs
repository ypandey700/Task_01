import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRecords, filterRecords } from '../dist/board-core.js';
const records = JSON.parse(await readFile(new URL('../dist/data/internships.json', import.meta.url)));
const seed = JSON.parse(await readFile(new URL('../docs/sources/internship-records-sample.json', import.meta.url))).internships;
test('all supplied records and original fields are preserved', () => {
  assert.equal(validateRecords(records).length, seed.length);
  for (const source of seed) {
    const item = records.find(item => item.id === source.id);
    for (const [key,value] of Object.entries(source)) assert.deepEqual(item[key], value);
  }
});
test('search is case insensitive and matches role, company, and skills', () => {
  assert.equal(filterRecords(records,{query:'  FRONTEND  '})[0].id, 'INT-101');
  assert.equal(filterRecords(records,{query:'layers'})[0].id, 'INT-101');
  assert.equal(filterRecords(records,{query:'SQL'}).length, 2);
});
test('domain and mode combine; multiple domains use OR', () => {
  assert.deepEqual(filterRecords(records,{domains:['Full Stack Development'],mode:'Remote'}).map(r=>r.id),['INT-101']);
  assert.equal(filterRecords(records,{domains:['Full Stack Development','UI/UX']}).length,3);
});
test('no results, saved list, and paid-only filter', () => {
  assert.equal(filterRecords(records,{query:'nothing-matches'}).length,0);
  assert.equal(filterRecords(records,{savedOnly:true,saved:[]}).length,0);
  assert.equal(filterRecords(records,{savedOnly:true,saved:['INT-105']})[0].id,'INT-105');
  assert.equal(filterRecords([{...records[0],stipend:0}],{paid:true}).length,0);
});
test('sorting leaves the source order intact', () => {
  const ids = records.map(r=>r.id);
  assert.equal(filterRecords(records,{sort:'stipend'})[0].stipend,20000);
  assert.equal(filterRecords(records,{sort:'title'})[0].title,'API Engineering Intern');
  assert.deepEqual(records.map(r=>r.id),ids);
});
test('malformed payloads and duplicate IDs are rejected', () => {
  for (const invalid of [{},[null],[{...records[0],stipend:-1}],[{...records[0],skills:'HTML'}],[records[0],records[0]]]) assert.throws(()=>validateRecords(invalid));
});
