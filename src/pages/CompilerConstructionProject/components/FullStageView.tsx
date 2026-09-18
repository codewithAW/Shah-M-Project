import React, { useState, useEffect } from 'react';
import { useCompilerStore } from '../state/compilerStore';
import { ArrowLeft, Play, Maximize2, Minimize2 } from 'lucide-react';
import styles from './FullStageView.module.css';
import { LexicalScene } from './3d/LexicalScene';
import { SyntaxScene } from './3d/SyntaxScene';
import { SemanticScene } from './3d/SemanticScene';
import { IRScene } from './3d/IRScene';
import { OptimizationScene } from './3d/OptimizationScene';
import { CodeGenScene } from './3d/CodeGenScene';

import { CodeStage } from './stages/CodeStage';
import { LexicalStage } from './stages/LexicalStage';
import { SyntaxStage } from './stages/SyntaxStage';
import { SemanticStage } from './stages/SemanticStage';
import { IRStage } from './stages/IRStage';
import { OptimizationStage } from './stages/OptimizationStage';
import { CodeGenStage } from './stages/CodeGenStage';
import { ExecutionStage } from './stages/ExecutionStage';

const STAGE_INFO = [
  { title: 'Code', subtitle: 'Write your C++ source code' },
  { title: 'Lexical Analysis', subtitle: 'Breaks code into tokens' },
  { title: 'Syntax Analysis', subtitle: 'Creates parse tree (AST)' },
  { title: 'Semantic Analysis', subtitle: 'Checks meaning, types and scopes' },
  { title: 'Intermediate Code Generation', subtitle: 'Generates intermediate representation' },
  { title: 'Optimization', subtitle: 'Improves code for better performance' },
  { title: 'Code Generation', subtitle: 'Generates target code (Assembly/Machine)' },
  { title: 'Execution Output', subtitle: 'Executes machine code' },
];

const STAGE_COMPONENTS: Record<number, React.ReactNode> = {
  0: <CodeStage />,
  1: <LexicalStage />,
  2: <SyntaxStage />,
  3: <SemanticStage />,
  4: <IRStage />,
  5: <OptimizationStage />,
  6: <CodeGenStage />,
  7: <ExecutionStage />
};

const STAGE_SCENES: Record<number, React.ReactNode> = {
  1: <LexicalScene />,
  2: <SyntaxScene />,
  3: <SemanticScene />,
  4: <IRScene />,
  5: <OptimizationScene />,
  6: <CodeGenScene />,
};

