(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CourseData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const term = (name, english, definition) => `<button class="term" data-term="${name}|${english}|${definition}">${name}<small>${english}</small></button>`;
  const lessons = [
    {
      id: 'program', number: 0, title: '程序里面有什么', duration: 22, requiredInteractions: ['flow', 'scenarios'], next: '下一节会学习数字如何由二进制的位和字节表示。',
      pages: [
        { title: '本节要解决的问题', html: `<p>双击一个程序时，里面发生了什么？只有 EXE、没有源码，我们还能知道什么？</p><div class="learning-goals"><b>学完你将能够</b><span>说清程序、源代码、编译器和可执行文件的关系</span><span>区分正向开发与合法的逆向分析</span></div>` },
        { title: '从“做事步骤”理解程序', html: `<p>${term('程序','program','让计算机完成一组任务的指令集合')}就像一份精确菜谱：输入材料，按顺序处理，得到结果。</p><p><b>为什么需要它：</b>计算机不会猜测人的意图，需要明确步骤。它承接你已熟悉的“按步骤解决问题”。</p><div class="misconception"><b>容易误解</b>程序不只是桌面上的图标；图标只是启动它的入口。</div>` },
        { title: '从源码到运行', html: `<p>${term('源代码','source code','程序员编写、便于人阅读的程序文本')}描述意图；${term('编译器','compiler','把源代码翻译成机器可执行形式的工具')}负责翻译；${term('可执行文件','executable / EXE','包含可由操作系统装载执行的代码和数据的文件')}是翻译后的产物。</p><div class="flow-demo" data-flow><button>源代码<br><code>hello.c</code></button><i>→</i><button>编译器<br><code>compiler</code></button><i>→</i><button>EXE<br><code>hello.exe</code></button><i>→</i><button>运行结果</button></div><small>互动 1：依次点击流程中的方块，观察每一步职责。</small>` },
        { title: '一个完整 C 程序', html: `<p>下面是从文本到行为的完整例子：</p><pre class="full-example"><code>int main(void) {\n  int price = 6;\n  return price + 2;\n}</code></pre><ol><li>程序员写下 C 源代码。</li><li>编译器把加法等操作翻译并放入 EXE。</li><li>操作系统装载 EXE。</li><li>CPU 执行其中的指令，程序返回 8。</li></ol><button class="reveal-example" data-reveal="即使没有源代码，我们仍能运行它、改变合法测试输入并观察返回值 8；也能在授权范围内研究 EXE 中保存的代码和数据。">查看完整示例解释</button>` },
        { title: '正向开发、逆向分析与边界', html: `<p>${term('正向开发','forward development','从需求和源代码构建程序')}从“设计图”走向成品；${term('逆向工程','reverse engineering','从已有程序的结构与行为推断它如何工作')}从成品回头理解结构。</p><div class="scenario-demo" data-scenarios><button data-legal="true">分析自己编译的练习程序</button><button data-legal="true">研究获授权的恶意样本报告</button><button data-legal="false">绕过他人软件授权</button><p>互动 2：选择场景查看授权边界。</p></div><div class="safety-note">本课程只使用自有、内置或明确授权的样本；不教授入侵、窃取凭据、绕过授权或破坏系统。</div>` },
        { title: '总结与理解检查', summary: true, html: `<p>请用自己的话说明“源代码、编译器和 EXE”之间的关系。写给未来的自己，不要求使用专业措辞。</p>` }
      ],
      questions: [
        { q: '把便于人阅读的源代码翻译为可执行形式的是？', options: ['编译器', '文件图标', '显示器'], answer: 0, wrong: ['文件图标只负责提供启动入口。', '显示器负责呈现结果，不翻译程序。'], explanation: '编译器（compiler）读取源代码并产生可执行形式。' },
        { q: '只有 EXE、没有源码时，在授权范围内仍可以做什么？', options: ['什么都不能做', '运行并观察输入与输出', '自动获得原始注释'], answer: 1, wrong: ['EXE 本身可以被系统装载运行。', '编译通常不会保留全部原始注释。'], explanation: '可通过受控输入、输出和程序结构观察其行为，但不能假设能恢复全部源码。' },
        { q: '下列哪项符合本课程的授权边界？', options: ['绕过商业软件许可', '分析自己编译的练习文件', '读取他人凭据'], answer: 1, wrong: ['绕过许可不属于本课程允许范围。', '窃取凭据既不合法也不属于学习目标。'], explanation: '自有、内置或得到明确授权的练习文件才是合适对象。' }
      ]
    },
    {
      id: 'bits', number: 1, title: '二进制、位和字节', duration: 25, requiredInteractions: ['bits', 'range'], next: '下一节会用十六进制更紧凑地表示二进制，并认识内存地址。',
      pages: [
        { title: '本节要解决的问题', html: '<p>计算机怎样只用两种状态表示数字、文字和其他数据？</p><div class="learning-goals"><b>前置回顾</b><span>程序需要保存和处理数据</span><span>我们已经知道 EXE 里包含代码和数据</span></div>' },
        { title: '数字可以有不同写法', html: `<p>“十”这个数量可写成十进制 10，也可写成二进制 1010。${term('十进制','decimal','以 10 为基数、使用 0 到 9 的记数方式')}只是人类常用的一种表示，并不是数字本身。</p><p>${term('二进制','binary','以 2 为基数、只使用 0 和 1 的记数方式')}的每一位从右向左权重为 1、2、4、8……</p><div class="misconception"><b>容易误解</b>二进制 10 表示数量“二”，不是十进制的十。</div>` },
        { title: '逐位点亮', html: `<p>${term('位','bit','能保存 0 或 1 的最小信息单位')}可以想成关/开的灯。点击下方 8 盏灯，观察数值如何相加。</p><div class="bit-demo" data-bits></div><output class="demo-output">十进制：0 · 二进制：00000000</output><small>互动 1：至少点亮和关闭一次位。</small>` },
        { title: '位组成字节', html: `<p>8 个 bit 组成 1 个${term('字节','byte','由 8 个 bit 组成的常用数据单位')}。8 位共有 2⁸=256 种组合，所以无符号值范围是 0 到 255。</p><div class="range-demo" data-range><input type="range" min="0" max="255" value="65"><output>65 → 01000001</output></div><small>互动 2：拖动滑块，看同一数量的十进制和二进制写法。</small>` },
        { title: '转换与完整示例', html: `<p>二进制 <code>10110110</code> 中点亮的权重是 128、32、16、4、2，相加得到 182。反向转换时，从不超过目标数的最大权重开始减。</p><pre class="full-example">128 64 32 16 8 4 2 1\n  1  0  1  1 0 1 1 0  = 182</pre><button class="reveal-example" data-reveal="计算机使用二进制，是因为电子电路容易稳定地区分高/低两种状态。多个字节可以继续组成文字、图像、指令等数据；字节本身并不自动说明含义，解释方式由程序决定。">查看完整示例</button>` },
        { title: '总结与理解检查', summary: true, html: '<p>请用自己的话解释 bit、byte 的区别，以及为什么 8 位能表示 0～255。</p>' }
      ],
      questions: [
        { q: '1 byte 包含多少 bit？', options: ['2', '8', '255'], answer: 1, wrong: ['2 是二进制使用的状态数量。', '255 是 8 位无符号数的最大值，不是位数。'], explanation: '一个字节（byte）由 8 个位（bit）组成。' },
        { q: '二进制 1010 等于十进制多少？', options: ['8', '10', '12'], answer: 1, wrong: ['还需要加上权重 2。', '最右侧为 0，不能加权重 1；权重 4 也没有点亮。'], explanation: '点亮的位权重为 8 和 2，所以 8+2=10。' },
        { q: '8 位无符号数为什么最大是 255？', options: ['共有 255 种组合', '所有位为 1 时权重之和是 255', '因为一个字节是 255 位'], answer: 1, wrong: ['8 位共有 256 种组合，范围从 0 开始。', '一个字节只有 8 位。'], explanation: '128+64+32+16+8+4+2+1=255；包含 0 在内共有 256 个值。' }
      ]
    },
    {
      id: 'hex-memory', number: 2, title: '十六进制与内存地址', duration: 28, requiredInteractions: ['hex', 'memory-write'], next: '完成入门阶段后，下一阶段将从 CPU 如何读取指令开始。',
      pages: [
        { title: '本节要解决的问题', html: '<p>逆向工具为何充满 0x、A～F 和看似随机的地址？</p><div class="learning-goals"><b>前置回顾</b><span>二进制每一位代表一个 2 的幂</span><span>8 bit 组成一个 byte</span></div>' },
        { title: '更紧凑的十六进制', html: `<p>${term('十六进制','hexadecimal','以 16 为基数，使用 0～9 和 A～F 的记数方式')}用 A～F 表示十进制 10～15。前缀 <code>0x</code> 明确告诉读者后面的数字采用十六进制。</p><p>一个十六进制字符恰好对应 4 bit，所以两个字符能表示 1 byte。逆向工具用它可以紧凑、整齐地显示原始字节。</p><div class="misconception"><b>容易误解</b><code>0x10</code> 是十进制 16，不是十进制 10。</div>` },
        { title: '四位一组转换', html: `<p>点击一个十六进制字符，观察它对应的 4 位二进制。</p><div class="hex-demo" data-hex>${'0123456789ABCDEF'.split('').map(x=>`<button>${x}</button>`).join('')}</div><output class="demo-output">0x0 ↔ 0000</output><small>互动 1：比较 A（10）和 F（15）的位。</small>` },
        { title: '内存像编号储物格', html: `<p>${term('内存','memory','程序运行时暂时存放代码和数据的空间')}可以先想成一排格子。${term('内存地址','memory address','用于定位某个内存位置的编号')}像格子编号；格子里保存的字节是数据。</p><div class="memory-demo" data-memory></div><output class="demo-output">请选择一个地址。</output><div class="misconception"><b>容易误解</b>地址 0x1002 与其中的数据 0x41 是两件事，就像储物柜编号不是柜内物品。</div>` },
        { title: '操作内存格子与完整示例', html: `<p>先选一个地址，再把其中数据改为 <code>0x41</code>。这模拟程序在内存中写入一个字节。</p><div class="memory-write" data-memory-write><select><option>0x1000</option><option>0x1001</option><option>0x1002</option><option>0x1003</option></select><input maxlength="2" value="41" aria-label="十六进制字节"><button>写入</button><output>等待写入</output></div><small>互动 2：写入后确认地址不变、数据改变。</small><pre class="full-example">地址       数据\n0x1000 → 0x48\n0x1001 → 0x69</pre><button class="reveal-example" data-reveal="两个相邻字节 0x48、0x69 若按 ASCII 文字解释是 Hi；同样的字节也可能被其他程序解释为数字。地址负责定位，数据的含义取决于程序如何使用它。">查看完整示例</button>` },
        { title: '总结与理解检查', summary: true, html: '<p>请用自己的话解释为什么逆向工具使用十六进制，以及“地址”和“地址中的数据”为何不同。</p>' }
      ],
      questions: [
        { q: '十六进制中的 F 表示十进制多少？', options: ['6', '15', '16'], answer: 1, wrong: ['F 排在 A～F 的第六位，但它表示 15。', '16 在十六进制中写作 0x10。'], explanation: 'A 到 F 依次表示 10 到 15。' },
        { q: '0x 前缀表示什么？', options: ['后面是十六进制', '后面一定是地址', '后面是二进制'], answer: 0, wrong: ['十六进制既可表示地址也可表示普通数值。', '二进制通常写作 0b 前缀。'], explanation: '0x 声明后续数字按十六进制解释，并不自动意味着它是地址。' },
        { q: '地址 0x1000 中保存 0x41，哪个是数据？', options: ['0x1000', '0x41', '两者都是地址'], answer: 1, wrong: ['0x1000 用于定位格子，是地址。', '只有 0x1000 是这里的地址。'], explanation: '0x1000 是位置编号；该位置当前保存的数据是 0x41。' }
      ]
    }
  ];
  const onboarding = ['什么是程序：让计算机完成任务的明确指令集合。','源代码由人编写，编译器把它翻译成可执行文件。','逆向工程是从已有程序的结构和行为推断它如何工作。','合法场景包括分析自己的练习程序、安全研究授权样本和兼容性学习。','课程不教授未经授权的入侵、凭据窃取、许可绕过或系统破坏。','课程页包含术语解释、分步示例、互动演示、提示、总结和理解检查。','准备好后，由你主动从第 0 课开始。'];
  const getLesson = (id) => lessons.find((lesson) => lesson.id === id);
  return { lessons, onboarding, getLesson };
});
