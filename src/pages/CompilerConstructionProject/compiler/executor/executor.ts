import type { TargetInstruction } from '../codegen/generator';

export interface ExecutionState {
  registers: Record<string, number>;
  output: string[];
  log: string[];
}

export function execute(instructions: TargetInstruction[]): ExecutionState {
  const state: ExecutionState = {
    registers: {},
    output: [],
    log: []
  };

  const getVal = (arg: string) => {
    if (arg === 'std::endl') return '\n';
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.substring(1, arg.length - 1);
    }
    if (!isNaN(Number(arg))) return Number(arg);
    return state.registers[arg] || 0;
  };

  let pc = 0;
  while (pc < instructions.length) {
    const inst = instructions[pc];
    pc++;

    try {
      if (inst.op.endsWith(':')) {
        continue; // Label
      }

      switch (inst.op) {
        case 'MOV':
          state.registers[inst.args[0]] = getVal(inst.args[1]) as number;
          state.log.push(`MOV: ${inst.args[0]} = ${state.registers[inst.args[0]]}`);
          break;
        case 'ADD':
          state.registers[inst.args[0]] += getVal(inst.args[1]) as number;
          state.log.push(`ADD: ${inst.args[0]} = ${state.registers[inst.args[0]]}`);
          break;
        case 'SUB':
          state.registers[inst.args[0]] -= getVal(inst.args[1]) as number;
          break;
        case 'MUL':
          state.registers[inst.args[0]] *= getVal(inst.args[1]) as number;
          break;
        case 'DIV':
          state.registers[inst.args[0]] /= getVal(inst.args[1]) as number;
          break;
        case 'OUT':
          const val = getVal(inst.args[0]);
          if (state.output.length === 0) {
            state.output.push(val.toString());
          } else {
            const lastIdx = state.output.length - 1;
            if (val === '\n') {
              // Add a new line entry instead of appending \n if preferred,
              // but we can just append to output lines.
              state.output.push('');
            } else {
              state.output[lastIdx] += val.toString();
            }
          }
          state.log.push(`OUT: ${val === '\n' ? 'newline' : val}`);
          break;
        case 'RET':
          state.log.push('RET (Halt)');
          break;
        default:
          break;
      }
    } catch (e) {
      state.log.push(`Error executing instruction ${inst.op}`);
    }
  }

  return state;
}
