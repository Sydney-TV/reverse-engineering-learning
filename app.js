const { lessons, onboarding, getLesson } = CourseData;
const store = LearningStorage.createStore();
let loaded = store.load();
let data = loaded.data;
let profile = LearningStorage.active(data);
let activeLesson = null;

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const toast = $('#toast');
const backdrop = $('#dialogBackdrop');
const dialogBody = $('#dialogBody');
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

function notify(message, warning = false) {
  toast.textContent = message; toast.classList.toggle('warning', warning); toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
}
function persist() { if (!store.save(data)) notify('localStorage 不可用，本次更改可能无法在刷新后保留。', true); }
function replaceProfile(next) { data = LearningStorage.updateProfile(data, next.id, next); profile = next; persist(); renderDashboard(); }
function openDialog(title, eyebrow = 'RE:START') { $('#dialogTitle').textContent = title; $('#dialogEyebrow').textContent = eyebrow; backdrop.hidden = false; document.body.classList.add('dialog-open'); $('#closeDialog').focus(); }
function closeDialog() { backdrop.hidden = true; document.body.classList.remove('dialog-open'); }
function safe(text) { const node = document.createElement('span'); node.textContent = text; return node.innerHTML; }

function showWelcome() {
  let welcome = $('#firstRun');
  if (!welcome) { welcome = document.createElement('section'); welcome.id = 'firstRun'; welcome.className = 'first-run'; document.body.append(welcome); }
  welcome.innerHTML = `<div class="welcome-card"><div class="brand-mark">R<span>E</span></div><p class="eyebrow">WELCOME TO RE:START</p><h1>从“程序是什么”开始理解软件。</h1><p>这是一套离线、循序渐进的逆向工程入门课程。你将认识程序如何生成、数字如何保存，以及如何在合法授权范围内观察软件行为。</p>${loaded.error ? `<div class="form-error">${loaded.error}</div>` : ''}${loaded.legacy ? '<div class="legacy-note">检测到旧版测试数据。它不会被当作真实学习记录；创建档案后可在设置中清除。</div>' : ''}<ul><li>不需要提前了解汇编或寄存器</li><li>档案与进度只保存在本机浏览器</li><li>只学习自有、内置或明确授权的样本</li></ul><button class="primary" id="createFirstProfile">创建我的学习档案 <span>→</span></button></div>`;
  welcome.hidden = false;
  $('#createFirstProfile').addEventListener('click', () => showProfileForm());
}

function showProfileForm(existing = null) {
  openDialog(existing ? '编辑学习档案' : '创建学习档案', '仅保存在本机浏览器');
  dialogBody.innerHTML = `<form id="profileForm" class="profile-form"><label>昵称 <b>*</b><input name="nickname" maxlength="24" value="${existing ? safe(existing.nickname) : ''}" autocomplete="off"><small>这是首页显示的称呼，不能为空。</small></label><label>编程基础<select name="experience"><option value="none">完全没有基础</option><option value="beginner">看过少量代码</option><option value="experienced">能独立写简单程序</option></select></label><label>学习目标<textarea name="goal" maxlength="160" placeholder="例如：理解自己编译的程序如何运行">${existing ? safe(existing.goal) : ''}</textarea></label><label>每日计划学习时间<select name="dailyMinutes"><option value="10">10 分钟</option><option value="15">15 分钟</option><option value="25">25 分钟</option><option value="40">40 分钟</option></select></label><p class="form-error" id="profileError" aria-live="polite"></p><button class="primary" type="submit">${existing ? '保存修改' : '创建并进入新手引导'} <span>→</span></button></form>`;
  const form = $('#profileForm');
  if (existing) { form.experience.value = existing.experience; form.dailyMinutes.value = existing.dailyMinutes; }
  form.addEventListener('submit', (event) => {
    event.preventDefault(); const fields = Object.fromEntries(new FormData(form));
    if (!fields.nickname.trim()) { $('#profileError').textContent = '昵称不能为空，请填写一个称呼。'; form.nickname.focus(); return; }
    if (existing) { data = LearningStorage.updateProfile(data, existing.id, fields); profile = LearningStorage.active(data); persist(); closeDialog(); renderDashboard(); notify('学习档案已更新'); }
    else { try { [data, profile] = LearningStorage.addProfile(data, fields); persist(); $('#firstRun')?.setAttribute('hidden', ''); showOnboarding(0); renderDashboard(); } catch (error) { $('#profileError').textContent = error.message; } }
  });
}

