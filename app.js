const { modules, lessons, getLesson } = CourseData;
let state = LearningStorage.load();
let activeLesson = null;

const $ = (selector, parent = document) => parent.querySelector(selector);
const toast = $('#toast');
const backdrop = $('#dialogBackdrop');
const body = $('#dialogBody');

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function isUnlocked(lesson) {
  const index = lessons.findIndex((item) => item.id === lesson.id);
  return index === 0 || state.completed.includes(lessons[index - 1].id) || lesson.id === state.currentLesson;
}

function openDialog(title, eyebrow = 'RE:START') {
  $('#dialogTitle').textContent = title;
  $('#dialogEyebrow').textContent = eyebrow;
  backdrop.hidden = false;
  document.body.classList.add('dialog-open');
  $('#closeDialog').focus();
}

function closeDialog() {
  backdrop.hidden = true;
  document.body.classList.remove('dialog-open');
}

function renderDashboard() {
  const complete = state.completed.length;
  const percent = Math.round((complete / lessons.length) * 100);
  $('#progressPercent').textContent = percent;
  $('#progressCount').textContent = `${complete} / ${lessons.length}`;
  $('#studyMinutes').textContent = `累计学习 ${state.minutes || 0} 分钟`;
  $('#progressRing').style.background = `conic-gradient(var(--purple) ${percent}%,#eef0f3 0)`;
  const mistakes = state.attempts.filter((attempt) => !attempt.correct);
  $('#mistakeBadge').textContent = mistakes.length;
  $('#moduleProgress').innerHTML = modules.map((module) => {
    const done = module.lessons.filter((lesson) => state.completed.includes(lesson.id)).length;
    const value = Math.round(done / module.lessons.length * 100);
    return `<div class="module-row ${done === 0 ? 'muted' : ''}"><div class="module-index ${done === module.lessons.length ? 'complete' : 'current'}">${done === module.lessons.length ? '✓' : module.index}</div><div><strong>${module.index} · ${module.title}</strong><div class="bar"><i style="width:${value}%"></i></div></div><span>${done} / ${module.lessons.length}</span></div>`;
  }).join('');
  const current = getLesson(state.currentLesson) || lessons.find(isUnlocked) || lessons[0];
  $('.lesson-number').textContent = `LESSON ${String(lessons.indexOf(current) + 1).padStart(2, '0')}`;
  $('.card-main h2').textContent = current.title;
  $('.card-main > p').textContent = current.theory;
  $('.lesson-meta span:first-child').textContent = current.moduleTitle;
}

function showCourses() {
  openDialog('学习地图', '全部课程 · 自动保存进度');
  body.innerHTML = `<div class="course-map">${modules.map((module) => `<section><h3>${module.index} · ${module.title}</h3>${module.lessons.map((lesson) => {
    const done = state.completed.includes(lesson.id); const unlocked = isUnlocked(lesson);
    return `<button class="course-button ${done ? 'done' : ''}" data-lesson="${lesson.id}" ${unlocked ? '' : 'disabled'}><span>${done ? '✓' : unlocked ? '→' : '⌕'}</span><div><strong>${lesson.title}</strong><small>${unlocked ? `${lesson.duration} 分钟` : '完成上一课后解锁'}</small></div></button>`;
  }).join('')}</section>`).join('')}</div>`;
  body.querySelectorAll('[data-lesson]').forEach((button) => button.addEventListener('click', () => showLesson(button.dataset.lesson)));
}

function showLesson(id) {
  activeLesson = getLesson(id);
  if (!activeLesson || !isUnlocked(activeLesson)) return notify('请先完成上一课');
  state = LearningStorage.save({ ...state, currentLesson: id });
  openDialog(activeLesson.title, activeLesson.moduleTitle);
  body.innerHTML = `<div class="lesson-content"><p class="theory">${activeLesson.theory}</p>${activeLesson.program ? `<div class="simulator"><label for="assemblyInput">汇编模拟器</label><textarea id="assemblyInput" spellcheck="false">${activeLesson.program}</textarea><button class="run-button" id="runSimulator">运行代码</button><pre id="simulatorOutput">支持 MOV、ADD、SUB、XOR、CMP、INC、DEC</pre></div>` : ''}<div class="quiz"><small>预测题 · 自动判题</small><h3>${activeLesson.question}</h3><div class="answers">${activeLesson.options.map((option, index) => `<button data-answer="${index}">${option}</button>`).join('')}</div><p id="feedback" aria-live="polite"></p></div><button class="back-link" id="backToCourses">← 返回课程地图</button></div>`;
  body.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => grade(Number(button.dataset.answer))));
  $('#backToCourses').addEventListener('click', showCourses);
  if ($('#runSimulator')) $('#runSimulator').addEventListener('click', runSimulator);
}

function grade(selected) {
  const correct = selected === activeLesson.answer;
  const firstCompletion = correct && !state.completed.includes(activeLesson.id);
  state = LearningStorage.recordAttempt(state, activeLesson.id, selected, correct);
  if (firstCompletion) state = LearningStorage.save({ ...state, minutes: state.minutes + activeLesson.duration });
  const feedback = $('#feedback');
  feedback.className = correct ? 'correct' : 'incorrect';
  feedback.textContent = `${correct ? '回答正确！' : '还差一点。'} ${activeLesson.explanation}`;
  body.querySelectorAll('[data-answer]').forEach((button, index) => { button.disabled = true; if (index === activeLesson.answer) button.classList.add('right'); });
  renderDashboard();
  notify(correct ? '课程完成，下一课已解锁' : '已加入错题本，可随时复习');
}

function runSimulator() {
  try {
    const result = AssemblySimulator.run($('#assemblyInput').value);
    $('#simulatorOutput').textContent = `RAX ${AssemblySimulator.format(result.registers.rax)}\nRBX ${AssemblySimulator.format(result.registers.rbx)}\nFLAGS  ZF=${result.flags.ZF} CF=${result.flags.CF} SF=${result.flags.SF}`;
  } catch (error) { $('#simulatorOutput').textContent = `错误：${error.message}`; }
}

function showMistakes() {
  const wrong = state.attempts.filter((attempt) => !attempt.correct).reverse();
  openDialog('错题本', `${wrong.length} 条学习记录`);
  body.innerHTML = wrong.length ? `<div class="mistake-list">${wrong.map((attempt) => { const lesson = getLesson(attempt.lessonId); return lesson ? `<button data-review="${lesson.id}"><strong>${lesson.title}</strong><span>${lesson.question}</span><small>重新练习 →</small></button>` : ''; }).join('')}</div>` : '<div class="empty-state">还没有错题。完成课程练习后，错误答案会自动保存在这里。</div>';
  body.querySelectorAll('[data-review]').forEach((button) => button.addEventListener('click', () => showLesson(button.dataset.review)));
}

$('#closeDialog').addEventListener('click', closeDialog);
backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeDialog(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDialog(); });
document.querySelectorAll('[data-action="courses"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showCourses(); }));
document.querySelectorAll('[data-action="mistakes"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showMistakes(); }));
$('#continueBtn').addEventListener('click', () => showLesson(state.currentLesson));
$('#challengeBtn').addEventListener('click', () => showLesson('hex'));
$('.secondary').addEventListener('click', showMistakes);
$('.brand').addEventListener('click', (event) => { event.preventDefault(); closeDialog(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
document.querySelectorAll('.nav-item:not([data-action])').forEach((link) => link.addEventListener('click', () => notify(`${link.textContent.trim()}：功能入口已就绪`)));
renderDashboard();
