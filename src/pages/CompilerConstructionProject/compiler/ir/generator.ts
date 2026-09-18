import type { ProgramNode, ASTNode } from '../parser/ast';

export interface IRInstruction {
  op: string;
  arg1?: string;
  arg2?: string;
  result?: string;
}

export function generateIR(ast: ProgramNode | null): IRInstruction[] {
  const instructions: IRInstruction[] = [];
  let tempCount = 1;

  if (!ast) return instructions;

  function newTemp() {
    return `t${tempCount++}`;
  }

  function traverse(node: ASTNode): string {
    if (!node) return '';

    if (node.type === 'Literal') {
      return (node as any).value;
    }

    if (node.type === 'Identifier') {
      return (node as any).name;
    }

    if (node.type === 'BinaryExpr') {
      const binNode = node as any;
      const left = traverse(binNode.left);
      const right = traverse(binNode.right);
      
      if (binNode.operator === '<<' && left === 'std::cout') {
        instructions.push({ op: 'print', arg1: right });
        return 'std::cout'; // chaining support basic
      }
      
      const result = newTemp();
      instructions.push({ op: binNode.operator, arg1: left, arg2: right, result });
      return result;
    }

    if (node.type === 'VarDecl') {
      const varNode = node as any;
      if (varNode.init) {
        const val = traverse(varNode.init);
        instructions.push({ op: '=', arg1: val, result: varNode.name });
      }
      return '';
    }

    if (node.type === 'AssignStmt') {
      const assignNode = node as any;
      const val = traverse(assignNode.value);
      instructions.push({ op: '=', arg1: val, result: assignNode.name });
      return '';
    }

    if (node.type === 'ReturnStmt') {
      const retNode = node as any;
      const val = retNode.argument ? traverse(retNode.argument) : '';
      instructions.push({ op: 'return', arg1: val });
      return '';
    }

    if (node.type === 'ExpressionStmt') {
      traverse((node as any).expression);
      return '';
    }

    if (node.type === 'FunctionDecl') {
      const fnNode = node as any;
      instructions.push({ op: 'label', arg1: fnNode.name });
      if (fnNode.body) {
        fnNode.body.forEach(traverse);
      }
      return '';
    }
    
    // Ignore others like IncludeStmt
    return '';
  }

  if (ast.body) {
    ast.body.forEach(traverse);
  }

  return instructions;
}