function showOnboarding(step = profile.onboardingStep || 0) {
  if (!profile) return showWelcome();
  const index = Math.min(step, onboarding.length - 1); openDialog('新手引导', `第 ${index + 1} / ${onboarding.length} 步`);
  dialogBody.innerHTML = `<div class="onboarding"><div class="page-meter"><i style="width:${((index + 1) / onboarding.length) * 100}%"></i></div><span class="onboarding-number">0${index + 1}</span><h3>${onboarding[index]}</h3><p>${['先建立共同语言，后面的每个概念都会从已经学过的内容出发。','源代码不是可执行文件；翻译是两者之间的重要步骤。','逆向分析不是猜密码，而是有证据地观察结构和行为。','授权范围永远先于工具和技术。','如果练习可能影响他人设备、数据或权益，请立刻停下并确认授权。','遇到陌生词可点击术语；“我没看懂”会换一种解释，而不会跳到答案。','你不会被自动送到中间章节。准备好时，请亲自开始第一课。'][index]}</p><div class="onboarding-actions">${index ? '<button id="onboardPrev">上一步</button>' : ''}${index < onboarding.length - 1 ? '<button class="primary" id="onboardNext">下一步 →</button>' : '<button class="primary" id="beginLessonZero">从第 0 课开始 →</button>'}</div></div>`;
  const saveStep = (next) => { profile = { ...profile, onboardingStep: next }; replaceProfile(profile); showOnboarding(next); };
  $('#onboardPrev')?.addEventListener('click', () => saveStep(index - 1));
  $('#onboardNext')?.addEventListener('click', () => saveStep(index + 1));
  $('#beginLessonZero')?.addEventListener('click', () => { profile = { ...profile, onboardingComplete: true, onboardingStep: onboarding.length, currentLessonId: 'program' }; replaceProfile(profile); showLesson('program', 0); });
}

function lessonStatus(lesson, index) {
  const progress = LearningStorage.progress(profile, lesson.id);
  if (!LearningStorage.unlocked(profile, index)) return { label: `先完成第 ${index - 1} 课`, locked: true };
  if (progress.passed) return { label: '已完成 · 可复习', done: true };
  if (progress.visited.length) return { label: `继续第 ${progress.page + 1} / ${lesson.pages.length} 页` };
  return { label: '尚未开始' };
}

