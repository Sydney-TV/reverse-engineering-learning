(function (root, factory) {
  const api = factory(root.localStorage);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LearningStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (storage) {
  const KEY = 'restart-learning-progress-v1';
  const defaults = () => ({ completed: [], attempts: [], currentLesson: 'arithmetic', minutes: 0, lastStudied: null });
  function load() {
    try {
      const saved = JSON.parse(storage && storage.getItem(KEY));
      return saved && Array.isArray(saved.completed) && Array.isArray(saved.attempts) ? { ...defaults(), ...saved } : defaults();
    } catch (_) { return defaults(); }
  }
  function save(state) {
    try { if (storage) storage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* Storage can be disabled. */ }
    return state;
  }
  function recordAttempt(state, lessonId, selected, correct) {
    const next = { ...state, attempts: [...state.attempts, { lessonId, selected, correct, at: new Date().toISOString() }], currentLesson: lessonId, lastStudied: new Date().toISOString() };
    if (correct && !next.completed.includes(lessonId)) next.completed = [...next.completed, lessonId];
    return save(next);
  }
  function clear() { try { if (storage) storage.removeItem(KEY); } catch (_) {} return defaults(); }
  return { KEY, defaults, load, save, recordAttempt, clear };
});
