import type { IRInstruction } from '../ir/generator';

export function optimize(instructions: IRInstruction[]): IRInstruction[] {
  // Deep copy so we don't mutate original
  let optimized = JSON.parse(JSON.stringify(instructions)) as IRInstruction[];
  
  const knownConstants: Record<string, number> = {};

  // Pass 1: Constant Folding / Propagation
  for (let i = 0; i < optimized.length; i++) {
    const inst = optimized[i];

    // If it's an assignment of a literal number
    if (inst.op === '=' && inst.arg1 && !isNaN(Number(inst.arg1))) {
      if (inst.result) knownConstants[inst.result] = Number(inst.arg1);
    }

    // Replace args with known constants if they exist
    if (inst.arg1 && knownConstants[inst.arg1] !== undefined) {
      inst.arg1 = knownConstants[inst.arg1].toString();
    }
    if (inst.arg2 && knownConstants[inst.arg2] !== undefined) {
      inst.arg2 = knownConstants[inst.arg2].toString();
    }

    // Fold constants: if arg1 and arg2 are numbers and op is math
    if (['+', '-', '*', '/'].includes(inst.op) && inst.arg1 && inst.arg2 && !isNaN(Number(inst.arg1)) && !isNaN(Number(inst.arg2))) {
      const v1 = Number(inst.arg1);
      const v2 = Number(inst.arg2);
      let res = 0;
      if (inst.op === '+') res = v1 + v2;
      if (inst.op === '-') res = v1 - v2;
      if (inst.op === '*') res = v1 * v2;
      if (inst.op === '/') res = v1 / v2;

      inst.op = '=';
      inst.arg1 = res.toString();
      inst.arg2 = undefined;

      if (inst.result) {
        knownConstants[inst.result] = res;
      }
    }
  }

  // Pass 2: Very basic Dead Code Elimination (e.g. remove unreachable code after return)
  const finalInstructions: IRInstruction[] = [];
  for (const inst of optimized) {
    finalInstructions.push(inst);
    if (inst.op === 'return') {
      break; // stop processing instructions after return inside a block for our simple subset
    }
  }

  return finalInstructions;
}