export const FullStageView: React.FC = () => {
  const { currentStageIndex, setViewMode, isAnimating, setAnimating, triggerAnimation, previousStage } = useCompilerStore();
  const [isVisExpanded, setIsVisExpanded] = useState(false);
  const [is2DExpanded, setIs2DExpanded] = useState(false);
  // For row-layout stages: track which panel is expanded (null = none, 'left' = 3D, 'right' = 2D)
  const [expandedPanel, setExpandedPanel] = useState<'left' | 'right' | null>(null);
  
  const info = STAGE_INFO[currentStageIndex];

  // Is this a row-layout stage (Lexical, Syntax, Semantic, IR, Opt, CodeGen)?
  const isRowStage = currentStageIndex >= 1 && currentStageIndex <= 6;
  // Is this the execution stage?
  const isExecutionStage = currentStageIndex === 7;
  // Does this stage have a standard 3D scene (non-row, non-execution)?
  const hasStandard3D = currentStageIndex >= 1 && !isRowStage && !isExecutionStage;

  // Reset expand states when stage changes
  useEffect(() => {
    setIsVisExpanded(false);
    setIs2DExpanded(false);
    setExpandedPanel(null);
  }, [currentStageIndex]);

  // Escape key to exit expanded mode
  useEffect(() => {
    const anyExpanded = isVisExpanded || is2DExpanded || expandedPanel !== null;
    if (!anyExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisExpanded(false);
        setIs2DExpanded(false);
        setExpandedPanel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisExpanded, is2DExpanded, expandedPanel]);

  const handleAnimate = () => {
    if (isAnimating) return;
    setAnimating(true);
    triggerAnimation();
    setTimeout(() => setAnimating(false), 3000);
  };

  return (
    <div className={styles.container}>
      {/* Header row */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => {
            if (currentStageIndex > 0) previousStage();
            else setViewMode('pipeline');
          }}
        >
          <ArrowLeft size={20} />
          Go to Previous Section
        </button>
        
        <button 
          className={`${styles.animateButton} ${isAnimating ? styles.animating : ''}`}
          onClick={handleAnimate}
          disabled={isAnimating || currentStageIndex === 0}
        >
          <Play size={18} />
          {isAnimating ? 'Animating...' : 'Animate'}
        </button>
      </div>

      {/* Title */}
      <div className={styles.titleArea}>
        <h2 className={styles.stageTitle}>{info.title}</h2>
        <span className={styles.stageSubtitle}>{info.subtitle}</span>
      </div>

      {/* ═══ ROW LAYOUT: Stages 1 through 6 ═══ */}
      {isRowStage && (
        <div className={styles.rowLayout}>
          {/* Left panel: 3D animated scene */}
          <div className={`${styles.rowPanel} ${expandedPanel === 'left' ? styles.rowPanelExpanded : ''}`}>
            <span className={styles.panelLabel}>Animated View</span>
            {STAGE_SCENES[currentStageIndex]}
            {(expandedPanel === null || expandedPanel === 'left') && (
              <button
                className={styles.panelExpandBtn}
                onClick={() => setExpandedPanel(prev => prev === 'left' ? null : 'left')}
                title={expandedPanel === 'left' ? 'Exit fullscreen' : 'Expand'}
              >
                {expandedPanel === 'left' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </div>

          {/* Right panel: 2D view (Graph, Tokens, Code, etc.) */}
          <div className={`${styles.rowPanel} ${styles.rowPanel2D} ${expandedPanel === 'right' ? styles.rowPanelExpanded : ''}`}>
            <span className={styles.panelLabel}>2D View</span>
            {STAGE_COMPONENTS[currentStageIndex]}
            {(expandedPanel === null || expandedPanel === 'right') && (
              <button
                className={styles.panelExpandBtn}
                onClick={() => setExpandedPanel(prev => prev === 'right' ? null : 'right')}
                title={expandedPanel === 'right' ? 'Exit fullscreen' : 'Expand'}
              >
                {expandedPanel === 'right' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ STANDARD LAYOUT: 3D on top, 2D below (Lexical, IR, Optimization, CodeGen) ═══ */}
      {hasStandard3D && (
        <>
          {/* 3D Visualization */}
          <div className={`${styles.visSection} ${isVisExpanded ? styles.visExpanded : ''}`}>
            {STAGE_SCENES[currentStageIndex]}
            <button
              className={styles.expandBtn}
              onClick={() => setIsVisExpanded(prev => !prev)}
              title={isVisExpanded ? 'Exit fullscreen' : 'Expand visualization'}
            >
              {isVisExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>

          {/* 2D Content with expand button (especially for Lexical) */}
          <div className={styles.contentWithExpand}>
            <div className={`${styles.contentExpandWrapper} ${is2DExpanded ? styles.contentExpandWrapperExpanded : ''}`}>
              {STAGE_COMPONENTS[currentStageIndex]}
              <button
                className={styles.panelExpandBtn}
                onClick={() => setIs2DExpanded(prev => !prev)}
                title={is2DExpanded ? 'Exit fullscreen' : 'Expand'}
              >
                {is2DExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ EXECUTION STAGE: Terminal output ═══ */}
      {isExecutionStage && (
        <div className={styles.terminalContainer}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalDots}>
              <div className={`${styles.terminalDot} ${styles.terminalDotRed}`} />
              <div className={`${styles.terminalDot} ${styles.terminalDotYellow}`} />
              <div className={`${styles.terminalDot} ${styles.terminalDotGreen}`} />
            </div>
            <span className={styles.terminalTitle}>Output Terminal — ./program</span>
            <div style={{ width: 48 }} /> {/* Spacer to center the title */}
          </div>
          <ExecutionStage />
        </div>
      )}

      {/* ═══ CODE STAGE (index 0): No 3D, just the editor ═══ */}
      {currentStageIndex === 0 && (
        <div className={styles.content}>
          {STAGE_COMPONENTS[0]}
        </div>
      )}
    </div>
  );
};
