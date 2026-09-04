const toast = document.querySelector('#toast');

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2400);
}

document.querySelector('#continueBtn').addEventListener('click', () => {
  notify('课程已准备好，正在进入预测题…');
});

document.querySelector('#challengeBtn').addEventListener('click', () => {
  notify('挑战已加入今日学习任务：答案是 0x100 吗？');
});

document.querySelector('.secondary').addEventListener('click', () => {
  notify('已为你生成 2 道标志位复习题');
});
