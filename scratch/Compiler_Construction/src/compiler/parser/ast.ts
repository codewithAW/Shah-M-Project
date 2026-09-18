export type ASTNodeType = 
  | 'Program'
  | 'FunctionDecl'
  | 'VarDecl'
  | 'ReturnStmt'
  | 'BinaryExpr'
  | 'AssignStmt'
  | 'Identifier'
  | 'Literal'
  | 'ExpressionStmt'
  | 'IncludeStmt';

export interface ASTNode {
  type: ASTNodeType;
  [key: string]: any;
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface FunctionDeclNode extends ASTNode {
  type: 'FunctionDecl';
  returnType: string;
  name: string;
  body: ASTNode[];
}

export interface IncludeStmtNode extends ASTNode {
  type: 'IncludeStmt';
  file: string;
}

export interface VarDeclNode extends ASTNode {
  type: 'VarDecl';
  varType: string;
  name: string;
  init: ASTNode | null;
}

export interface AssignStmtNode extends ASTNode {
  type: 'AssignStmt';
  name: string;
  value: ASTNode;
}

export interface ReturnStmtNode extends ASTNode {
  type: 'ReturnStmt';
  argument: ASTNode | null;
}

export interface BinaryExprNode extends ASTNode {
  type: 'BinaryExpr';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends ASTNode {
  type: 'Literal';
  value: string;
  rawType: 'int' | 'float' | 'string';
}

export interface ExpressionStmtNode extends ASTNode {
  type: 'ExpressionStmt';
  expression: ASTNode;
}
