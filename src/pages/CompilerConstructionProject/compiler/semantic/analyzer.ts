import type { ProgramNode, ASTNode } from '../parser/ast';

export interface SymbolInfo {
  name: string;
  type: string;
  scope: string;
  value: string;
}

export interface SemanticCheck {
  name: string;
  passed: boolean;
}

export interface SemanticResult {
  symbolTable: SymbolInfo[];
  checks: SemanticCheck[];
}

export function analyze(ast: ProgramNode | null): SemanticResult {
  const symbolTable: SymbolInfo[] = [];
  const checks: SemanticCheck[] = [
    { name: 'Declarations', passed: true },
    { name: 'Type Consistency', passed: true },
    { name: 'Scope Rules', passed: true },
    { name: 'Initialization', passed: true },
    { name: 'Return Type', passed: true },
  ];

  if (!ast) {
    checks.forEach(c => c.passed = false);
    return { symbolTable, checks };
  }

  let currentScope = 'global';
  const declaredVars = new Set<string>();

  function traverse(node: ASTNode) {
    if (!node) return;

    if (node.type === 'FunctionDecl') {
      currentScope = node.name;
      const fnNode = node as any;
      if (fnNode.body) {
        fnNode.body.forEach(traverse);
      }
      currentScope = 'global';
    }

    if (node.type === 'VarDecl') {
      const varNode = node as any;
      if (declaredVars.has(varNode.name)) {
        checks.find(c => c.name === 'Declarations')!.passed = false;
      } else {
        declaredVars.add(varNode.name);
        
        // Very basic value extraction for visualizer
        let initValue = '-';
        if (varNode.init && varNode.init.type === 'Literal') {
          initValue = varNode.init.value;
        } else if (varNode.init) {
          initValue = '(expr)';
        }

        symbolTable.push({
          name: varNode.name,
          type: varNode.varType,
          scope: currentScope,
          value: initValue
        });
      }
    }

    if (node.type === 'Identifier') {
      const idNode = node as any;
      // Skip checking std:: cout etc for our subset
      if (!idNode.name.startsWith('std::') && !declaredVars.has(idNode.name) && currentScope !== 'global') {
        checks.find(c => c.name === 'Scope Rules')!.passed = false;
      }
    }

    if (node.type === 'AssignStmt') {
      const assignNode = node as any;
      if (!declaredVars.has(assignNode.name)) {
        checks.find(c => c.name === 'Scope Rules')!.passed = false;
      }
    }

    // Traverse children
    if (node.type !== 'FunctionDecl') {
      for (const key in node) {
        if (key === 'type') continue;
        const child = node[key as keyof ASTNode];
        if (Array.isArray(child)) {
          child.forEach(c => { if (typeof c === 'object' && c !== null) traverse(c); });
        } else if (typeof child === 'object' && child !== null) {
          traverse(child as ASTNode);
        }
      }
    }
  }

  try {
    traverse(ast);
  } catch (e) {
    checks.forEach(c => c.passed = false);
  }

  return { symbolTable, checks };
}
