import React from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import styles from './CodeGenStage.module.css';

export const CodeGenStage: React.FC = () => {
  const { targetCode } = useCompilerStore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Code Generation (Target Code)</h3>
      </div>
      
      <div className={styles.codeContainer}>
        {targetCode.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No Target Code Generated.</div>
        )}
        
        {targetCode.length > 0 && (
          <div className={styles.codeBox}>
            {targetCode.map((inst, idx) => {
              if (inst.op.endsWith(':')) {
                return (
                  <div key={idx} className={styles.instructionLine} style={{ marginTop: idx > 0 ? '1rem' : 0 }}>
                    <span className={styles.label}>{inst.op}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className={styles.instructionLine} style={{ paddingLeft: '2rem' }}>
                  <span className={styles.opcode}>{inst.op}</span>
                  <div>
                    {inst.args.map((arg, i) => (
                      <span key={i} className={styles.operand}>{arg}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> The optimized IR is mapped to final target architecture instructions (Assembly). Registers and memory addresses are assigned.
      </div>
    </div>
  );
};
