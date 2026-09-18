import React from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import styles from './IRStage.module.css';

export const IRStage: React.FC = () => {
  const { irInstructions } = useCompilerStore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Intermediate Code Generation</h3>
      </div>
      
      <div className={styles.irContainer}>
        {irInstructions.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No IR Generated.</div>
        )}
        
        {irInstructions.map((inst, idx) => {
          if (inst.op === 'label') {
            return (
              <div key={idx} className={styles.instructionLine} style={{ background: 'rgba(79, 70, 229, 0.05)' }}>
                <span className={styles.result}>{inst.arg1}:</span>
              </div>
            );
          }

          if (inst.op === '=') {
            return (
              <div key={idx} className={styles.instructionLine}>
                <span className={styles.result}>{inst.result}</span>
                <span className={styles.operator}>=</span>
                <span className={styles.args}>{inst.arg1}</span>
              </div>
            );
          }

          if (inst.op === 'print') {
            return (
              <div key={idx} className={styles.instructionLine}>
                <span className={styles.operator}>print</span>
                <span className={styles.args}>{inst.arg1}</span>
              </div>
            );
          }

          if (inst.op === 'return') {
            return (
              <div key={idx} className={styles.instructionLine}>
                <span className={styles.operator}>return</span>
                <span className={styles.args}>{inst.arg1}</span>
              </div>
            );
          }

          // General binary expression
          return (
            <div key={idx} className={styles.instructionLine}>
              <span className={styles.result}>{inst.result}</span>
              <span className={styles.operator}>=</span>
              <span className={styles.args}>{inst.arg1} {inst.op} {inst.arg2}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> The AST is converted into a linear Three-Address Code format, simplifying complex expressions into simple instructions.
      </div>
    </div>
  );
};
