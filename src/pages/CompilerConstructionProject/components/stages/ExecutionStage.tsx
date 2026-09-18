import React from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import styles from './ExecutionStage.module.css';

export const ExecutionStage: React.FC = () => {
  const { executionOutput } = useCompilerStore();

  return (
    <div className={styles.terminalBody}>
      {/* Prompt line */}
      <div className={styles.line}>
        <span className={styles.prompt}>$</span>{' '}
        <span className={styles.command}>./program</span>
      </div>

      {/* Output lines */}
      {executionOutput.output.length > 0 ? (
        executionOutput.output.map((out, i) => (
          <div key={i} className={styles.outputLine}>{out}</div>
        ))
      ) : (
        <div className={styles.emptyLine}>// No output</div>
      )}

      {/* Return code */}
      <div className={styles.line} style={{ marginTop: '0.75rem' }}>
        <span className={styles.prompt}>$</span>{' '}
        <span className={styles.returnCode}>Process exited with code 0</span>
      </div>

      {/* Blinking cursor */}
      <div className={styles.line}>
        <span className={styles.prompt}>$</span>{' '}
        <span className={styles.cursor} />
      </div>
    </div>
  );
};
