(function (root) {
  const KEY = 'restart-learning-progress-v1';
  const initial = () => ({
    version: 1,
    lessons: {},
    attempts: {},
    mistakes: {},
    activity: [],
    lastLessonId: 'numbers',
    lastSection: 0,
    startedAt: new Date().toISOString()
  });

  function normalize(value) {
    const clean = initial();
    if (!value || typeof value !== 'object') return clean;
    return {
      ...clean,
      ...value,
      lessons: value.lessons || {},
      attempts: value.attempts || {},
      mistakes: value.mistakes || {},
      activity: Array.isArray(value.activity) ? value.activity : []
    };
  }

  function load() {
    try { return normalize(JSON.parse(root.localStorage.getItem(KEY))); }
    catch (_) { return initial(); }
  }

  let state = load();
  function save() { root.localStorage.setItem(KEY, JSON.stringify(state)); }
  function get() { return state; }
  function reset() { state = initial(); save(); return state; }

  function recordAttempt(question, answer, correct, lessonId) {
    const entry = state.attempts[question.id] || { count: 0, correct: 0 };
    entry.count += 1;
    if (correct) entry.correct += 1;
    entry.lastAnswer = answer;
    entry.lastAt = new Date().toISOString();
    state.attempts[question.id] = entry;
    if (!correct) {
      state.mistakes[question.id] = {
        questionId: question.id, lessonId, prompt: question.prompt,
        answer: question.answer, explanation: question.explanation,
        options: question.options || [], mastered: false, lastAnswer: answer
      };
    }
    state.activity.unshift({ type: correct ? 'correct' : 'wrong', lessonId, questionId: question.id, at: entry.lastAt });
    state.activity = state.activity.slice(0, 50);
    save();
  }

  function markMastered(questionId) {
    if (state.mistakes[questionId]) state.mistakes[questionId].mastered = true;
    state.activity.unshift({ type: 'mastered', questionId, at: new Date().toISOString() });
    save();
  }

  function completeLesson(id, score) {
    state.lessons[id] = { completed: true, score, completedAt: new Date().toISOString() };
    state.activity.unshift({ type: 'lesson', lessonId: id, score, at: new Date().toISOString() });
    save();
  }

  function setPosition(lessonId, section) {
    state.lastLessonId = lessonId;
    state.lastSection = section;
    save();
  }

  function isUnlocked(index, lessons) {
    return index === 0 || Boolean(state.lessons[lessons[index - 1].id]?.completed);
  }

  function stats() {
    const attempts = Object.values(state.attempts);
    const total = attempts.reduce((sum, item) => sum + item.count, 0);
    const correct = attempts.reduce((sum, item) => sum + item.correct, 0);
    return {
      completed: Object.values(state.lessons).filter(item => item.completed).length,
      totalAttempts: total,
      correct,
      accuracy: total ? Math.round(correct / total * 100) : 0,
      mistakes: Object.values(state.mistakes).filter(item => !item.mastered).length
    };
  }

  root.ProgressStore = { get, reset, recordAttempt, markMastered, completeLesson, setPosition, isUnlocked, stats, key: KEY };
})(typeof window !== 'undefined' ? window : globalThis);