function renderDashboard() {
  document.body.classList.remove('booting');
  if (!profile) { $('.app-shell').hidden = true; showWelcome(); return; }
  $('.app-shell').hidden = false; $('#firstRun')?.setAttribute('hidden', '');
  $('#profileName').textContent = profile.nickname; $('#avatar').textContent = profile.nickname.slice(0, 1).toUpperCase();
  $('#profileMeta').textContent = `${profile.dailyMinutes} 分钟/天 · 本机档案`; $('#streakCount').textContent = profile.streak || 0;
  $('#welcomeEyebrow').textContent = profile.lastStudiedAt ? `WELCOME BACK, ${profile.nickname.toUpperCase()}` : `WELCOME, ${profile.nickname.toUpperCase()}`;
  $('#welcomeTitle').textContent = profile.lastStudiedAt ? '继续探索程序的内部世界。' : '准备好从程序是什么开始了吗？';
  $('#welcomeSubtitle').textContent = profile.goal ? `学习目标：${profile.goal}` : '每个新概念都会从已经学过的知识开始。';
  const studied = new Set(profile.studyDays || []); const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  $('#weekDays').innerHTML = Array.from({ length: 7 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return `<i class="${studied.has(date.toISOString().slice(0, 10)) ? 'done' : ''}">${weekdays[date.getDay()]}</i>`; }).join('');
  const passed = lessons.filter((lesson) => LearningStorage.progress(profile, lesson.id).passed).length; const percent = Math.round(passed / lessons.length * 100);
  $('#progressPercent').textContent = percent; $('#progressCount').textContent = `${passed} / ${lessons.length}`; $('#studyMinutes').textContent = profile.lastStudiedAt ? `最近学习 ${new Date(profile.lastStudiedAt).toLocaleDateString('zh-CN')}` : '还没有学习记录'; $('#progressRing').style.background = `conic-gradient(var(--purple) ${percent}%,#eef0f3 0)`;
  $('#moduleProgress').innerHTML = `<div class="module-row ${passed ? '' : 'muted'}"><div class="module-index ${passed === 3 ? 'complete' : 'current'}">${passed === 3 ? '✓' : '00'}</div><div><strong>00 · 零基础入门</strong><div class="bar"><i style="width:${percent}%"></i></div></div><span>${passed} / 3</span></div>`;
  $('#mistakeBadge').textContent = profile.mistakes.length;
  $('#mistakePreview').innerHTML = profile.mistakes.length ? profile.mistakes.slice(-2).reverse().map((item) => { const lesson = getLesson(item.lessonId); return `<div class="weak-item"><div class="weak-icon">?</div><div><strong>${lesson ? lesson.title : '课程记录'}</strong><span>${lesson ? lesson.questions[item.questionIndex].q : '题目数据不可用'}</span></div><span class="tag danger">需复习</span></div>`; }).join('') : '<div class="empty-state">还没有错题。完成理解检查后，这里会显示真实记录。</div>';
  const currentIndex = Math.max(0, lessons.findIndex((lesson) => lesson.id === profile.currentLessonId)); const current = lessons[currentIndex]; const progress = LearningStorage.progress(profile, current.id);
  $('.lesson-number').textContent = `LESSON ${String(current.number).padStart(2, '0')}`; $('.card-main h2').textContent = current.title; $('.card-main > p').textContent = current.pages[0].html.replace(/<[^>]*>/g, '').slice(0, 100); $('.lesson-meta span:first-child').textContent = '阶段 00 · 零基础入门'; $('#currentPosition').textContent = progress.visited.length ? `第 ${progress.page + 1} / ${current.pages.length} 页` : '尚未开始';
  const allPassed = passed === lessons.length; $('#continueBtn').firstChild.textContent = allPassed ? '复习本阶段 ' : progress.visited.length ? '继续学习 ' : '开始学习 ';
}

function showCourses() {
  if (!profile) return showWelcome(); if (!profile.onboardingComplete) return showOnboarding();
  openDialog('课程地图', '真实进度 · 完成检查后解锁');
  dialogBody.innerHTML = `<div class="course-map focused">${lessons.map((lesson, index) => { const status = lessonStatus(lesson, index); return `<button class="course-button ${status.done ? 'done' : ''}" data-lesson="${lesson.id}" ${status.locked ? 'disabled' : ''}><span>${status.done ? '✓' : status.locked ? '⌕' : lesson.number}</span><div><strong>第 ${lesson.number} 课 · ${lesson.title}</strong><small>${status.label} · ${lesson.duration} 分钟</small></div></button>`; }).join('')}</div><div class="empty-state">后续汇编课程将在完成本入门阶段后开放，目前不显示虚假完成状态。</div>`;
  $$('[data-lesson]', dialogBody).forEach((button) => button.addEventListener('click', () => showLesson(button.dataset.lesson)));
}

function showLesson(id, requestedPage) {
  if (!profile?.onboardingComplete) return showOnboarding();
  const index = lessons.findIndex((lesson) => lesson.id === id); if (index < 0) return notify('课程数据不存在。', true);
  if (!LearningStorage.unlocked(profile, index)) { notify(`课程尚未解锁：请先完成第 ${index - 1} 课的教学步骤和理解检查。`, true); return showCourses(); }
  activeLesson = lessons[index]; const saved = LearningStorage.progress(profile, id); const page = requestedPage === undefined ? saved.page : Math.max(0, Math.min(requestedPage, activeLesson.pages.length - 1));
  profile = LearningStorage.setCourseProgress(profile, id, { page, visited: [...new Set([...saved.visited, page])] }); replaceProfile(profile); renderLessonPage(page);
}

