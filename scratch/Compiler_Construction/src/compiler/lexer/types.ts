export const TokenType = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  INTEGER_LITERAL: 'INTEGER_LITERAL',
  FLOAT_LITERAL: 'FLOAT_LITERAL',
  STRING_LITERAL: 'STRING_LITERAL',
  OPERATOR: 'OPERATOR',
  DELIMITER: 'DELIMITER',
  PREPROCESSOR: 'PREPROCESSOR',
  EOF: 'EOF',
  ERROR: 'ERROR'
} as const;

export type TokenType = keyof typeof TokenType;

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
