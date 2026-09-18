import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCompilerStore, type CompilerState } from '../state/compilerStore';
import styles from './PipelineAnimationOverlay.module.css';

interface OverlayProps {
  phase: 'enter' | 'transform' | 'exit';
  state: CompilerState;
}

const AnimBlock: React.FC<{
  phase: 'enter' | 'transform' | 'exit';
  sourceText: string;
  targetText: string;
  targetClass: string;
  index: number;
  total: number;
}> = ({ phase, sourceText, targetText, targetClass, index, total }) => {
  // Staggered entering from left, pausing in center, exiting to right
  let x = 0;
  if (phase === 'enter') x = -400;
  if (phase === 'exit') x = 400;
  
  let opacity = 1;
  if (phase === 'enter') opacity = 0;
  if (phase === 'exit') opacity = 0;

  // Layout vertically centered
  const startY = -((total - 1) * 60) / 2;
  const y = startY + index * 60;

  const showTarget = phase === 'transform' || phase === 'exit';
  const delay = phase === 'enter' ? index * 0.15 : phase === 'exit' ? index * 0.1 : 0;

  return (
    <motion.div
      className={`${styles.animBlock} ${showTarget ? targetClass : ''}`}
      initial={{ x: -400, opacity: 0, y }}
      animate={{ x, opacity, y }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay }}
    >
      {showTarget ? targetText : sourceText}
    </motion.div>
  );
};

const CodeToLexical: React.FC<OverlayProps> = ({ phase, state }) => {
  const lines = state.sourceCode.split('\n').filter(l => l.trim()).slice(0, 5);
  return (
    <>
      {lines.map((line, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={lines.length}
          sourceText={line.length > 20 ? line.substring(0, 20) + '...' : line}
          targetText={`Token[]`}
          targetClass={styles.tokenBlock}
        />
      ))}
    </>
  );
};

const LexicalToSyntax: React.FC<OverlayProps> = ({ phase, state }) => {
  const tokens = state.tokens.filter(t => t.type !== 'EOF').slice(0, 5);
  return (
    <>
      {tokens.map((token, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={tokens.length}
          sourceText={`[${token.type}] ${token.value}`}
          targetText={`AST Node`}
          targetClass={styles.astBlock}
        />
      ))}
    </>
  );
};

const SyntaxToSemantic: React.FC<OverlayProps> = ({ phase }) => {
  const items = ['AST: Program', 'AST: FunctionDecl', 'AST: ReturnStmt'];
  return (
    <>
      {items.map((item, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={items.length}
          sourceText={item}
          targetText={`${item} (Valid)`}
          targetClass={styles.astBlock}
        />
      ))}
    </>
  );
};

const SemanticToIR: React.FC<OverlayProps> = ({ phase, state }) => {
  const items = state.irInstructions.slice(0, 5);
  return (
    <>
      {items.map((item, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={items.length}
          sourceText={`AST Node`}
          targetText={`${item.op} ${item.arg1 || ''}`}
          targetClass={styles.irBlock}
        />
      ))}
    </>
  );
};

const IRToOpt: React.FC<OverlayProps> = ({ phase, state }) => {
  const items = state.optimizedIR.slice(0, 5);
  return (
    <>
      {items.map((item, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={items.length}
          sourceText={`IR: ${item.op} ${item.arg1 || ''}`}
          targetText={`OPT: ${item.op} ${item.result || ''}`}
          targetClass={styles.optBlock}
        />
      ))}
    </>
  );
};

const OptToTarget: React.FC<OverlayProps> = ({ phase, state }) => {
  const items = state.targetCode.slice(0, 5);
  return (
    <>
      {items.map((item, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={items.length}
          sourceText={`OPT IR`}
          targetText={`${item.op} ${item.args.join(', ')}`}
          targetClass={styles.targetBlock}
        />
      ))}
    </>
  );
};

const TargetToExec: React.FC<OverlayProps> = ({ phase, state }) => {
  const items = state.targetCode.slice(0, 3);
  return (
    <>
      {items.map((item, i) => (
        <AnimBlock 
          key={i} phase={phase} index={i} total={items.length}
          sourceText={`${item.op} ${item.args.join(', ')}`}
          targetText={`Executing...`}
          targetClass={styles.animBlock} // default style
        />
      ))}
    </>
  );
};

export const PipelineAnimationOverlay: React.FC = () => {
  const state = useCompilerStore();
  const { currentStageIndex, isAnimating } = state;
  const [phase, setPhase] = useState<'enter' | 'transform' | 'exit'>('enter');

  useEffect(() => {
    if (isAnimating) {
      setPhase('enter');
      // Timing:
      // 0ms - 1000ms: enter animation (blocks slide in from left)
      // 1000ms: transform triggers (text changes, color changes)
      // 2000ms: exit triggers (blocks slide right)
      // 3000ms: isAnimating becomes false in parent component
      
      const t1 = setTimeout(() => setPhase('transform'), 1000);
      const t2 = setTimeout(() => setPhase('exit'), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isAnimating]);

  if (!isAnimating) return null;

  const renderContent = () => {
    switch (currentStageIndex) {
      case 0: return <CodeToLexical phase={phase} state={state} />;
      case 1: return <LexicalToSyntax phase={phase} state={state} />;
      case 2: return <SyntaxToSemantic phase={phase} state={state} />;
      case 3: return <SemanticToIR phase={phase} state={state} />;
      case 4: return <IRToOpt phase={phase} state={state} />;
      case 5: return <OptToTarget phase={phase} state={state} />;
      case 6: return <TargetToExec phase={phase} state={state} />;
      default: return null;
    }
  };

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.animContainer}>
        {renderContent()}
      </div>
    </div>
  );
};
