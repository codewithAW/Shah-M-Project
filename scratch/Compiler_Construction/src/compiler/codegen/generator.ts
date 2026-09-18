import type { IRInstruction } from '../ir/generator';

export interface TargetInstruction {
  op: string;
  args: string[];
}

export function generateTargetCode(ir: IRInstruction[]): TargetInstruction[] {
  const targetCode: TargetInstruction[] = [];

  for (const inst of ir) {
    switch (inst.op) {
      case '=':
        if (inst.result && inst.arg1) {
          targetCode.push({ op: 'MOV', args: [inst.result, inst.arg1] });
        }
        break;
      case '+':
        if (inst.result && inst.arg1 && inst.arg2) {
          targetCode.push({ op: 'MOV', args: ['R1', inst.arg1] });
          targetCode.push({ op: 'ADD', args: ['R1', inst.arg2] });
          targetCode.push({ op: 'MOV', args: [inst.result, 'R1'] });
        }
        break;
      case '-':
        if (inst.result && inst.arg1 && inst.arg2) {
          targetCode.push({ op: 'MOV', args: ['R1', inst.arg1] });
          targetCode.push({ op: 'SUB', args: ['R1', inst.arg2] });
          targetCode.push({ op: 'MOV', args: [inst.result, 'R1'] });
        }
        break;
      case '*':
        if (inst.result && inst.arg1 && inst.arg2) {
          targetCode.push({ op: 'MOV', args: ['R1', inst.arg1] });
          targetCode.push({ op: 'MUL', args: ['R1', inst.arg2] });
          targetCode.push({ op: 'MOV', args: [inst.result, 'R1'] });
        }
        break;
      case '/':
        if (inst.result && inst.arg1 && inst.arg2) {
          targetCode.push({ op: 'MOV', args: ['R1', inst.arg1] });
          targetCode.push({ op: 'DIV', args: ['R1', inst.arg2] });
          targetCode.push({ op: 'MOV', args: [inst.result, 'R1'] });
        }
        break;
      case 'print':
        if (inst.arg1) {
          targetCode.push({ op: 'OUT', args: [inst.arg1] });
        }
        break;
      case 'return':
        if (inst.arg1) {
          targetCode.push({ op: 'MOV', args: ['RET_REG', inst.arg1] });
        }
        targetCode.push({ op: 'RET', args: [] });
        break;
      case 'label':
        if (inst.arg1) {
          targetCode.push({ op: `${inst.arg1}:`, args: [] });
        }
        break;
      default:
        // Handle comparisons or others minimally
        if (inst.result) {
          targetCode.push({ op: 'NOP', args: [] });
        }
    }
  }

  return targetCode;
}
