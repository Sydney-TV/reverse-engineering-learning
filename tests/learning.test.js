const assert = require('node:assert/strict');
const Storage = require('../storage');
const CourseData = require('../course-data');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

const driver = memoryStorage();
const store = Storage.createStore(driver);
let data = store.load().data;
assert.equal(data.version, 2, 'fresh data uses explicit version');
assert.equal(data.profiles.length, 0, 'fresh browser has no fabricated profile');

let userA;
[data, userA] = Storage.addProfile(data, { nickname: '测试用户A', goal: '理解程序', dailyMinutes: 15 }, new Date('2026-09-01T10:00:00Z'));
assert.equal(Storage.active(data).nickname, '测试用户A');
assert.equal(userA.currentLessonId, null, 'new user is not placed in a middle lesson');
assert.equal(Storage.unlocked(userA, 0), true);
assert.equal(Storage.unlocked(userA, 1), false, 'lesson 1 starts locked');

userA = Storage.setCourseProgress(userA, 'program', { visited: [0, 1, 2, 3, 4, 5], interactions: ['flow', 'scenarios'], summary: '自己的总结', answers: [{ correct: true }, { correct: true }, { correct: true }], passed: true }, new Date('2026-09-01T11:00:00Z'));
data = Storage.updateProfile(data, userA.id, userA);
assert.equal(Storage.unlocked(userA, 1), true, 'passing lesson 0 unlocks lesson 1');
const completedCourse = Storage.progress(userA, 'program');
assert.equal(Storage.canTakeCheck(completedCourse, 6, ['flow', 'scenarios']), true);
assert.equal(Storage.canPass(completedCourse, 3), true);
assert.equal(Storage.canTakeCheck({ ...completedCourse, summary: '' }, 6, ['flow', 'scenarios']), false, 'summary cannot be skipped');
assert.equal(Storage.canTakeCheck({ ...completedCourse, interactions: ['flow'] }, 6, ['flow', 'scenarios']), false, 'required interaction cannot be skipped');

let userB;
[data, userB] = Storage.addProfile(data, { nickname: '测试用户B', goal: '从零开始', dailyMinutes: 10 }, new Date('2026-09-02T10:00:00Z'));
assert.equal(Storage.unlocked(userB, 1), false, 'second profile does not inherit progress');
assert.equal(Storage.progress(userB, 'program').passed, false);
assert.equal(Storage.progress(data.profiles.find((item) => item.id === userA.id), 'program').passed, true);

assert.equal(store.save(data), true);
const restored = store.load().data;
assert.equal(restored.profiles.length, 2, 'profiles survive reload');
assert.equal(Storage.active(restored).nickname, '测试用户B', 'active profile survives reload');

let streak = Storage.touch(userB, new Date('2026-09-03T12:00:00Z'));
streak = Storage.touch(streak, new Date('2026-09-04T12:00:00Z'));
assert.equal(streak.streak, 2, 'streak is based on real distinct dates');

assert.throws(() => Storage.createProfile({ nickname: '   ' }), /昵称/);
assert.equal(CourseData.lessons.length, 3);
CourseData.lessons.forEach((lesson) => {
  assert.ok(lesson.pages.length >= 6);
  assert.equal(lesson.questions.length, 3);
  assert.ok(lesson.pages.some((page) => page.summary));
});

const legacyStore = Storage.createStore(memoryStorage({ 'restart-learning-progress-v1': '{"completed":["arithmetic"]}' }));
const legacy = legacyStore.load();
assert.equal(legacy.legacy, true);
assert.equal(legacy.data.profiles.length, 0, 'legacy test completion is never treated as a real learner');

console.log('learning profile, persistence, isolation, curriculum and unlock tests passed');
