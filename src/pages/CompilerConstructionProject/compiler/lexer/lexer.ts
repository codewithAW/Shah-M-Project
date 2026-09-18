import type { Token } from './types';
import { TokenType } from './types';

const KEYWORDS = new Set(['int', 'float', 'return', 'if', 'else', 'while', 'for']);
const OPERATORS = new Set(['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '<<', '>>']);
const DELIMITERS = new Set(['(', ')', '{', '}', ';', ',']);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;
  let line = 1;
  let column = 1;

  function advance() {
    const char = source[current];
    current++;
    if (char === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    return char;
  }

  function peek() {
    return source[current];
  }

  while (current < source.length) {
    let char = source[current];

    // Skip whitespace
    if (/\s/.test(char)) {
      advance();
      continue;
    }

    // Preprocessor directive
    if (char === '#') {
      const startCol = column;
      let value = '';
      while (current < source.length && source[current] !== '\n') {
        value += advance();
      }
      tokens.push({ type: TokenType.PREPROCESSOR, value, line, column: startCol });
      continue;
    }

    // Single-line comments
    if (char === '/' && peek() === '/') {
      while (current < source.length && source[current] !== '\n') {
        advance();
      }
      continue;
    }

    // Identifiers and Keywords (including std::cout)
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      const startCol = column;
      while (current < source.length && /[a-zA-Z0-9_:]/.test(source[current])) {
        value += advance();
      }
      
      const type = KEYWORDS.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
      tokens.push({ type, value, line, column: startCol });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let value = '';
      const startCol = column;
      let isFloat = false;
      
      while (current < source.length && /[0-9\.]/.test(source[current])) {
        if (source[current] === '.') isFloat = true;
        value += advance();
      }
      
      tokens.push({ 
        type: isFloat ? TokenType.FLOAT_LITERAL : TokenType.INTEGER_LITERAL, 
        value, line, column: startCol 
      });
      continue;
    }

    // String literals
    if (char === '"') {
      let value = advance(); // Consume opening quote
      const startCol = column - 1;
      
      while (current < source.length && source[current] !== '"') {
        value += advance();
      }
      
      if (current < source.length) {
        value += advance(); // Consume closing quote
      }
      
      tokens.push({ type: TokenType.STRING_LITERAL, value, line, column: startCol });
      continue;
    }

    // Operators
    if (/[+\-*/=<>]/.test(char)) {
      let value = advance();
      const startCol = column - 1;
      // Check for two-char operators
      if (current < source.length && OPERATORS.has(value + source[current])) {
        value += advance();
      }
      tokens.push({ type: TokenType.OPERATOR, value, line, column: startCol });
      continue;
    }

    // Delimiters
    if (DELIMITERS.has(char)) {
      const startCol = column;
      tokens.push({ type: TokenType.DELIMITER, value: advance(), line, column: startCol });
      continue;
    }

    // Unknown char
    const startCol = column;
    tokens.push({ type: TokenType.ERROR, value: advance(), line, column: startCol });
  }

  tokens.push({ type: TokenType.EOF, value: '', line, column });
  return tokens;
}
