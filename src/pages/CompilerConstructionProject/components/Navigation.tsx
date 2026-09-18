import React, { useState, useEffect } from 'react';
import { useCompilerStore } from '../state/compilerStore';
import type { StageIndex } from '../state/compilerStore';
import { Code2, AlignLeft, TreeDeciduous, ShieldCheck, FileJson, Zap, Cpu, TerminalSquare, Sun, Moon, BookOpen, Menu, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Navigation.module.css';

const STAGES = [
  { index: 0 as StageIndex, name: 'Code', icon: Code2 },
  { index: 1 as StageIndex, name: 'Lexical Analysis', icon: AlignLeft },
  { index: 2 as StageIndex, name: 'Syntax Analysis', icon: TreeDeciduous },
  { index: 3 as StageIndex, name: 'Semantic Analysis', icon: ShieldCheck },
  { index: 4 as StageIndex, name: 'Intermediate Code', icon: FileJson },
  { index: 5 as StageIndex, name: 'Optimization', icon: Zap },
  { index: 6 as StageIndex, name: 'Code Generation', icon: Cpu },
  { index: 7 as StageIndex, name: 'Execution', icon: TerminalSquare },
];

export const Navigation: React.FC = () => {
  const { currentStageIndex, setStageIndex, viewMode, setViewMode } = useCompilerStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  return (
    <nav className={`${styles.navContainer} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
      <button 
        className={styles.mobileNavToggle} 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'inherit', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, marginRight: '1rem', backdropFilter: 'blur(10px)' }}
        >
          <ArrowLeft size={16} /> Go Back
        </button>
        <div>
          <h1 className={styles.title}>Compiler Construction Visualizer</h1>
          <span className={styles.subtitle}>Visualize the journey of your C++ code through 7 stages of a compiler</span>
        </div>
      </div>

      <div className={styles.stages}>
        {STAGES.map((stage, i) => {
          const isActive = viewMode !== 'slides' && currentStageIndex === stage.index;
          return (
            <React.Fragment key={stage.index}>
              <button 
                className={`${styles.stageItem} ${isActive ? styles.active : ''}`}
                onClick={() => {
                  setStageIndex(stage.index);
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className={styles.stageNumber}>{stage.index + 1}</span>
                <stage.icon className={styles.stageIcon} size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={styles.stageName}>{stage.name}</span>
              </button>
              {i < STAGES.length - 1 && <div className={styles.connector} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.slideBtn} ${viewMode === 'slides' ? styles.slideBtnActive : ''}`}
          onClick={() => {
            setViewMode('slides');
            setIsMobileMenuOpen(false);
          }}
          title="See the whole slide"
        >
          <BookOpen size={20} />
          <span>Course Notes</span>
        </button>
      </div>

      <button 
        className={styles.themeToggle} 
        aria-label="Toggle theme"
        onClick={() => setIsDarkMode(prev => !prev)}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </nav>
  );
};
