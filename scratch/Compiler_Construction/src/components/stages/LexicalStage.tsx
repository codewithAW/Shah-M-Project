import React from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import { TokenType } from '../../compiler/lexer/types';
import styles from './LexicalStage.module.css';

export const LexicalStage: React.FC = () => {
  const { tokens } = useCompilerStore();

  // Filter out EOF for display if it's not strictly needed
  const displayTokens = tokens.filter(t => t.type !== TokenType.EOF);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Lexical Analysis (Tokens)</h3>
      </div>
      
      <div className={styles.tokenList}>
        {displayTokens.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            No tokens found.
          </div>
        )}
        {displayTokens.map((token, index) => (
          <div key={`${index}-${token.line}-${token.column}`} className={styles.tokenRow}>
            <span className={styles.tokenValue}>{token.value}</span>
            <span className={styles.tokenType}>{token.type}</span>
          </div>
        ))}
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> Lexical analysis reads the source program and converts character sequences into meaningful tokens (lexemes).
      </div>
    </div>
  );
};
