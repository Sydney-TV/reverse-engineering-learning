(function (root) {
  class AssemblySimulator {
    constructor(program, onChange) {
      this.program = program;
      this.onChange = onChange || (() => {});
      this.timer = null;
      this.reset();
    }

    reset() {
      this.pause();
      this.registers = { RAX: 0, RBX: 0, RCX: 0, RDX: 0 };
      this.zf = 0;
      this.ip = 0;
      this.finished = false;
      this.message = '演示器已重置。点击“单步执行”运行第一条指令。';
      this.labels = {};
      this.program.forEach((line, index) => {
        const match = line.match(/^([A-Za-z_][\w]*):/);
        if (match) this.labels[match[1].toLowerCase()] = index;
      });
      this.emit();
    }

    value(token) {
      const clean = token.trim().toUpperCase();
      if (Object.hasOwn(this.registers, clean)) return this.registers[clean];
      if (/^0X[\dA-F]+$/.test(clean)) return parseInt(clean, 16);
      if (/^-?\d+$/.test(clean)) return Number(clean);
      throw new Error(`无法识别操作数 ${token}`);
    }

    step() {
      if (this.finished) return;
      if (this.ip >= this.program.length) return this.finish();
      const raw = this.program[this.ip];
      const code = raw.replace(/^\w+:\s*/, '').trim();
      const instruction = code.match(/^(\w+)(?:\s+(.*))?$/);
      const op = instruction?.[1] || '';
      const rest = instruction?.[2] || '';
      const args = rest.split(',').map(item => item.trim()).filter(Boolean);
      const current = this.ip;
      let next = this.ip + 1;
      let detail = '';
      try {
        switch (op.toUpperCase()) {
          case 'MOV': {
            const target = args[0].toUpperCase();
            const value = this.value(args[1]);
            this.registers[target] = value;
            detail = `把 ${args[1]} 的值 ${value} 复制到 ${target}。`;
            break;
          }
          case 'ADD': {
            const target = args[0].toUpperCase();
            const before = this.registers[target];
            this.registers[target] += this.value(args[1]);
            this.zf = Number(this.registers[target] === 0);
            detail = `${target} 从 ${before} 加到 ${this.registers[target]}；ZF=${this.zf}。`;
            break;
          }
          case 'SUB': {
            const target = args[0].toUpperCase();
            const before = this.registers[target];
            this.registers[target] -= this.value(args[1]);
            this.zf = Number(this.registers[target] === 0);
            detail = `${target} 从 ${before} 减到 ${this.registers[target]}；ZF=${this.zf}。`;
            break;
          }
          case 'CMP': {
            const left = this.value(args[0]);
            const right = this.value(args[1]);
            this.zf = Number(left - right === 0);
            detail = `比较 ${left} 与 ${right}，差${this.zf ? '为' : '不为'}零，所以 ZF=${this.zf}；寄存器不变。`;
            break;
          }
          case 'JE':
          case 'JNE': {
            const shouldJump = op.toUpperCase() === 'JE' ? this.zf === 1 : this.zf === 0;
            if (shouldJump) next = this.labels[args[0].toLowerCase()];
            detail = `${op.toUpperCase()} 检查 ZF=${this.zf}，因此${shouldJump ? `跳转到 ${args[0]}` : '不跳转，继续下一行'}。`;
            break;
          }
          default: throw new Error(`暂不支持指令 ${op}`);
        }
        this.ip = next;
        this.message = `第 ${current + 1} 行：${detail}`;
        if (this.ip >= this.program.length) this.finished = true;
      } catch (error) {
        this.pause(); this.finished = true; this.message = `执行停止：${error.message}`;
      }
      this.emit();
    }

    auto() {
      if (this.finished || this.timer) return;
      this.message = '正在自动执行，每 700 毫秒运行一条指令。';
      this.emit();
      this.timer = root.setInterval(() => {
        this.step();
        if (this.finished) this.pause();
      }, 700);
    }
    pause() { if (this.timer) root.clearInterval(this.timer); this.timer = null; }
    finish() { this.finished = true; this.pause(); this.message = '程序已执行完毕。'; this.emit(); }
    emit() { this.onChange(this.snapshot()); }
    snapshot() { return { registers: { ...this.registers }, zf: this.zf, ip: this.ip, finished: this.finished, running: Boolean(this.timer), message: this.message }; }
  }
  root.AssemblySimulator = AssemblySimulator;
})(typeof window !== 'undefined' ? window : globalThis);
