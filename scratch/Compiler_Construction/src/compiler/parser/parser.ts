import type { Token } from '../lexer/types';
import { TokenType } from '../lexer/types';
import type { 
  ASTNode, 
  ProgramNode, 
  FunctionDeclNode, 
  VarDeclNode, 
  ReturnStmtNode, 
  BinaryExprNode, 
  IdentifierNode, 
  LiteralNode,
  IncludeStmtNode,
  AssignStmtNode,
  ExpressionStmtNode
} from './ast';

export function parse(tokens: Token[]): ProgramNode {
  let current = 0;

  function peek(): Token {
    return tokens[current];
  }

  function advance(): Token {
    return tokens[current++];
  }

  function match(type: TokenType, value?: string): boolean {
    if (current >= tokens.length) return false;
    const t = peek();
    if (t.type === type && (value === undefined || t.value === value)) {
      advance();
      return true;
    }
    return false;
  }

  function consume(type: TokenType, message: string): Token {
    if (match(type)) {
      return tokens[current - 1];
    }
    throw new Error(`Parse Error: ${message} at line ${peek().line}`);
  }

  function parsePrimary(): ASTNode {
    const t = advance();
    if (t.type === TokenType.INTEGER_LITERAL) {
      return { type: 'Literal', value: t.value, rawType: 'int' } as LiteralNode;
    }
    if (t.type === TokenType.FLOAT_LITERAL) {
      return { type: 'Literal', value: t.value, rawType: 'float' } as LiteralNode;
    }
    if (t.type === TokenType.STRING_LITERAL) {
      return { type: 'Literal', value: t.value, rawType: 'string' } as LiteralNode;
    }
    if (t.type === TokenType.IDENTIFIER) {
      return { type: 'Identifier', name: t.value } as IdentifierNode;
    }
    if (t.type === TokenType.DELIMITER && t.value === '(') {
      const expr = parseExpression();
      consume(TokenType.DELIMITER, "Expected ')' after expression");
      return expr;
    }
    
    // Ignore std::endl gracefully as a literal-ish identifier for our subset
    if (t.type === TokenType.DELIMITER && t.value === ':') {
      if (match(TokenType.DELIMITER) && tokens[current-1].value === ':') {
        const id = advance();
        return { type: 'Identifier', name: 'std::' + id.value } as IdentifierNode;
      }
    }
    
    throw new Error(`Parse Error: Unexpected token ${t.value} at line ${t.line}`);
  }

  function parseMultiplicative(): ASTNode {
    let left = parsePrimary();
    while (current < tokens.length && (peek().value === '*' || peek().value === '/')) {
      const operator = advance().value;
      const right = parsePrimary();
      left = { type: 'BinaryExpr', operator, left, right } as BinaryExprNode;
    }
    return left;
  }

  function parseAdditive(): ASTNode {
    let left = parseMultiplicative();
    while (current < tokens.length && (peek().value === '+' || peek().value === '-')) {
      const operator = advance().value;
      const right = parseMultiplicative();
      left = { type: 'BinaryExpr', operator, left, right } as BinaryExprNode;
    }
    return left;
  }

  function parseShiftOrRelational(): ASTNode {
    let left = parseAdditive();
    while (current < tokens.length && ['<<', '>>', '<', '>', '<=', '>=', '==', '!='].includes(peek().value)) {
      const operator = advance().value;
      const right = parseAdditive();
      left = { type: 'BinaryExpr', operator, left, right } as BinaryExprNode;
    }
    return left;
  }

  function parseExpression(): ASTNode {
    return parseShiftOrRelational();
  }

  function parseStatement(): ASTNode {
    // Variable Declaration: int x = 10;
    if (peek().type === TokenType.KEYWORD && (peek().value === 'int' || peek().value === 'float')) {
      const varType = advance().value;
      const name = consume(TokenType.IDENTIFIER, "Expected variable name").value;
      let init = null;
      if (match(TokenType.OPERATOR, '=')) {
        init = parseExpression();
      }
      consume(TokenType.DELIMITER, "Expected ';' after variable declaration");
      return { type: 'VarDecl', varType, name, init } as VarDeclNode;
    }
    
    // Return Statement
    if (peek().type === TokenType.KEYWORD && peek().value === 'return') {
      advance();
      let argument = null;
      if (!(peek().type === TokenType.DELIMITER && peek().value === ';')) {
        argument = parseExpression();
      }
      consume(TokenType.DELIMITER, "Expected ';' after return");
      return { type: 'ReturnStmt', argument } as ReturnStmtNode;
    }

    // Assignment or Expression
    const expr = parseExpression();
    
    // If it's just an identifier followed by '=', it's an assignment
    if (expr.type === 'Identifier' && match(TokenType.OPERATOR, '=')) {
      const value = parseExpression();
      consume(TokenType.DELIMITER, "Expected ';' after assignment");
      return { type: 'AssignStmt', name: (expr as IdentifierNode).name, value } as AssignStmtNode;
    }

    consume(TokenType.DELIMITER, "Expected ';' after expression");
    return { type: 'ExpressionStmt', expression: expr } as ExpressionStmtNode;
  }

  function parseFunction(): FunctionDeclNode {
    const returnType = advance().value; // e.g., 'int'
    const name = consume(TokenType.IDENTIFIER, "Expected function name").value;
    consume(TokenType.DELIMITER, "Expected '(' after function name");
    // Ignore params for now in our subset
    consume(TokenType.DELIMITER, "Expected ')' after parameters");
    consume(TokenType.DELIMITER, "Expected '{' before function body");
    
    const body: ASTNode[] = [];
    while (current < tokens.length && !(peek().type === TokenType.DELIMITER && peek().value === '}')) {
      body.push(parseStatement());
    }
    
    consume(TokenType.DELIMITER, "Expected '}' after function body");
    return { type: 'FunctionDecl', returnType, name, body };
  }

  const program: ProgramNode = { type: 'Program', body: [] };

  try {
    while (current < tokens.length && peek().type !== TokenType.EOF) {
      if (peek().type === TokenType.PREPROCESSOR) {
        program.body.push({ type: 'IncludeStmt', file: advance().value } as IncludeStmtNode);
      } else if (peek().type === TokenType.KEYWORD && peek().value === 'int') {
        program.body.push(parseFunction());
      } else {
        // Skip unknown top-level tokens gracefully for the visualizer
        advance();
      }
    }
  } catch (e) {
    console.error("Parser Error: ", e);
    // In an educational visualizer, we might return a partial AST or an Error node.
    // We will just let the UI handle or display incomplete AST.
  }

  return program;
}
