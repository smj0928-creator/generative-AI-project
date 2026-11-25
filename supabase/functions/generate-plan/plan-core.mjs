export const GOALS = ['체력 향상', '체중 감량', '근력 강화', '유연성 향상'];
export const LEVELS = ['입문', '초급', '중급'];
export const PLACES = ['home', 'gym'];
export const WORKOUT_TYPES = ['bodyweight', 'equipment', 'mixed'];

export function parsePlanInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_INPUT');
  const input = {
    goal: value.goal,
    level: value.level,
    frequency: value.frequency,
    duration: value.duration,
    place: value.place,
    workoutType: value.workoutType,
    caution: typeof value.caution === 'string' ? value.caution.trim() : ''
  };
  if (!GOALS.includes(input.goal) || !LEVELS.includes(input.level) ||
      !PLACES.includes(input.place) || !WORKOUT_TYPES.includes(input.workoutType) ||
      ![3, 4, 5].includes(input.frequency) || ![20, 30, 40].includes(input.duration) ||
      input.caution.length > 160) throw new Error('INVALID_INPUT');
  if (/수술|골절|심장|흉통|임신|마비|실신|호흡곤란|진단|질환|치료/.test(input.caution)) {
    throw new Error('MEDICAL_NOTE');
  }
  return input;
}

const AVOID = [
  { note: /무릎|슬개/, exercise: /스쿼트|런지|점프|버피|레그\s?프레스|계단|스텝/ },
  { note: /허리|요추/, exercise: /데드리프트|크런치|싯업|슈퍼맨|굿모닝|힙힌지/ },
  { note: /어깨|견관절/, exercise: /푸시업|숄더|오버헤드|플랭크|풀다운|프레스/ }
];

export function filterCatalog(rows, input) {
  return rows.filter(item => item.goal === input.goal && item.place === input.place &&
    item.workout_type === input.workoutType && Number.isInteger(Number(item.id)) &&
    typeof item.title === 'string' && typeof item.summary === 'string' &&
    !AVOID.some(rule => rule.note.test(input.caution) && rule.exercise.test(item.title + ' ' + item.summary)));
}

export function validateSelection(value, candidates, frequency) {
  const ids = value?.template_ids;
  if (!Array.isArray(ids) || ids.length !== frequency || !ids.every(Number.isInteger)) throw new Error('BAD_MODEL_OUTPUT');
  const catalog = new Map(candidates.map(item => [Number(item.id), item]));
  if (!ids.every(id => catalog.has(id))) throw new Error('BAD_MODEL_OUTPUT');
  if (candidates.length >= frequency && new Set(ids).size !== frequency) throw new Error('BAD_MODEL_OUTPUT');
  return ids.map(id => catalog.get(id));
}

export function fallbackSelection(candidates, frequency) {
  if (!candidates.length) throw new Error('NO_SAFE_CANDIDATES');
  return Array.from({ length: frequency }, (_, index) => candidates[index % candidates.length]);
}

export function toPlanItems(selected, input, makeId) {
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
  return selected.map((item, index) => ({
    id: makeId(),
    day: weekdays[(index * Math.floor(7 / input.frequency)) % 7],
    title: item.title,
    summary: item.summary,
    duration: input.duration,
    level: input.level,
    place: input.place,
    workoutType: input.workoutType
  }));
}