function renderLessonPage(pageIndex) {
  const lesson = activeLesson; const page = lesson.pages[pageIndex]; const progress = LearningStorage.progress(profile, lesson.id); openDialog(`第 ${lesson.number} 课 · ${lesson.title}`, `预计 ${lesson.duration} 分钟`);
  const ready = LearningStorage.canTakeCheck(progress, lesson.pages.length, lesson.requiredInteractions);
  dialogBody.innerHTML = `<article class="lesson-page"><div class="page-meter"><i style="width:${((pageIndex + 1) / lesson.pages.length) * 100}%"></i></div><div class="lesson-page-heading"><small>教学 ${pageIndex + 1} / ${lesson.pages.length}</small><h3>${page.title}</h3></div>${page.html}${page.summary ? `<label class="summary-box">我的总结<textarea id="lessonSummary" placeholder="用自己的话写两三句话……">${safe(progress.summary)}</textarea><small>总结不会按措辞评分，但必须先思考和填写。</small></label><button class="primary" id="saveSummary">保存总结</button><section class="check-gate"><h3>理解检查</h3><p>${ready ? '教学步骤与必要互动已完成，可以开始检查。' : '请先完成全部教学页面、两个互动，并保存自己的总结。'}</p><button id="startCheck" ${ready ? '' : 'disabled'}>开始 3 道理解检查</button></section>` : ''}<div class="lesson-tools"><button id="prevPage" ${pageIndex === 0 ? 'disabled' : ''}>上一步</button><button id="confused">我没看懂</button><button id="alternative">查看另一种解释</button><button id="fullExample">查看完整示例</button><button id="courseMap">返回课程地图</button><button class="primary" id="nextPage" ${pageIndex === lesson.pages.length - 1 ? 'disabled' : ''}>下一步</button></div><aside id="helpLayer" class="help-layer" hidden></aside></article>`;
  bindLessonInteractions(pageIndex);
}

