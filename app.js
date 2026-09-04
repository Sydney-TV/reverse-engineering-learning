(function () {
  const { lessons, terms } = CourseData;
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const modal = document.querySelector('#modal');
  let currentView = 'home';
  let lessonSession = null;
  let simulator = null;
  let lessonObserver = null;

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const button = (label, attrs = '', help = label) => `<button ${attrs} data-help="${escapeHtml(help)}">${label}</button>`;
  const lessonById = id => lessons.find(item => item.id === id);
  const allQuestions = lesson => [lesson.prediction, lesson.practice, ...lesson.quiz];

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function setHeader(name, detail = '概览') {
    document.querySelector('#pageName').textContent = name;
    document.querySelector('#pageDetail').textContent = detail;
  }

  function updateChrome() {
    document.querySelector('#mistakeBadge').textContent = ProgressStore.stats().mistakes;
    document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('active', item.dataset.view === currentView));
  }

  function navigate(view, options = {}) {
    simulator?.pause();
    lessonObserver?.disconnect();
    currentView = view;
    document.body.classList.remove('menu-open');
    if (view === 'lesson') renderLesson(options.id || ProgressStore.get().lastLessonId);
    else ({ home: renderHome, map: renderMap, courses: renderCourses, mistakes: renderMistakes, progress: renderProgress, terms: renderTerms, settings: renderSettings }[view] || renderHome)();
    updateChrome();
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function nextLesson() {
    const state = ProgressStore.get();
    const incomplete = lessons.find((lesson, index) => ProgressStore.isUnlocked(index, lessons) && !state.lessons[lesson.id]?.completed);
    return incomplete || lessons.find(item => item.id === state.lastLessonId) || lessons[0];
  }

  function renderHome() {
    setHeader('学习首页');
    const stats = ProgressStore.stats();
    const lesson = nextLesson();
    const percent = Math.round(stats.completed / lessons.length * 100);
    const openMistakes = Object.values(ProgressStore.get().mistakes).filter(item => !item.mastered).slice(0, 2);
    app.innerHTML = `
      <section class="welcome"><div><p class="eyebrow">SAFE LEARNING LAB</p><h1>${stats.completed ? '继续探索程序的内部世界。' : '从第一条知识开始理解程序。'}</h1><p>所有示例均由项目编写，只模拟基础指令，不运行或上传任意程序。</p></div><div class="stat-chip"><strong>${stats.completed}/${lessons.length}</strong><span>课程完成</span></div></section>
      <section class="continue-card"><div class="card-main"><div class="section-heading"><span class="pulse"></span>${stats.completed === lessons.length ? '回顾课程' : '继续学习'} <em>预计 ${lesson.minutes} 分钟</em></div><div class="lesson-number">LESSON ${String(lesson.number).padStart(2, '0')}</div><h2>${lesson.title}</h2><p>${lesson.summary}</p><div class="lesson-meta"><span>${ProgressStore.get().lessons[lesson.id]?.completed ? '已完成 · 可随时复习' : `上次位置：第 ${ProgressStore.get().lastSection + 1} 个环节`}</span></div>${button('进入课程 <span>→</span>', `class="primary" data-action="open-lesson" data-id="${lesson.id}"`, `进入《${lesson.title}》`)}</div>
      <div class="code-visual"><div class="window-bar"><i></i><i></i><i></i><span>safe_demo.asm</span></div><pre><span class="line"><b>01</b> MOV  RAX, <em>5</em></span>\n<span class="line active"><b>02</b> CMP  RAX, <em>5</em><u>← NEXT</u></span>\n<span class="line"><b>03</b> JE   <strong>equal</strong></span></pre><div class="register"><span>RAX</span><strong>0000 0000 0000 0005</strong></div><div class="flags"><span>FLAGS</span><b>ZF <i>?</i></b></div></div></section>
      <div class="grid"><section class="panel"><div class="panel-title"><div><span>实际学习进度</span><small>数据自动保存在本浏览器</small></div>${button('查看详情 →', 'class="text-button" data-action="nav" data-view="progress"', '打开学习进度页面')}</div><div class="metric-row"><div class="ring" style="background:conic-gradient(var(--purple) ${percent}%,#eef0f3 0)"><span><strong>${percent}</strong><small>%</small></span></div><div class="metrics"><b>${stats.completed}</b><span>已完成课程</span><b>${stats.accuracy}%</b><span>累计正确率</span></div></div></section>
      <section class="panel"><div class="panel-title"><div><span>需要巩固</span><small>${stats.mistakes ? '来自你的真实错题' : '答错的题目会出现在这里'}</small></div></div>${openMistakes.length ? openMistakes.map(item => `<div class="weak-item"><div class="weak-icon">?</div><div><strong>${item.prompt}</strong><span>尚未掌握</span></div></div>`).join('') : '<div class="empty compact">目前没有待复习错题，继续保持！</div>'}${button('打开错题本 <span>→</span>', 'class="secondary" data-action="nav" data-view="mistakes"', '前往错题本重新作答')}</section></div>`;
  }

  function statusFor(index) {
    const complete = ProgressStore.get().lessons[lessons[index].id]?.completed;
    if (complete) return ['已完成', 'complete'];
    if (ProgressStore.isUnlocked(index, lessons)) return ['进行中', 'current'];
    return ['未解锁', 'locked'];
  }

  function courseCards(context) {
    return lessons.map((lesson, index) => {
      const [label, status] = statusFor(index);
      const locked = status === 'locked';
      return `<article class="course-card ${status}"><div class="course-no">0${lesson.number}</div><div><span class="status-label">${label}</span><h3>${lesson.title}</h3><p>${lesson.summary}</p><small>${lesson.minutes} 分钟 · 5 个练习检查点</small></div>${button(locked ? '需要先完成上一课' : status === 'complete' ? '重新学习' : '开始学习', `class="${locked ? 'disabled' : 'course-open'}" ${locked ? 'disabled' : `data-action="open-lesson" data-id="${lesson.id}"`}`, locked ? `完成《${lessons[index - 1].title}》后自动解锁` : `打开《${lesson.title}》`)}</article>`;
    }).join('');
  }

  function renderMap() { setHeader('学习地图', '课程路径'); app.innerHTML = `<section class="page-heading"><p class="eyebrow">LEARNING PATH</p><h1>从数字到条件跳转</h1><p>按顺序完成课程；达到合格条件后，下一课会自动解锁。</p></section><div class="learning-map">${courseCards('map')}</div>`; }
  function renderCourses() { setHeader('课程中心', '全部课程'); app.innerHTML = `<section class="page-heading"><p class="eyebrow">COURSE LIBRARY</p><h1>三节零基础课程</h1><p>每节都包含讲解、预测、模拟练习、课后题与分层提示。</p></section><div class="course-list">${courseCards('courses')}</div>`; }

  function createSession(lesson) {
    return { lesson, correct: new Set(), hintLevels: {}, feedback: {}, section: ProgressStore.get().lastLessonId === lesson.id ? ProgressStore.get().lastSection : 0, simulatorComplete: false };
  }

  function questionMarkup(question, group) {
    const feedback = lessonSession.feedback[question.id];
    const hintLevel = lessonSession.hintLevels[question.id] || 0;
    const isNumber = question.type === 'number';
    return `<article class="question-card" data-question="${question.id}"><span class="question-kind">${group}</span><h3>${question.prompt}</h3><div class="answer-area">${isNumber ? `<input type="text" name="${question.id}" placeholder="例如：0x1F" aria-label="${escapeHtml(question.prompt)}">` : question.options.map(option => `<label><input type="radio" name="${question.id}" value="${escapeHtml(option)}"><span>${option}</span></label>`).join('')}</div><div class="question-actions">${button('提交答案', `class="answer-submit" data-action="answer" data-id="${question.id}"`, '提交当前答案并自动判题')}${button(`查看提示${hintLevel ? ` ${hintLevel}/3` : ''}`, `class="hint-button" data-action="hint" data-id="${question.id}"`, '逐层查看概念提示、位置提示和完整答案')}</div>${hintLevel ? `<div class="hint-box"><strong>第 ${hintLevel} 层提示</strong><p>${question.hints[hintLevel - 1]}</p></div>` : ''}${feedback ? `<div class="feedback ${feedback.correct ? 'success' : 'error'}"><strong>${feedback.correct ? '回答正确' : '还没有答对'}</strong><p>${feedback.text}</p>${feedback.correct ? `<details><summary>查看答案解析</summary><p>${question.explanation}</p></details>` : ''}</div>` : ''}</article>`;
  }

  function renderLesson(id) {
    const lesson = lessonById(id) || lessons[0];
    const index = lessons.indexOf(lesson);
    if (!ProgressStore.isUnlocked(index, lessons)) { notify('请先完成上一课，之后会自动解锁。'); return navigate('map'); }
    if (!lessonSession || lessonSession.lesson.id !== id) lessonSession = createSession(lesson);
    ProgressStore.setPosition(id, lessonSession.section);
    setHeader('课程中心', `第 ${lesson.number} 课`);
    const score = lessonSession.correct.size;
    const completed = ProgressStore.get().lessons[id]?.completed;
    app.innerHTML = `<section class="lesson-header"><div><button class="back-button" data-action="nav" data-view="courses" data-help="返回课程中心">← 返回课程中心</button><p class="eyebrow">LESSON ${String(lesson.number).padStart(2, '0')} · ${lesson.minutes} MIN</p><h1>${lesson.title}</h1><p>${lesson.summary}</p></div><div class="lesson-score"><strong>${score}/5</strong><span>本次已通过检查点</span></div></section>
      <section class="objective"><span>本节学习目标</span><p>${lesson.objective}</p></section>
      <div class="lesson-layout"><aside class="lesson-toc"><strong>课程步骤</strong>${['知识讲解', '预测题', '交互练习', '课后题', '完成课程'].map((label, i) => `<button data-action="lesson-section" data-section="${i}" data-help="跳到${label}" class="${lessonSession.section === i ? 'active' : ''}"><i>${i + 1}</i>${label}</button>`).join('')}</aside><div class="lesson-body">
      <section id="section-0" class="lesson-section">${lesson.sections.map(section => `<article class="knowledge"><h2>${section.title}</h2>${section.html}</article>`).join('')}</section>
      <section id="section-1" class="lesson-section"><h2>先预测，再验证</h2>${questionMarkup(lesson.prediction, '预测题')}</section>
      <section id="section-2" class="lesson-section"><h2>动手操作</h2>${lesson.practice.type === 'sim' ? simulatorMarkup(lesson) : questionMarkup(lesson.practice, '交互练习')}</section>
      <section id="section-3" class="lesson-section"><h2>课后检查</h2><p class="section-intro">三道题中至少答对两道，并完成预测题与交互练习，即可合格。</p>${lesson.quiz.map(item => questionMarkup(item, '课后题')).join('')}</section>
      <section id="section-4" class="lesson-section completion-card"><span class="finish-icon">✓</span><h2>${completed ? '本课已经完成' : '准备完成本课了吗？'}</h2><p>合格条件：预测题正确、交互练习完成、三道课后题至少答对两道。</p><div class="requirement-list" id="requirements">${requirementsMarkup(lesson)}</div>${button(completed ? '返回学习地图' : '检查并完成本课', `class="primary finish-button" data-action="${completed ? 'nav' : 'complete-lesson'}" ${completed ? 'data-view="map"' : ''}`, completed ? '返回学习地图查看进度' : '检查合格条件并完成课程')}</section></div></div>`;
    if (lesson.practice.type === 'sim') mountSimulator(lesson);
    requestAnimationFrame(() => {
      document.querySelector(`#section-${lessonSession.section}`)?.scrollIntoView({ block: 'start' });
      observeLessonPosition();
    });
  }

  // 将当前阅读到的课程环节作为“最后学习位置”持续保存。
  function observeLessonPosition() {
    lessonObserver?.disconnect();
    if (!('IntersectionObserver' in window)) return;
    lessonObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible || !lessonSession) return;
      const section = Number(visible.target.id.replace('section-', ''));
      if (section === lessonSession.section) return;
      lessonSession.section = section;
      ProgressStore.setPosition(lessonSession.lesson.id, section);
      document.querySelectorAll('.lesson-toc button').forEach(item => item.classList.toggle('active', Number(item.dataset.section) === section));
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0, .25, .5] });
    document.querySelectorAll('.lesson-section').forEach(section => lessonObserver.observe(section));
  }

  function requirementsMarkup(lesson) {
    const passedQuiz = lesson.quiz.filter(q => lessonSession.correct.has(q.id)).length;
    const checks = [
      [lessonSession.correct.has(lesson.prediction.id), '预测题回答正确'],
      [lesson.practice.type === 'sim' ? lessonSession.simulatorComplete : lessonSession.correct.has(lesson.practice.id), '交互练习完成'],
      [passedQuiz >= 2, `课后题答对 ${passedQuiz}/3（需要 2 道）`]
    ];
    return checks.map(([ok, text]) => `<div class="requirement ${ok ? 'met' : ''}"><span>${ok ? '✓' : '○'}</span>${text}</div>`).join('');
  }

  function simulatorMarkup(lesson) {
    return `<article class="question-card simulator-card"><span class="question-kind">安全汇编演示器</span><h3>${lesson.practice.prompt}</h3><div class="sim-grid"><div class="sim-code" id="simCode"></div><div><div class="register-grid" id="simRegisters"></div><div class="zf-card">ZF <strong id="simZF">0</strong></div></div></div><div class="sim-status"><b>步骤解释</b><p id="simMessage"></p><small id="simNext"></small></div><div class="sim-actions">${button('单步执行', 'data-action="sim-step"', '只执行当前高亮的一条指令')}${button('自动执行', 'data-action="sim-auto"', '每隔 700 毫秒自动执行一条指令')}${button('暂停', 'data-action="sim-pause"', '暂停自动执行，保留当前状态')}${button('重置', 'data-action="sim-reset"', '恢复寄存器、ZF 和执行位置')}</div><div id="simFeedback"></div></article>`;
  }

  function mountSimulator(lesson) {
    simulator = new AssemblySimulator(lesson.practice.program, state => {
      const code = document.querySelector('#simCode');
      if (!code) return;
      code.innerHTML = lesson.practice.program.map((line, i) => `<div class="${i === state.ip ? 'active' : ''} ${i < state.ip ? 'executed' : ''}"><b>${String(i + 1).padStart(2, '0')}</b><code>${escapeHtml(line)}</code>${i === state.ip ? '<span>当前</span>' : ''}</div>`).join('');
      document.querySelector('#simRegisters').innerHTML = Object.entries(state.registers).map(([name, value]) => `<div><span>${name}</span><strong>${value}</strong><small>0x${value.toString(16).toUpperCase()}</small></div>`).join('');
      document.querySelector('#simZF').textContent = state.zf;
      document.querySelector('#simMessage').textContent = state.message;
      document.querySelector('#simNext').textContent = state.finished ? '下一条：程序结束' : `下一条：${lesson.practice.program[state.ip]}`;
      if (state.finished) {
        const success = lesson.id === 'mov' ? state.registers.RDX === 12 : state.registers.RCX === 1;
        if (success && !lessonSession.simulatorComplete) {
          lessonSession.simulatorComplete = true;
          lessonSession.correct.add(lesson.practice.id);
          ProgressStore.recordAttempt(lesson.practice, '演示器执行完成', true, lesson.id);
          document.querySelector('#simFeedback').innerHTML = `<div class="feedback success"><strong>交互练习完成</strong><p>${lesson.practice.explanation}</p></div>`;
          const requirement = document.querySelector('#requirements');
          if (requirement) requirement.innerHTML = requirementsMarkup(lesson);
          notify('演示器运行正确，交互练习已通过。');
        }
      }
    });
  }

  function findQuestion(id) {
    for (const lesson of lessons) {
      const question = allQuestions(lesson).find(item => item.id === id);
      if (question) return { lesson, question };
    }
    return {};
  }

  function submitAnswer(id) {
    const { lesson, question } = findQuestion(id);
    const container = document.querySelector(`[data-question="${id}"]`);
    const input = container?.querySelector(`input[name="${id}"]:checked`) || container?.querySelector(`input[name="${id}"][type="text"]`);
    if (!input || !input.value.trim()) return notify('请先选择或填写一个答案。');
    const normalize = value => value.trim().toLowerCase().replace(/\s+/g, '');
    const correct = normalize(input.value) === normalize(question.answer);
    ProgressStore.recordAttempt(question, input.value, correct, lesson.id);
    lessonSession.feedback[id] = { correct, text: correct ? '很好，你已经掌握了这个检查点。' : '答案暂时不正确。先查看第一层提示，再回到讲解中寻找依据。' };
    if (correct) lessonSession.correct.add(id);
    renderLesson(lesson.id);
    requestAnimationFrame(() => document.querySelector(`[data-question="${id}"]`)?.scrollIntoView({ block: 'center' }));
    notify(correct ? '回答正确，进度已自动保存。' : '已记录错题，可以逐层查看提示。');
  }

  function showHint(id) {
    lessonSession.hintLevels[id] = Math.min(3, (lessonSession.hintLevels[id] || 0) + 1);
    const lessonId = lessonSession.lesson.id;
    renderLesson(lessonId);
    requestAnimationFrame(() => document.querySelector(`[data-question="${id}"]`)?.scrollIntoView({ block: 'center' }));
  }

  function completeCurrentLesson() {
    const lesson = lessonSession.lesson;
    const quizCorrect = lesson.quiz.filter(q => lessonSession.correct.has(q.id)).length;
    const practiceOk = lesson.practice.type === 'sim' ? lessonSession.simulatorComplete : lessonSession.correct.has(lesson.practice.id);
    const qualified = lessonSession.correct.has(lesson.prediction.id) && practiceOk && quizCorrect >= 2;
    if (!qualified) return notify('尚未达到合格条件，请完成列表中未通过的项目。');
    const score = Math.round(lessonSession.correct.size / 5 * 100);
    ProgressStore.completeLesson(lesson.id, score);
    const next = lessons[lessons.indexOf(lesson) + 1];
    if (next) ProgressStore.setPosition(next.id, 0);
    renderLesson(lesson.id);
    notify(next ? `课程完成！《${next.title}》已解锁。` : '恭喜！你已完成全部三节课程。');
  }

  function renderMistakes() {
    setHeader('错题本', '复习与掌握');
    const items = Object.values(ProgressStore.get().mistakes);
    app.innerHTML = `<section class="page-heading"><p class="eyebrow">REVIEW</p><h1>错题本</h1><p>答错的题目会自动收集；重新答对后标记为已掌握。</p></section><div class="mistake-list">${items.length ? items.map(item => `<article class="mistake-card ${item.mastered ? 'mastered' : ''}" data-review="${item.questionId}"><span>${item.mastered ? '已掌握' : '待复习'}</span><h3>${item.prompt}</h3>${item.options.length ? `<div class="review-options">${item.options.map(option => `<label><input type="radio" name="review-${item.questionId}" value="${escapeHtml(option)}"><span>${option}</span></label>`).join('')}</div>` : `<input class="review-input" name="review-${item.questionId}" placeholder="输入答案">`}${button(item.mastered ? '再次作答' : '提交复习答案', `data-action="review" data-id="${item.questionId}"`, '提交答案；正确后标记为已掌握')}<div class="review-result"></div></article>`).join('') : '<div class="empty"><strong>还没有错题</strong><p>课程中答错后，题目会自动出现在这里。</p></div>'}</div>`;
  }

  function submitReview(id) {
    const item = ProgressStore.get().mistakes[id];
    const card = document.querySelector(`[data-review="${id}"]`);
    const input = card.querySelector(`input[name="review-${id}"]:checked`) || card.querySelector(`input[name="review-${id}"]`);
    if (!input?.value.trim()) return notify('请先填写或选择答案。');
    const correct = input.value.trim().toLowerCase() === item.answer.trim().toLowerCase();
    card.querySelector('.review-result').innerHTML = `<div class="feedback ${correct ? 'success' : 'error'}"><strong>${correct ? '回答正确，已掌握' : '仍需复习'}</strong><p>${correct ? item.explanation : '再想一想：' + item.explanation.replace(item.answer, '正确答案')}</p></div>`;
    if (correct) { ProgressStore.markMastered(id); updateChrome(); }
  }

  function renderProgress() {
    setHeader('学习进度', '真实记录');
    const stats = ProgressStore.stats();
    const state = ProgressStore.get();
    const activityText = item => item.type === 'lesson' ? `完成《${lessonById(item.lessonId)?.title}》，得分 ${item.score}` : item.type === 'mastered' ? '在错题本掌握一道题' : `${item.type === 'correct' ? '答对' : '答错'}一道练习题`;
    app.innerHTML = `<section class="page-heading"><p class="eyebrow">YOUR PROGRESS</p><h1>学习进度</h1><p>以下数字全部根据此浏览器中的实际学习记录计算。</p></section><div class="stats-grid"><div><strong>${stats.completed}</strong><span>已完成课程</span></div><div><strong>${lessons.length}</strong><span>课程总数</span></div><div><strong>${stats.accuracy}%</strong><span>累计正确率</span></div><div><strong>${stats.totalAttempts}</strong><span>答题次数</span></div></div><section class="panel records"><div class="panel-title"><div><span>学习记录</span><small>最近 50 条活动</small></div></div>${state.activity.length ? state.activity.map(item => `<div class="record"><i></i><div><strong>${activityText(item)}</strong><small>${new Date(item.at).toLocaleString('zh-CN')}</small></div></div>`).join('') : '<div class="empty compact">开始第一课后，这里会显示你的学习记录。</div>'}</section>`;
  }

  function renderTerms(query = '') {
    setHeader('术语词典', '零基础解释');
    const filtered = terms.filter(item => `${item.term}${item.definition}`.toLowerCase().includes(query.toLowerCase()));
    app.innerHTML = `<section class="page-heading"><p class="eyebrow">GLOSSARY</p><h1>术语词典</h1><p>保留英文原词，并用适合零基础学习者的中文解释。</p></section><label class="term-search"><span>⌕</span><input id="termSearch" value="${escapeHtml(query)}" placeholder="搜索 CPU、ZF、栈……" aria-label="搜索术语"></label><div class="term-grid">${filtered.map(item => `<article><code>${item.term}</code><p>${item.definition}</p></article>`).join('') || '<div class="empty">没有找到匹配术语，请尝试更短的关键词。</div>'}</div>`;
    document.querySelector('#termSearch').focus({ preventScroll: true });
  }

  function renderSettings() {
    setHeader('设置', '本地数据');
    app.innerHTML = `<section class="page-heading"><p class="eyebrow">SETTINGS</p><h1>设置</h1><p>课程与记录都保存在当前浏览器，不会上传到服务器。</p></section><section class="panel settings-panel"><div><h2>学习数据</h2><p>清除全部课程状态、分数、答题次数、错题和最近位置。此操作无法撤销。</p></div>${button('清除学习记录', 'class="danger-button" data-action="confirm-reset"', '打开二次确认窗口；不会立即删除')}</section><section class="panel safety-panel"><h2>安全与使用边界</h2><ul><li>只执行页面内置的教学模拟，不执行真实机器代码。</li><li>不允许上传或运行任意 EXE 文件。</li><li>不提供破解、许可证绕过、安全保护绕过或恶意程序分析功能。</li><li>示例仅用于理解程序结构、汇编和调试原理。</li></ul></section>`;
  }

  function showResetModal() {
    modal.hidden = false;
    modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="resetTitle"><span class="warning-icon">!</span><h2 id="resetTitle">确定清除学习记录？</h2><p>课程完成状态、成绩、答题次数、错题和学习位置都会永久删除。</p><label class="confirm-check"><input type="checkbox" id="resetCheck"> 我了解此操作无法撤销</label><div class="modal-actions">${button('取消', 'data-action="close-modal"', '关闭窗口并保留全部数据')}${button('确认清除', 'class="danger-button" data-action="reset" disabled id="resetConfirm"', '永久清除本浏览器中的全部学习记录')}</div></div>`;
    document.querySelector('[data-action="close-modal"]').focus();
  }

  app.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'nav') navigate(target.dataset.view);
    if (action === 'open-lesson') navigate('lesson', { id: target.dataset.id });
    if (action === 'answer') submitAnswer(target.dataset.id);
    if (action === 'hint') showHint(target.dataset.id);
    if (action === 'complete-lesson') completeCurrentLesson();
    if (action === 'lesson-section') { lessonSession.section = Number(target.dataset.section); ProgressStore.setPosition(lessonSession.lesson.id, lessonSession.section); document.querySelector(`#section-${lessonSession.section}`).scrollIntoView(); }
    if (action === 'sim-step') simulator?.step();
    if (action === 'sim-auto') simulator?.auto();
    if (action === 'sim-pause') { simulator?.pause(); notify('自动执行已暂停。'); }
    if (action === 'sim-reset') simulator?.reset();
    if (action === 'review') submitReview(target.dataset.id);
    if (action === 'confirm-reset') showResetModal();
  });

  app.addEventListener('input', event => { if (event.target.id === 'termSearch') renderTerms(event.target.value); });
  document.querySelectorAll('.nav-link').forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
  document.querySelector('#menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  modal.addEventListener('change', event => { if (event.target.id === 'resetCheck') document.querySelector('#resetConfirm').disabled = !event.target.checked; });
  modal.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close-modal' || event.target === modal) modal.hidden = true;
    if (action === 'reset') { ProgressStore.reset(); lessonSession = null; modal.hidden = true; navigate('home'); notify('学习记录已清除，已恢复初始状态。'); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) modal.hidden = true; });

  navigate('home');
})();
