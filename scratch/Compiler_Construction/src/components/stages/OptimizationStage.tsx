import React from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import type { IRInstruction } from '../../compiler/ir/generator';
import styles from './OptimizationStage.module.css';

const InstructionView = ({ inst, isOptimizedOut = false, isChanged = false }: { inst: IRInstruction, isOptimizedOut?: boolean, isChanged?: boolean }) => {
  let className = styles.instructionLine;
  if (isOptimizedOut) className += ` ${styles.optimizedOut}`;
  else if (isChanged) className += ` ${styles.changed}`;

  if (inst.op === 'label') {
    return (
      <div className={className} style={{ background: 'rgba(79, 70, 229, 0.05)' }}>
        <span className={styles.result}>{inst.arg1}:</span>
      </div>
    );
  }
  if (inst.op === '=') {
    return (
      <div className={className}>
        <span className={styles.result}>{inst.result}</span>
        <span className={styles.operator}>=</span>
        <span className={styles.args}>{inst.arg1}</span>
      </div>
    );
  }
  if (inst.op === 'print' || inst.op === 'return') {
    return (
      <div className={className}>
        <span className={styles.operator}>{inst.op}</span>
        <span className={styles.args}>{inst.arg1}</span>
      </div>
    );
  }
  return (
    <div className={className}>
      <span className={styles.result}>{inst.result}</span>
      <span className={styles.operator}>=</span>
      <span className={styles.args}>{inst.arg1} {inst.op} {inst.arg2}</span>
    </div>
  );
};

export const OptimizationStage: React.FC = () => {
  const { irInstructions, optimizedIR } = useCompilerStore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Code Optimization</h3>
      </div>
      
      <div className={styles.content}>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Before (Unoptimized IR)</div>
          <div className={styles.irContainer}>
            {irInstructions.map((inst, idx) => (
              <InstructionView key={idx} inst={inst} />
            ))}
          </div>
        </div>

        <div className={styles.pane}>
          <div className={styles.paneHeader}>After (Optimized IR)</div>
          <div className={styles.irContainer}>
            {optimizedIR.map((inst, idx) => {
              // Very basic heuristic to check if changed for the UI
              const origInst = irInstructions[idx];
              const isChanged = origInst && (origInst.op !== inst.op || origInst.arg1 !== inst.arg1 || origInst.arg2 !== inst.arg2);
              return <InstructionView key={idx} inst={inst} isChanged={isChanged} />;
            })}
          </div>
        </div>
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> The optimizer simplifies code (e.g. constant folding: 10 + 20 becomes 30) and removes dead code to make execution faster.
      </div>
    </div>
  );
};
