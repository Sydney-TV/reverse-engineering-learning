(function (root) {
  const lessons = [
    {
      id: 'numbers', number: 1, title: '十进制、二进制和十六进制', minutes: 12,
      summary: '学会辨认三种进制，并在它们之间进行简单转换。',
      objective: '看到 0b 和 0x 前缀时，能判断数值使用的进制，并完成简单换算。',
      sections: [
        { title: '同一个数量，不同的写法', html: '<p><strong>进制</strong>是记录数量的规则。日常使用十进制（Decimal）；计算机用只有 0、1 的二进制（Binary）；分析程序时常用更紧凑的十六进制（Hexadecimal）。</p><div class="concept-grid"><div><b>十进制</b><code>10</code><small>逢十进一</small></div><div><b>二进制</b><code>0b1010</code><small>逢二进一</small></div><div><b>十六进制</b><code>0x0A</code><small>逢十六进一</small></div></div>' },
        { title: '为什么常看到十六进制？', html: '<p>四个二进制位正好对应一个十六进制数字。十六进制的数字是 0–9、A–F，其中 A 表示 10，F 表示 15。一个<strong>字节（Byte，8 个二进制位）</strong>可写成两个十六进制数字。</p><pre class="lesson-code">二进制  1111 1111\n十六进制  F    F    → 0xFF\n十进制              → 255</pre>' }
      ],
      prediction: { id: 'n-predict', prompt: '预测：二进制 0b1010 等于十进制多少？', options: ['8', '10', '12'], answer: '10', explanation: '从右向左的位权是 1、2、4、8。0b1010 = 8 + 2 = 10。', hints: ['把每一位看成开关：亮起的位才计入。', '从右向左写下 1、2、4、8，再选择为 1 的位置。', '答案是 8 + 2 = 10。'] },
      practice: { id: 'n-practice', type: 'number', prompt: '交互练习：把十进制 31 转换为十六进制（带 0x 前缀）。', answer: '0x1f', explanation: '31 = 1 × 16 + 15，而 15 用 F 表示，所以结果是 0x1F。', hints: ['先计算 31 中包含几个 16。', '商是 1，余数是 15；十六进制用哪个字母表示 15？', '15 是 F，所以写作 0x1F。'] },
      quiz: [
        { id: 'n-q1', prompt: '十六进制 0x10 等于十进制多少？', options: ['10', '16', '20'], answer: '16', explanation: '0x10 表示 1 个 16 加 0 个 1，因此是 16。', hints: ['这里的 10 不是十进制。', '十六进制第二位的位权是 16。', '1 × 16 + 0 = 16。'] },
        { id: 'n-q2', prompt: '一个字节包含多少个二进制位？', options: ['4', '8', '16'], answer: '8', explanation: '一个字节（Byte）固定由 8 个二进制位（bit）组成。', hints: ['回看“为什么常看到十六进制”。', '两个十六进制数字表示一个字节，每个对应 4 位。', '4 + 4 = 8 位。'] },
        { id: 'n-q3', prompt: '以下哪个是十六进制写法？', options: ['1010', '0b1010', '0xA'], answer: '0xA', explanation: '本课程使用 0x 前缀标记十六进制，0b 前缀标记二进制。', hints: ['观察数字前面的前缀。', 'b 表示 Binary；十六进制常用 x。', '答案是 0xA。'] }
      ]
    },
    {
      id: 'mov', number: 2, title: 'CPU、寄存器和 MOV 指令', minutes: 15,
      summary: '理解 CPU 如何用寄存器暂存数据，并单步观察 MOV。',
      objective: '能读懂 MOV 目标, 源 的方向，并预测寄存器执行后的值。',
      sections: [
        { title: 'CPU 与寄存器是什么？', html: '<p><strong>CPU（中央处理器）</strong>负责执行指令。<strong>寄存器（Register）</strong>是 CPU 内部少量但速度很快的临时存储位置。x64 程序中常见 RAX、RBX、RCX、RDX。</p><div class="callout">把 CPU 想成正在算题的人，寄存器就是桌面上随手可取的小便签。</div>' },
        { title: 'MOV：复制数据', html: '<p><strong>指令（Instruction）</strong>是交给 CPU 的一步操作。<code>MOV 目标, 源</code>会把源的值复制到目标，源本身不改变。</p><pre class="lesson-code">MOV RAX, 5      ; RAX 变成 5\nMOV RBX, RAX    ; RBX 也变成 5，RAX 仍是 5</pre><p>这里的代码是<strong>汇编（Assembly）</strong>：机器指令便于人阅读的文本表示。</p>' }
      ],
      prediction: { id: 'm-predict', prompt: '预测：先执行 MOV RAX, 7，再执行 MOV RBX, RAX，RBX 是多少？', options: ['0', '7', 'RAX'], answer: '7', explanation: '第二条 MOV 将 RAX 中的数值 7 复制给 RBX。', hints: ['MOV 不做加法，只复制。', '读作“把 RAX 的值放入 RBX”。', 'RAX 是 7，所以 RBX 也是 7。'] },
      practice: { id: 'm-practice', type: 'sim', prompt: '交互练习：使用下方演示器单步执行，直到 RDX 变成 12。', answer: 'complete', explanation: 'MOV RAX, 12 先准备数值，再由 MOV RDX, RAX 将 12 复制到 RDX。', hints: ['点击“单步执行”，一次只运行一行。', '留意高亮行与右侧 RDX 的变化。', '执行第二条 MOV 后，RDX 将变成 12。'], program: ['MOV RAX, 12', 'MOV RDX, RAX'] },
      quiz: [
        { id: 'm-q1', prompt: 'MOV RCX, 9 执行后，哪个寄存器发生变化？', options: ['RAX', 'RCX', 'RDX'], answer: 'RCX', explanation: 'MOV 的逗号左侧是目标，因此 RCX 变成 9。', hints: ['先找逗号左侧。', 'MOV 的格式是“目标, 源”。', '目标是 RCX。'] },
        { id: 'm-q2', prompt: '执行 MOV RBX, RAX 会清空 RAX 吗？', options: ['会', '不会', '取决于 ZF'], answer: '不会', explanation: 'MOV 是复制，不是搬走；源寄存器 RAX 保持不变。', hints: ['想象复印，而不是剪切。', '源数据不会被 MOV 修改。', '答案是“不会”。'] },
        { id: 'm-q3', prompt: '寄存器最合适的描述是什么？', options: ['CPU 内部的快速临时存储', '硬盘上的文件夹', '网络地址'], answer: 'CPU 内部的快速临时存储', explanation: '寄存器位于 CPU 内部，容量少但访问非常快。', hints: ['它不是长期保存数据的位置。', '它离执行指令的 CPU 最近。', '答案是 CPU 内部的快速临时存储。'] }
      ]
    },
    {
      id: 'branches', number: 3, title: 'ADD、CMP、ZF 与条件跳转', minutes: 18,
      summary: '通过运算、比较和条件跳转理解程序如何作出选择。',
      objective: '能根据 ADD/CMP 的结果判断 ZF，并预测 JE 或 JNE 是否跳转。',
      sections: [
        { title: '运算与比较', html: '<p><code>ADD</code> 做加法，<code>SUB</code> 做减法。<code>CMP A, B</code> 会在内部计算 A−B，但不保存结果，只更新<strong>标志位（Flag）</strong>。</p><pre class="lesson-code">MOV RAX, 3\nADD RAX, 2      ; RAX = 5\nCMP RAX, 5      ; 相等，因此 ZF = 1</pre>' },
        { title: 'ZF 与条件跳转', html: '<p><strong>ZF（Zero Flag，零标志位）</strong>记录最近运算结果是否为零：是则为 1，否则为 0。<code>JE</code> 在 ZF=1 时跳转；<code>JNE</code> 在 ZF=0 时跳转。跳转就是改变下一条要执行的指令位置。</p><div class="callout">CMP 两个相同的值 → 差为 0 → ZF=1 → JE 跳转。</div>' }
      ],
      prediction: { id: 'b-predict', prompt: '预测：RAX=8，执行 CMP RAX, 8 后再执行 JE equal，会发生什么？', options: ['跳转到 equal', '不跳转', 'RAX 变成 0'], answer: '跳转到 equal', explanation: '8−8 为 0，所以 CMP 设置 ZF=1；JE 在 ZF=1 时跳转。CMP 不改写 RAX。', hints: ['先算 8−8。', '结果为零时 ZF 等于 1。', 'JE 的 E 是 Equal，相等时跳转。'] },
      practice: { id: 'b-practice', type: 'sim', prompt: '交互练习：单步执行示例，观察 JE 跳过哪一行，直到 RCX 变成 1。', answer: 'complete', explanation: 'CMP 得到相等结果，ZF=1；JE 跳到第 6 行，因此 MOV RCX, 99 被跳过，最终 RCX=1。', hints: ['先观察 CMP 后的 ZF。', 'ZF=1 时 JE 会把当前行移动到标签 equal。', '跳转后执行 MOV RCX, 1。'], program: ['MOV RAX, 5', 'ADD RAX, 3', 'CMP RAX, 8', 'JE equal', 'MOV RCX, 99', 'equal: MOV RCX, 1'] },
      quiz: [
        { id: 'b-q1', prompt: 'RAX=4，执行 ADD RAX, 3 后 RAX 是多少？', options: ['1', '7', '43'], answer: '7', explanation: 'ADD 将源操作数 3 加到目标 RAX，结果为 7。', hints: ['ADD 表示加法。', '计算 4 + 3。', '结果为 7。'] },
        { id: 'b-q2', prompt: 'CMP 6, 6 后 ZF 是多少？', options: ['0', '1', '6'], answer: '1', explanation: '6−6 的结果为零，因此零标志位 ZF 被设为 1。', hints: ['CMP 在内部做减法。', '相同数字相减为零。', '结果为零时 ZF=1。'] },
        { id: 'b-q3', prompt: 'JNE 在什么情况下跳转？', options: ['ZF=0', 'ZF=1', '任何时候'], answer: 'ZF=0', explanation: 'JNE 是 Jump if Not Equal；比较不相等时差不为零，因此 ZF=0。', hints: ['N 表示 Not。', '不相等时 CMP 的结果不是零。', '不是零对应 ZF=0。'] }
      ]
    }
  ];

  const terms = [
    ['CPU', '中央处理器，负责读取并执行程序指令，可以把它看成计算机中负责实际运算的核心。'],
    ['寄存器', 'CPU 内部容量很小、速度很快的临时存储位置，例如 RAX、RBX。'],
    ['内存', '程序运行时存放代码和数据的临时空间，断电后其中的数据通常会消失。'],
    ['地址', '内存中某个位置的编号，程序通过地址找到指令或数据。'],
    ['指令', 'CPU 能执行的一步操作，例如复制、加法、比较或跳转。'],
    ['汇编', '机器指令便于人阅读的文本表示，通常一行对应一项简单操作。'],
    ['RAX', 'x64 CPU 的通用寄存器之一，经常用于保存计算值或函数返回值。'],
    ['栈', '按“后进先出”方式使用的一块内存，常用来保存返回地址、参数和局部数据。'],
    ['标志位', '记录最近一次运算特征的状态位，条件跳转会根据它作出决定。'],
    ['ZF', 'Zero Flag，零标志位；最近运算结果为零时是 1，否则是 0。'],
    ['CMP', '比较指令；内部进行减法并更新标志位，但不保存减法结果。'],
    ['跳转', '改变下一条将执行的指令位置；JE、JNE 会依据 ZF 决定是否跳转。']
  ].map(([term, definition]) => ({ term, definition }));

  root.CourseData = { lessons, terms };
})(typeof window !== 'undefined' ? window : globalThis);
