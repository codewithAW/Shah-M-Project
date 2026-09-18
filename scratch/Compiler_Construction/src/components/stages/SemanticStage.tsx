import React from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import { CheckCircle2, XCircle } from 'lucide-react';
import styles from './SemanticStage.module.css';

export const SemanticStage: React.FC = () => {
  const { semanticResult } = useCompilerStore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Semantic Analysis</h3>
      </div>
      
      <div className={styles.content}>
        <div>
          <h4 className={styles.sectionTitle}>Symbol Table</h4>
          <div className={styles.tableContainer}>
            <table className={styles.symbolTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Scope</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {semanticResult.symbolTable.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Empty</td>
                  </tr>
                )}
                {semanticResult.symbolTable.map((sym, i) => (
                  <tr key={i}>
                    <td>{sym.name}</td>
                    <td style={{ color: 'var(--primary)' }}>{sym.type}</td>
                    <td>{sym.scope}</td>
                    <td>{sym.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className={styles.sectionTitle}>Semantic Checks</h4>
          <div className={styles.checksList}>
            {semanticResult.checks.map((check, i) => (
              <div key={i} className={styles.checkItem}>
                <span className={styles.checkName}>{check.name}</span>
                {check.passed ? (
                  <CheckCircle2 size={18} color="#10b981" />
                ) : (
                  <XCircle size={18} color="#ef4444" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> The semantic analyzer checks for type consistency, scoping rules, and populates the symbol table with identified variables.
      </div>
    </div>
  );
};