function updateProgress(changes) { profile = LearningStorage.setCourseProgress(profile, activeLesson.id, changes); replaceProfile(profile); }
function markInteraction(name) { const progress = LearningStorage.progress(profile, activeLesson.id); if (!progress.interactions.includes(name)) updateProgress({ interactions: [...progress.interactions, name] }); }
function bindLessonInteractions(pageIndex) {
  const lesson = activeLesson;
  $('#prevPage').addEventListener('click', () => showLesson(lesson.id, pageIndex - 1)); $('#nextPage').addEventListener('click', () => showLesson(lesson.id, pageIndex + 1)); $('#courseMap').addEventListener('click', showCourses);
  const help = (message) => { $('#helpLayer').hidden = false; $('#helpLayer').textContent = message; };
  $('#confused').addEventListener('click', () => help('换成最简单的说法：先不要记术语。把当前概念想成贴了编号的盒子或按步骤执行的菜谱，再回到上面的具体例子逐句对照。'));
  $('#alternative').addEventListener('click', () => help('另一种解释：关注“输入发生了什么变化，得到什么输出”。能预测一个最小例子的结果，就已经理解了核心，而不需要立刻背定义。'));
  $('#fullExample').addEventListener('click', () => help('完整学习路径：读问题 → 找出已知内容 → 操作互动 → 用自己的话描述观察 → 再参加理解检查。'));
  $$('.term', dialogBody).forEach((button) => button.addEventListener('click', () => { const [cn, en, meaning] = button.dataset.term.split('|'); help(`${cn}（${en}）：${meaning}`); }));
  $$('.reveal-example', dialogBody).forEach((button) => button.addEventListener('click', () => { help(button.dataset.reveal); markInteraction(`example-${pageIndex}`); }));
  const flow = $('[data-flow]'); if (flow) { let count = 0; $$('button', flow).forEach((button, index) => button.addEventListener('click', () => { if (index === count) { button.classList.add('active'); count += 1; if (count === 4) markInteraction('flow'); } else help('请从“源代码”开始按箭头顺序点击。'); })); }
  $$('[data-legal]', dialogBody).forEach((button) => button.addEventListener('click', () => { help(button.dataset.legal === 'true' ? '这是合法学习场景，但仍需遵守样本的具体授权范围。' : '这超出本课程边界：没有明确授权时不能进行。'); markInteraction('scenarios'); }));
  const bits = $('[data-bits]'); if (bits) { bits.innerHTML = Array.from({ length: 8 }, (_, i) => `<button data-weight="${2 ** (7 - i)}">0<small>${2 ** (7 - i)}</small></button>`).join(''); let changed = 0; $$('button', bits).forEach((button) => button.addEventListener('click', () => { button.classList.toggle('on'); button.firstChild.textContent = button.classList.contains('on') ? '1' : '0'; changed += 1; const binary = $$('button', bits).map((item) => item.classList.contains('on') ? '1' : '0').join(''); $('.demo-output').textContent = `十进制：${parseInt(binary, 2)} · 二进制：${binary}`; if (changed >= 2) markInteraction('bits'); })); }
  const range = $('[data-range]'); if (range) $('input', range).addEventListener('input', (event) => { $('output', range).textContent = `${event.target.value} → ${Number(event.target.value).toString(2).padStart(8, '0')}`; markInteraction('range'); });
  const hex = $('[data-hex]'); if (hex) $$('button', hex).forEach((button) => button.addEventListener('click', () => { $('.demo-output').textContent = `0x${button.textContent} ↔ ${parseInt(button.textContent, 16).toString(2).padStart(4, '0')}`; markInteraction('hex'); }));
  const memory = $('[data-memory]'); if (memory) { memory.innerHTML = ['2A','00','41','FF'].map((value, i) => `<button data-address="0x${(0x1000 + i).toString(16).toUpperCase()}"><small>0x${(0x1000 + i).toString(16).toUpperCase()}</small>${value}</button>`).join(''); $$('button', memory).forEach((button) => button.addEventListener('click', () => { $('.demo-output').textContent = `地址 ${button.dataset.address} 中保存的数据是 0x${button.lastChild.textContent || button.textContent.slice(-2)}`; markInteraction('memory'); })); }
  const write = $('[data-memory-write]'); if (write) $('button', write).addEventListener('click', () => { const value = $('input', write).value.toUpperCase(); if (!/^[0-9A-F]{2}$/.test(value)) return help('请输入恰好两个十六进制字符，例如 41。'); $('output', write).textContent = `${$('select', write).value} 中的数据已变为 0x${value}`; markInteraction('memory-write'); });
  $('#saveSummary')?.addEventListener('click', () => { const summary = $('#lessonSummary').value.trim(); if (!summary) return notify('请先用自己的话填写总结。', true); updateProgress({ summary }); notify('总结已保存'); renderLessonPage(pageIndex); });
  $('#startCheck')?.addEventListener('click', showCheck);
}

function showCheck(questionIndex = 0) {
  const progress = LearningStorage.progress(profile, activeLesson.id); const ready = LearningStorage.canTakeCheck(progress, activeLesson.pages.length, activeLesson.requiredInteractions);
  if (!ready) return notify('不能跳过：请完成全部教学页面、必要互动和自己的总结。', true);
  const q = activeLesson.questions[questionIndex]; openDialog(`${activeLesson.title} · 理解检查`, `第 ${questionIndex + 1} / 3 题`);
  dialogBody.innerHTML = `<div class="quiz check"><h3>${q.q}</h3><div class="answers">${q.options.map((option, i) => `<button data-answer="${i}">${option}</button>`).join('')}</div><div id="feedback" aria-live="polite"></div><button class="back-link" id="backToLesson">← 返回教学页面</button></div>`;
  $$('[data-answer]', dialogBody).forEach((button) => button.addEventListener('click', () => grade(questionIndex, Number(button.dataset.answer)))); $('#backToLesson').addEventListener('click', () => renderLessonPage(activeLesson.pages.length - 1));
}

