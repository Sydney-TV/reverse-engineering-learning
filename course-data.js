(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CourseData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const modules = [
    { id: 'basics', index: '00', title: '计算机基础', lessons: [
      { id: 'binary', title: '二进制与位', duration: 6, theory: '二进制只使用 0 和 1。每一位的权重都是 2 的幂。', question: '二进制 1010 等于十进制多少？', options: ['8', '10', '12'], answer: 1, explanation: '1010₂ = 8 + 2 = 10。' },
      { id: 'hex', title: '十六进制', duration: 7, theory: '十六进制用 0–9、A–F 表示四个二进制位，逆向工具通常用 0x 前缀。', question: '0x10 等于十进制多少？', options: ['10', '16', '32'], answer: 1, explanation: '十六进制的 10 是 1×16。' },
      { id: 'memory', title: '内存与地址', duration: 8, theory: '地址标识内存位置；寄存器可以保存地址或数据。', question: '哪个术语表示内存中的位置？', options: ['地址', '标志位', '操作码'], answer: 0, explanation: '地址（address）标识内存位置。' }
    ]},
    { id: 'assembly', index: '01', title: 'CPU 与汇编基础', lessons: [
      { id: 'registers', title: '认识寄存器', duration: 7, theory: '寄存器是 CPU 内部的高速存储位置。RAX 是 x86-64 通用寄存器。', question: '执行 mov rax, 5 后 RAX 是多少？', options: ['0', '5', '地址 5'], answer: 1, explanation: 'mov 将立即数 5 写入 RAX。', program: 'mov rax, 5' },
      { id: 'mov', title: 'MOV 数据传送', duration: 8, theory: 'mov 复制源操作数到目标操作数，不会改变源操作数。', question: 'mov rbx, rax 改变哪个目标？', options: ['RAX', 'RBX', '两者'], answer: 1, explanation: 'Intel 语法中第一个操作数是目标。', program: 'mov rax, 8\nmov rbx, rax' },
      { id: 'arithmetic', title: '加减运算与标志位', duration: 8, theory: 'add 与 sub 修改目标寄存器，并更新 ZF、SF、CF 等标志。结果为零时 ZF=1。', question: 'RAX=5，执行 add rax, 3 后是多少？', options: ['2', '5', '8'], answer: 2, explanation: '5 + 3 = 8；结果非零，所以 ZF=0。', program: 'mov rax, 5\nadd rax, 3\ncmp rax, 8' },
      { id: 'compare', title: 'CMP 与条件跳转', duration: 9, theory: 'cmp 进行一次不保存结果的减法，用标志位为条件跳转提供依据。', question: '两个操作数相等时，cmp 会怎样设置 ZF？', options: ['ZF=0', 'ZF=1', '不改变'], answer: 1, explanation: '相减结果为零，因此零标志位被置 1。', program: 'mov rax, 4\ncmp rax, 4' },
      { id: 'stack', title: '栈基础', duration: 9, theory: '栈遵循后进先出，push 压栈，pop 弹栈。', question: '最后 push 的值会在何时 pop？', options: ['最先', '最后', '随机'], answer: 0, explanation: '栈是 LIFO（后进先出）。' },
      { id: 'branches', title: '阅读控制流', duration: 10, theory: '跳转指令把基本块连接成控制流图。', question: 'je 通常在什么条件下跳转？', options: ['ZF=1', 'ZF=0', 'CF=1'], answer: 0, explanation: 'je（相等则跳转）检查 ZF=1。' }
    ]},
    { id: 'functions', index: '02', title: '函数与调用', lessons: [
      { id: 'call', title: 'CALL 与 RET', duration: 10, theory: 'call 保存返回地址并转入函数，ret 使用返回地址回到调用者。', question: '哪个指令返回调用者？', options: ['call', 'ret', 'cmp'], answer: 1, explanation: 'ret 从当前函数返回。' },
      { id: 'convention', title: '调用约定', duration: 12, theory: '调用约定规定参数、返回值以及寄存器保存责任。', question: 'x86-64 中函数返回值通常放在哪里？', options: ['RAX', 'RSP', 'ZF'], answer: 0, explanation: '常见 x86-64 调用约定使用 RAX 保存整数返回值。' }
    ]}
  ];
  const lessons = modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title })));
  const getLesson = (id) => lessons.find((lesson) => lesson.id === id);
  return { modules, lessons, getLesson };
});
