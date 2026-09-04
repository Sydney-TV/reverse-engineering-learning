(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LearningStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = 2;
  const KEY = 'restart-learning-v2';
  const LEGACY_KEYS = ['restart-learning-progress-v1'];
  const emptyState = () => ({ version: VERSION, activeProfileId: null, profiles: [] });
  const id = () => `learner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const day = (date = new Date()) => new Date(date).toISOString().slice(0, 10);
  const makeCourse = () => ({ page: 0, visited: [], interactions: [], summary: '', answers: [], passed: false, completedAt: null });
  function createProfile(fields, now = new Date()) {
    const nickname = String(fields.nickname || '').trim();
    if (!nickname) throw new Error('请填写昵称后再创建学习档案。');
    return { id: id(), nickname, experience: fields.experience || 'none', goal: String(fields.goal || '').trim(), dailyMinutes: Number(fields.dailyMinutes) || 15, createdAt: now.toISOString(), lastStudiedAt: null, streak: 0, studyDays: [], onboardingStep: 0, onboardingComplete: false, currentLessonId: null, courseProgress: {}, answerHistory: [], mistakes: [] };
  }
  function createStore(driver) {
    const storage = driver === undefined ? (typeof localStorage === 'undefined' ? null : localStorage) : driver;
    let error = null;
    const available = () => {
      if (!storage) return false;
      try { const key = `${KEY}-check`; storage.setItem(key, '1'); storage.removeItem(key); return true; } catch (cause) { error = cause; return false; }
    };
    function load() {
      if (!available()) return { data: emptyState(), error: 'localStorage 不可用，当前更改只能保留到页面关闭。', legacy: false };
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return { data: emptyState(), error: null, legacy: LEGACY_KEYS.some((key) => storage.getItem(key) !== null) };
        const data = JSON.parse(raw);
        if (!data || data.version !== VERSION || !Array.isArray(data.profiles)) throw new Error('数据版本不受支持');
        return { data, error: null, legacy: LEGACY_KEYS.some((key) => storage.getItem(key) !== null) };
      } catch (cause) { error = cause; return { data: emptyState(), error: '学习数据读取失败。原数据没有被删除，请创建新档案或在设置中清理测试数据。', legacy: true }; }
    }
    function save(data) { if (!available()) return false; try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch (cause) { error = cause; return false; } }
    function clearTestData() { if (!storage) return; LEGACY_KEYS.forEach((key) => storage.removeItem(key)); storage.removeItem(KEY); }
    return { load, save, clearTestData, available, getError: () => error };
  }
  function active(data) { return data.profiles.find((profile) => profile.id === data.activeProfileId) || null; }
  function addProfile(data, fields, now) { const profile = createProfile(fields, now); return [{ ...data, activeProfileId: profile.id, profiles: [...data.profiles, profile] }, profile]; }
  function updateProfile(data, profileId, changes) { return { ...data, profiles: data.profiles.map((profile) => profile.id === profileId ? { ...profile, ...changes, nickname: String(changes.nickname === undefined ? profile.nickname : changes.nickname).trim() || profile.nickname } : profile) }; }
  function deleteProfile(data, profileId) { const profiles = data.profiles.filter((profile) => profile.id !== profileId); return { ...data, profiles, activeProfileId: data.activeProfileId === profileId ? (profiles[0] && profiles[0].id) || null : data.activeProfileId }; }
  function progress(profile, lessonId) { return profile.courseProgress[lessonId] || makeCourse(); }
  function unlocked(profile, lessonIndex) { return lessonIndex === 0 || Boolean(progress(profile, ['program', 'bits', 'hex-memory'][lessonIndex - 1]).passed); }
  function touch(profile, now = new Date()) {
    const today = day(now); const days = profile.studyDays.includes(today) ? profile.studyDays : [...profile.studyDays, today];
    const set = new Set(days); let streak = 0; const cursor = new Date(`${today}T12:00:00Z`);
    while (set.has(day(cursor))) { streak += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    return { ...profile, lastStudiedAt: now.toISOString(), studyDays: days, streak };
  }
  function setCourseProgress(profile, lessonId, changes, now) { const next = touch(profile, now); return { ...next, currentLessonId: lessonId, courseProgress: { ...next.courseProgress, [lessonId]: { ...progress(next, lessonId), ...changes } } }; }
  function canTakeCheck(course, totalPages, requiredInteractions) { return course.visited.length === totalPages && requiredInteractions.every((name) => course.interactions.includes(name)) && Boolean(course.summary.trim()); }
  function canPass(course, questionCount) { return course.answers.length === questionCount && course.answers.every((answer) => answer.correct); }
  return { VERSION, KEY, LEGACY_KEYS, emptyState, createProfile, createStore, active, addProfile, updateProfile, deleteProfile, progress, unlocked, touch, setCourseProgress, canTakeCheck, canPass, makeCourse };
});
