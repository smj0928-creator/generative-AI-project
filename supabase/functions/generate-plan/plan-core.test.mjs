import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackSelection, filterCatalog, parsePlanInput, toPlanItems, validateSelection } from './plan-core.mjs';

const input = { goal: '체력 향상', level: '입문', frequency: 3, duration: 20,
  place: 'home', workoutType: 'bodyweight', caution: '' };
const catalog = [
  { id: 1, goal: '체력 향상', place: 'home', workout_type: 'bodyweight', title: '걷기', summary: '제자리 걷기' },
  { id: 2, goal: '체력 향상', place: 'home', workout_type: 'bodyweight', title: '스쿼트', summary: '스쿼트 · 스트레칭' },
  { id: 3, goal: '체력 향상', place: 'home', workout_type: 'bodyweight', title: '호흡 운동', summary: '호흡 · 가벼운 스트레칭' },
  { id: 4, goal: '체력 향상', place: 'gym', workout_type: 'equipment', title: '머신 운동', summary: '레그 프레스' }
];

test('only supported UI input is accepted', () => {
  assert.deepEqual(parsePlanInput(input), input);
  assert.throws(() => parsePlanInput({ ...input, frequency: 99 }), /INVALID_INPUT/);
  assert.throws(() => parsePlanInput({ ...input, caution: '심장 질환 치료 중' }), /MEDICAL_NOTE/);
});

test('catalog filtering enforces place, method and conservative caution exclusions', () => {
  assert.deepEqual(filterCatalog(catalog, input).map(item => item.id), [1, 2, 3]);
  assert.deepEqual(filterCatalog(catalog, { ...input, caution: '무릎 부담 최소화' }).map(item => item.id), [1, 3]);
});

test('model cannot invent a workout or repeat when enough candidates exist', () => {
  const candidates = filterCatalog(catalog, input);
  assert.deepEqual(validateSelection({ template_ids: [3, 1, 2] }, candidates, 3).map(item => item.id), [3, 1, 2]);
  assert.throws(() => validateSelection({ template_ids: [1, 9, 2] }, candidates, 3), /BAD_MODEL_OUTPUT/);
  assert.throws(() => validateSelection({ template_ids: [1, 1, 2] }, candidates, 3), /BAD_MODEL_OUTPUT/);
});

test('fallback and plan items keep the requested conditions', () => {
  const selected = fallbackSelection(filterCatalog(catalog, input), 3);
  let id = 0;
  const plan = toPlanItems(selected, input, () => `plan-${++id}`);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map(item => item.day), ['월', '수', '금']);
  assert.ok(plan.every(item => item.duration === 20 && item.level === '입문' && item.place === 'home'));
});
