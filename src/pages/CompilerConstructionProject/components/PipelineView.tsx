import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompilerStore } from '../state/compilerStore';
import { PipelineAnimationOverlay } from './PipelineAnimationOverlay';
import { ChevronLeft, ChevronRight, Play, Maximize2, Minimize2 } from 'lucide-react';
import { CodeStage } from './stages/CodeStage';
import { LexicalStage } from './stages/LexicalStage';
import { SyntaxStage } from './stages/SyntaxStage';
import { SemanticStage } from './stages/SemanticStage';
import { IRStage } from './stages/IRStage';
import { OptimizationStage } from './stages/OptimizationStage';
import { CodeGenStage } from './stages/CodeGenStage';
import { ExecutionStage } from './stages/ExecutionStage';
import styles from './PipelineView.module.css';

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

export const PipelineView: React.FC = () => {
  const { currentStageIndex, nextStage, previousStage, isAnimating, setAnimating } = useCompilerStore();
  const [expandedPanel, setExpandedPanel] = useState<'left' | 'right' | null>(null);
  
  // Track direction for Framer Motion animation
  const prevIndex = useRef(currentStageIndex);
  const direction = currentStageIndex > prevIndex.current ? 1 : -1;
  
  useEffect(() => {
    prevIndex.current = currentStageIndex;
    setExpandedPanel(null); // Reset when stage changes
  }, [currentStageIndex]);

  // Escape key to exit expanded mode
  useEffect(() => {
    if (!expandedPanel) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedPanel(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPanel]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      z: 0,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const handleAnimate = () => {
    setAnimating(true);
    // PipelineAnimationOverlay controls its internal timeline; 
    // it runs for exactly 3000ms.
    setTimeout(() => {
      setAnimating(false);
    }, 3000);
  };

  return (
    <div className={styles.pipelineContainer}>
      <button 
        className={`${styles.navBtn} ${styles.prevBtn}`}
        onClick={previousStage}
        disabled={currentStageIndex === 0 || isAnimating}
      >
        <ChevronLeft size={24} />
      </button>

      <div className={styles.sliderWindow}>
        <PipelineAnimationOverlay />
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={`left-${currentStageIndex}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`${styles.panelWrapper} ${expandedPanel === 'left' ? styles.panelExpanded : ''}`}
          >
            {STAGE_COMPONENTS[currentStageIndex]}
            {(expandedPanel === null || expandedPanel === 'left') && (
              <button
                className={styles.expandBtn}
                onClick={() => setExpandedPanel(prev => prev === 'left' ? null : 'left')}
                title={expandedPanel === 'left' ? 'Exit fullscreen' : 'Expand'}
              >
                {expandedPanel === 'left' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={styles.centerControl}>
          <button 
            className={styles.animateBtn} 
            onClick={handleAnimate}
            disabled={isAnimating}
          >
            {isAnimating ? (
              <>Animating...</>
            ) : (
              <>
                Animate <Play size={18} />
              </>
            )}
          </button>
        </div>

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={`right-${currentStageIndex + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`${styles.panelWrapper} ${expandedPanel === 'right' ? styles.panelExpanded : ''}`}
          >
            {STAGE_COMPONENTS[currentStageIndex + 1] || (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <h3>Pipeline Complete</h3>
              </div>
            )}
            {(expandedPanel === null || expandedPanel === 'right') && STAGE_COMPONENTS[currentStageIndex + 1] && (
              <button
                className={styles.expandBtn}
                onClick={() => setExpandedPanel(prev => prev === 'right' ? null : 'right')}
                title={expandedPanel === 'right' ? 'Exit fullscreen' : 'Expand'}
              >
                {expandedPanel === 'right' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button 
        className={`${styles.navBtn} ${styles.nextBtn}`}
        onClick={nextStage}
        disabled={currentStageIndex >= 6 || isAnimating}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};
