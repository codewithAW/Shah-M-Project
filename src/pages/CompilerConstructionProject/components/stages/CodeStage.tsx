import React from 'react';
import Editor from '@monaco-editor/react';
import { useCompilerStore } from '../../state/compilerStore';
import styles from './CodeStage.module.css';

export const CodeStage: React.FC = () => {
  const { sourceCode, setSourceCode } = useCompilerStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSourceCode(value);
      // TODO: Invalidate downstream stages when source changes
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>C++ Source Code</h3>
      </div>
      
      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={sourceCode}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            roundedSelection: false,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> Write your educational C++ subset code here. It will be passed to the Lexical Analyzer.
      </div>
    </div>
  );
};
