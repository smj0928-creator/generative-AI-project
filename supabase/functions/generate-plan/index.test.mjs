import test from 'node:test';
import assert from 'node:assert/strict';

let handle;
const settings = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'sb_publishable_test' }),
  SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_test' }),
  GEMINI_API_KEY: 'gemini-test-key'
};
globalThis.Deno = { env: { get: name => settings[name] }, serve: fn => { handle = fn; } };
await import('./index.ts');

const input = { goal: '체력 향상', level: '입문', frequency: 3, duration: 20,
  place: 'home', workoutType: 'bodyweight', caution: '' };
const rows = [
  { id: 1, goal: input.goal, place: input.place, workout_type: input.workoutType, title: '걷기', summary: '제자리 걷기' },
  { id: 2, goal: input.goal, place: input.place, workout_type: input.workoutType, title: '코어', summary: '버드독' },
  { id: 3, goal: input.goal, place: input.place, workout_type: input.workoutType, title: '호흡', summary: '가벼운 스트레칭' }
];

function mockNetwork(modelIds = [3, 1, 2]) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('workout_templates?')) return Response.json(rows);
    if (String(url).includes('claim_ai_plan_quota')) return Response.json(true);
    if (String(url).includes('generateContent')) return Response.json({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ template_ids: modelIds }) }] } }]
    });
    throw new Error('unexpected request');
  };
  return calls;
}

function request(value = input) {
  return new Request('https://test.supabase.co/functions/v1/generate-plan', {
    method: 'POST', headers: { Origin: 'https://smj0928-creator.github.io', apikey: 'sb_publishable_test' },
    body: JSON.stringify(value)
  });
}

test('Gemini selection produces only catalog-backed workouts', async () => {
  const calls = mockNetwork();
  const response = await handle(request());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.source, 'gemini');
  assert.deepEqual(body.plan.map(item => item.title), ['호흡', '걷기', '코어']);
  assert.equal(calls.filter(call => call.url.includes('generateContent')).length, 1);
  assert.equal(calls.find(call => call.url.includes('generateContent')).options.headers['x-goog-api-key'], 'gemini-test-key');
});

test('invented model IDs trigger a labeled fallback', async () => {
  mockNetwork([3, 999, 2]);
  const response = await handle(request());
  const body = await response.json();
  assert.equal(body.source, 'fallback');
  assert.deepEqual(body.plan.map(item => item.title), ['걷기', '코어', '호흡']);
});

test('missing server secret never reaches Gemini', async () => {
  const calls = mockNetwork();
  const original = settings.GEMINI_API_KEY;
  settings.GEMINI_API_KEY = '';
  try {
    const response = await handle(request());
    assert.equal(response.status, 503);
    assert.equal(calls.length, 0);
  } finally { settings.GEMINI_API_KEY = original; }
});

test('medical notes stop before model requests', async () => {
  const calls = mockNetwork();
  const response = await handle(request({ ...input, caution: '심장 질환 치료 중' }));
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error, 'MEDICAL_NOTE');
  assert.equal(calls.length, 0);
});

test('disallowed origins never reach the catalog or model', async () => {
  const calls = mockNetwork();
  const blocked = new Request('https://test.supabase.co/functions/v1/generate-plan', {
    method: 'POST', headers: { Origin: 'https://unexpected.example', apikey: 'sb_publishable_test' },
    body: JSON.stringify(input)
  });
  const response = await handle(blocked);
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test('daily quota stops before the Gemini call', async () => {
  const calls = mockNetwork();
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('workout_templates?')) return Response.json(rows);
    if (String(url).includes('claim_ai_plan_quota')) return Response.json(false);
    throw new Error('Gemini should not be called after the limit');
  };
  const response = await handle(request());
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error, 'DAILY_LIMIT');
  assert.equal(calls.some(call => call.url.includes('generateContent')), false);
});
