(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AssemblySimulator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MASK = 0xffffffffffffffffn;
  const parseValue = (token, registers) => {
    const key = token.toLowerCase();
    if (key in registers) return registers[key];
    if (/^0x[\da-f]+$/i.test(token)) return BigInt(token);
    if (/^[\da-f]+h$/i.test(token)) return BigInt(`0x${token.slice(0, -1)}`);
    if (/^-?\d+$/.test(token)) return BigInt(token);
    throw new Error(`无法识别操作数：${token}`);
  };
  function run(source) {
    const registers = { rax: 0n, rbx: 0n, rcx: 0n, rdx: 0n };
    const flags = { ZF: 0, CF: 0, SF: 0 };
    const trace = [];
    source.split('\n').forEach((raw, index) => {
      const text = raw.replace(/;.*/, '').trim(); if (!text) return;
      const match = text.match(/^(\S+)\s*(.*)$/); const op = match[1]; const args = match[2].split(',').map((v) => v.trim()).filter(Boolean);
      const target = args[0] && args[0].toLowerCase();
      if (['mov', 'add', 'sub', 'xor', 'cmp'].includes(op.toLowerCase()) && args.length !== 2) throw new Error(`第 ${index + 1} 行参数数量错误`);
      const left = target in registers ? registers[target] : parseValue(args[0], registers); const right = args[1] ? parseValue(args[1], registers) : 0n;
      let result;
      switch (op.toLowerCase()) {
        case 'mov': if (!(target in registers)) throw new Error('目标必须是寄存器'); registers[target] = right & MASK; break;
        case 'add': result = left + right; flags.CF = result > MASK ? 1 : 0; registers[target] = result & MASK; break;
        case 'sub': result = left - right; flags.CF = left < right ? 1 : 0; registers[target] = result & MASK; break;
        case 'xor': result = left ^ right; flags.CF = 0; registers[target] = result & MASK; break;
        case 'cmp': result = (left - right) & MASK; flags.CF = left < right ? 1 : 0; break;
        case 'inc': result = left + 1n; registers[target] = result & MASK; break;
        case 'dec': result = left - 1n; registers[target] = result & MASK; break;
        default: throw new Error(`第 ${index + 1} 行不支持指令：${op}`);
      }
      if (op.toLowerCase() !== 'mov') { const checked = op.toLowerCase() === 'cmp' ? result : registers[target]; flags.ZF = checked === 0n ? 1 : 0; flags.SF = Number((checked >> 63n) & 1n); }
      trace.push({ line: index + 1, instruction: text, registers: { ...registers }, flags: { ...flags } });
    });
    return { registers, flags, trace };
  }
  const format = (value) => `0x${value.toString(16).toUpperCase().padStart(16, '0')}`;
  return { run, format };
});
