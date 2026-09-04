const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(file, context) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const memory = new Map();
const context = vm.createContext({
  console,
  setInterval,
  clearInterval,
  localStorage: {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value)
  }
});

load('course-data.js', context);
load('storage.js', context);
load('simulator.js', context);

const { CourseData, ProgressStore, AssemblySimulator } = context;
assert.equal(CourseData.lessons.length, 3);
assert.equal(CourseData.terms.length, 12);
assert.equal(ProgressStore.isUnlocked(0, CourseData.lessons), true);
assert.equal(ProgressStore.isUnlocked(1, CourseData.lessons), false);

const question = CourseData.lessons[0].prediction;
ProgressStore.recordAttempt(question, '8', false, 'numbers');
assert.equal(ProgressStore.stats().mistakes, 1);
ProgressStore.recordAttempt(question, '10', true, 'numbers');
assert.equal(ProgressStore.stats().totalAttempts, 2);
assert.equal(ProgressStore.stats().accuracy, 50);
ProgressStore.markMastered(question.id);
assert.equal(ProgressStore.stats().mistakes, 0);
ProgressStore.completeLesson('numbers', 80);
assert.equal(ProgressStore.isUnlocked(1, CourseData.lessons), true);
ProgressStore.setPosition('mov', 2);

// 使用同一份 localStorage 重新加载存储模块，模拟浏览器刷新。
load('storage.js', context);
assert.equal(context.ProgressStore.get().lessons.numbers.completed, true);
assert.equal(context.ProgressStore.get().lastLessonId, 'mov');
assert.equal(context.ProgressStore.get().lastSection, 2);

let snapshot;
const equalProgram = ['MOV RAX, 5', 'ADD RAX, 3', 'SUB RAX, 1', 'CMP RAX, 7', 'JE equal', 'MOV RBX, 99', 'equal: MOV RBX, RAX'];
const equalSim = new AssemblySimulator(equalProgram, state => { snapshot = state; });
while (!snapshot.finished) equalSim.step();
assert.equal(snapshot.registers.RAX, 7);
assert.equal(snapshot.registers.RBX, 7);
assert.equal(snapshot.zf, 1);

const notEqualProgram = ['MOV RCX, 2', 'CMP RCX, 3', 'JNE different', 'MOV RDX, 99', 'different: MOV RDX, 1'];
const notEqualSim = new AssemblySimulator(notEqualProgram, state => { snapshot = state; });
while (!snapshot.finished) notEqualSim.step();
assert.equal(snapshot.registers.RDX, 1);
assert.equal(snapshot.zf, 0);

ProgressStore.reset();
assert.equal(ProgressStore.stats().completed, 0);
assert.equal(ProgressStore.stats().totalAttempts, 0);
assert.equal(ProgressStore.get().lastLessonId, 'numbers');

console.log('核心逻辑测试通过：课程解锁、持久化数据、错题掌握、统计、六种指令与重置。');
