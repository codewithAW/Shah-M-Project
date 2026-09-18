import React, { useState, useMemo } from 'react';
import { slidesText } from '../data/slidesText';
import { Menu, X } from 'lucide-react';
import styles from './CourseNotesView.module.css';

interface Chapter {
  id: string;
  title: string;
  content: string[];
}

export const CourseNotesView: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chapters = useMemo(() => {
    const lines = slidesText.split('\n').filter(line => line.trim().length > 0);
    let parsedChapters: Chapter[] = [];
    let currentChapter: Chapter | null = null;

    lines.forEach(line => {
      // Basic heuristic for Chapter title
      if (line.startsWith('Chapter ')) {
        // If we hit Chapter 1 again after having parsed chapters, it means we just finished the Table of Contents
        if (line.includes('Chapter 1:') && parsedChapters.length > 0) {
          parsedChapters = [];
        }

        if (currentChapter) {
          parsedChapters.push(currentChapter);
        }
        currentChapter = {
          id: line.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          title: line,
          content: []
        };
      } else if (currentChapter) {
        currentChapter.content.push(line);
      } else {
        // Text before the first chapter (ToC header)
        if (!parsedChapters.length) {
           currentChapter = { id: 'intro', title: 'Table of Contents', content: [line] };
        }
      }
    });

    if (currentChapter) {
      parsedChapters.push(currentChapter);
    }
    return parsedChapters;
  }, []);

  const [activeChapterId, setActiveChapterId] = useState<string>(
    chapters.length > 0 ? chapters[0].id : ''
  );

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

  const handleChapterClick = (id: string) => {
    setActiveChapterId(id);
    setIsSidebarOpen(false); // Close sidebar on mobile when a chapter is selected
  };

  return (
    <div className={styles.container}>
      {/* Mobile Toggle Button */}
      <button 
        className={styles.mobileToggleBtn}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Course Navigation"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        <span className={styles.mobileToggleText}>Chapters</span>
      </button>

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <h2 className={styles.sidebarTitle}>Course Notes</h2>
        <ul className={styles.chapterList}>
          {chapters.map(chapter => (
            <li key={chapter.id}>
              <button
                className={`${styles.chapterBtn} ${activeChapterId === chapter.id ? styles.active : ''}`}
                onClick={() => handleChapterClick(chapter.id)}
              >
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.contentCard}>
          {activeChapter ? (
            <>
              <h1 className={styles.chapterHeader}>{activeChapter.title}</h1>
              <div className={styles.chapterBody}>
                {activeChapter.content.map((paragraph, idx) => {
                  // Determine if it's a section heading (e.g. "1.1 Interpreter")
                  const isSectionHeading = /^\d+\.\d+ /.test(paragraph);
                  if (isSectionHeading) {
                    return <h3 key={idx} className={styles.sectionHeading}>{paragraph}</h3>;
                  }
                  
                  // Code-like blocks heuristic (contains special chars or short statements)
                  const isCodeLike = /;|\{|\}|\bint\b|\bfloat\b/.test(paragraph) || paragraph.includes('↓');
                  if (isCodeLike) {
                    return <code key={idx} className={styles.codeBlock}>{paragraph}</code>;
                  }

                  return <p key={idx} className={styles.paragraph}>{paragraph}</p>;
                })}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>No content found.</div>
          )}
        </div>
      </main>
    </div>
  );
};