function grade(questionIndex, selected) {
  const q = activeLesson.questions[questionIndex]; const correct = selected === q.answer; const attempt = { lessonId: activeLesson.id, questionIndex, selected, correct, at: new Date().toISOString() };
  const progress = LearningStorage.progress(profile, activeLesson.id); const answers = [...progress.answers.filter((answer) => answer.questionIndex !== questionIndex), { questionIndex, correct }];
  profile = { ...profile, answerHistory: [...profile.answerHistory, attempt], mistakes: correct ? profile.mistakes.filter((item) => !(item.lessonId === activeLesson.id && item.questionIndex === questionIndex)) : [...profile.mistakes.filter((item) => !(item.lessonId === activeLesson.id && item.questionIndex === questionIndex)), attempt] };
  updateProgress({ answers }); const feedback = $('#feedback'); feedback.className = correct ? 'correct layered-feedback' : 'incorrect layered-feedback';
  const wrongReason = !correct ? q.wrong[selected > q.answer ? selected - 1 : selected] || '这个选项混淆了本节中的两个概念。' : '';
  feedback.innerHTML = `<strong>${correct ? '回答正确。' : '这次没有答对，不会扣分。'}</strong><p>${wrongReason}</p><p><b>概念回顾：</b>${q.explanation}</p>${correct ? `<button id="continueCheck">${questionIndex < 2 ? '下一题' : '完成本课'}</button>` : '<button id="retryQuestion">用更简单的解释再试一次</button>'}`;
  $$('.answers button', dialogBody).forEach((button, i) => { button.disabled = true; if (i === q.answer) button.classList.add('right'); });
  $('#retryQuestion')?.addEventListener('click', () => { feedback.innerHTML = `<p><b>更简单地想：</b>${q.explanation}</p><button id="retryNow">重新选择</button>`; $('#retryNow').addEventListener('click', () => showCheck(questionIndex)); });
  $('#continueCheck')?.addEventListener('click', () => { if (questionIndex < 2) return showCheck(questionIndex + 1); const latest = LearningStorage.progress(profile, activeLesson.id); if (LearningStorage.canPass(latest, activeLesson.questions.length)) completeLesson(); else showCheck(0); });
}

function completeLesson() {
  const now = new Date().toISOString(); updateProgress({ passed: true, completedAt: now }); const index = lessons.indexOf(activeLesson); const next = lessons[index + 1];
  openDialog('本课完成', '知识回顾'); dialogBody.innerHTML = `<div class="completion"><span>✓</span><h3>${activeLesson.title}</h3><p>你完成了全部教学步骤、互动、总结和 3 道理解检查。</p><div class="theory"><b>本节知识回顾</b><p>${activeLesson.questions.map((q) => q.explanation).join(' ')}</p></div><p>${activeLesson.next}</p>${next ? `<button class="primary" id="nextLesson">进入第 ${next.number} 课 →</button>` : '<button class="primary" id="reviewStage">复习本阶段 →</button>'}<button class="back-link" id="completedMap">返回课程地图</button></div>`;
  $('#nextLesson')?.addEventListener('click', () => showLesson(next.id, 0)); $('#reviewStage')?.addEventListener('click', showCourses); $('#completedMap').addEventListener('click', showCourses); renderDashboard();
}

function showMistakes() { if (!profile) return showWelcome(); openDialog('错题本', `${profile.mistakes.length} 道待复习`); dialogBody.innerHTML = profile.mistakes.length ? `<div class="mistake-list">${profile.mistakes.map((item) => { const lesson = getLesson(item.lessonId); return `<button data-review="${item.lessonId}" data-question="${item.questionIndex}"><strong>${lesson.title}</strong><span>${lesson.questions[item.questionIndex].q}</span><small>查看解释并重试 →</small></button>`; }).join('')}</div>` : '<div class="empty-state">还没有错题。答错不会受到惩罚；错误原因和复习入口会出现在这里。</div>'; $$('[data-review]', dialogBody).forEach((button) => button.addEventListener('click', () => { activeLesson = getLesson(button.dataset.review); showCheck(Number(button.dataset.question)); })); }
function showTerms() { openDialog('术语词典', '前三课已讲解术语'); const terms = [['程序','program','让计算机完成任务的指令集合'],['源代码','source code','便于人阅读的程序文本'],['编译器','compiler','把源代码翻译成可执行形式的工具'],['逆向工程','reverse engineering','从已有程序结构与行为推断工作方式'],['位','bit','保存 0 或 1 的最小信息单位'],['字节','byte','由 8 个位组成的数据单位'],['十六进制','hexadecimal','以 16 为基数的记数方式'],['内存地址','memory address','定位内存位置的编号']]; dialogBody.innerHTML = `<div class="term-list">${terms.map(([cn,en,meaning]) => `<article><b>${cn}</b><small>${en}</small><p>${meaning}</p></article>`).join('')}</div>`; }
function showProfiles() { openDialog('本机学习档案', '进度彼此完全隔离'); dialogBody.innerHTML = `<div class="profile-list">${data.profiles.map((item) => `<button data-switch="${item.id}" class="${item.id === data.activeProfileId ? 'active' : ''}"><span>${safe(item.nickname.slice(0, 1))}</span><div><strong>${safe(item.nickname)}</strong><small>${item.id === data.activeProfileId ? '当前档案' : '切换到此档案'}</small></div></button>`).join('')}</div><div class="profile-actions"><button id="newProfile">新增学习者</button><button id="editProfile">修改当前档案</button><button class="danger-button" id="deleteProfile">删除当前档案</button></div>`; $$('[data-switch]', dialogBody).forEach((button) => button.addEventListener('click', () => { data = { ...data, activeProfileId: button.dataset.switch }; profile = LearningStorage.active(data); persist(); closeDialog(); renderDashboard(); notify(`已切换到 ${profile.nickname}`); })); $('#newProfile').addEventListener('click', () => showProfileForm()); $('#editProfile').addEventListener('click', () => showProfileForm(profile)); $('#deleteProfile').addEventListener('click', () => { if (!window.confirm(`确定要删除“${profile.nickname}”吗？此操作无法撤销。`)) return; if (!window.confirm('请再次确认：该学习者的课程进度、答题和错题记录都会删除。')) return; data = LearningStorage.deleteProfile(data, profile.id); profile = LearningStorage.active(data); persist(); closeDialog(); renderDashboard(); if (!profile) showWelcome(); }); }
function showSettings() { openDialog('设置', '本机数据管理'); dialogBody.innerHTML = `<div class="settings-panel"><h3>离线数据</h3><p>所有档案都保存在当前浏览器的 localStorage 中，不会上传。</p>${loaded.legacy ? '<div class="legacy-note">检测到旧版测试数据。新版不会把它计入任何学习者。</div>' : ''}<button class="danger-button" id="clearData">清除测试数据并重新开始</button><small>此操作会说明影响并要求二次确认。</small></div>`; $('#clearData').addEventListener('click', () => { if (!window.confirm('将清除本应用的旧测试数据和全部本机学习档案。是否继续？')) return; if (!window.confirm('再次确认：清除后无法恢复。')) return; store.clearTestData(); data = LearningStorage.emptyState(); profile = null; loaded = { data, error: null, legacy: false }; closeDialog(); renderDashboard(); showWelcome(); }); }

$('#closeDialog').addEventListener('click', closeDialog); backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeDialog(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDialog(); });
$$('[data-action="courses"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showCourses(); })); $$('[data-action="mistakes"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showMistakes(); })); $$('[data-action="terms"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showTerms(); })); $$('[data-action="settings"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showSettings(); }));
$('#profileMenu').addEventListener('click', showProfiles); $('#continueBtn').addEventListener('click', () => { if (!profile.onboardingComplete) return showOnboarding(); showLesson(profile.currentLessonId || 'program'); }); $('#challengeBtn').addEventListener('click', () => profile ? showCourses() : showWelcome()); $('.secondary').addEventListener('click', showMistakes); $('.brand').addEventListener('click', (event) => { event.preventDefault(); closeDialog(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
$$('.top-actions .icon-button').forEach((button, index) => button.addEventListener('click', () => index === 0 ? showTerms() : notify('目前没有新的本机学习提醒。'))); $('.weak-panel .panel-title button').addEventListener('click', showMistakes);
if (loaded.error) notify(loaded.error, true); renderDashboard();
