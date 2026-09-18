import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useCompilerStore } from '../../state/compilerStore';
import type { ASTNode } from '../../compiler/parser/ast';
import styles from './SyntaxStage.module.css';

const ASTNodeView: React.FC<{ node: ASTNode }> = ({ node }) => {
  if (!node) return null;

  let valueDisplay = '';
  let children: ASTNode[] = [];

  switch (node.type) {
    case 'Program':
      valueDisplay = 'Program';
      children = node.body || [];
      break;
    case 'FunctionDecl':
      valueDisplay = `${node.returnType} ${node.name}()`;
      children = node.body || [];
      break;
    case 'VarDecl':
      valueDisplay = `${node.varType} ${node.name}`;
      if (node.init) children.push(node.init);
      break;
    case 'AssignStmt':
      valueDisplay = `${node.name} =`;
      if (node.value) children.push(node.value);
      break;
    case 'ReturnStmt':
      valueDisplay = 'return';
      if (node.argument) children.push(node.argument);
      break;
    case 'BinaryExpr':
      valueDisplay = node.operator;
      if (node.left) children.push(node.left);
      if (node.right) children.push(node.right);
      break;
    case 'Identifier':
      valueDisplay = node.name;
      break;
    case 'Literal':
      valueDisplay = node.value;
      break;
    case 'ExpressionStmt':
      valueDisplay = 'Expr';
      if (node.expression) children.push(node.expression);
      break;
    case 'IncludeStmt':
      valueDisplay = `#include ${node.file}`;
      break;
    default:
      valueDisplay = 'Unknown';
  }

  return (
    <div className={styles.astNode}>
      <div className={styles.nodeBox}>
        <div className={styles.nodeType}>{node.type}</div>
        <div className={styles.nodeValue}>{valueDisplay}</div>
      </div>
      {children.length > 0 && (
        <>
          <div className={styles.connector} />
          <div className={styles.childrenContainer}>
            {children.map((child, idx) => (
              <div key={idx} className={styles.childBranch}>
                <div className={styles.branchLine} />
                <ASTNodeView node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const SyntaxStage: React.FC = () => {
  const { ast } = useCompilerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const computeScale = useCallback(() => {
    const container = containerRef.current;
    const tree = treeRef.current;
    if (!container || !tree) return;

    // Temporarily reset scale to measure natural size
    tree.style.transform = 'scale(1)';
    const treeW = tree.scrollWidth;
    const treeH = tree.scrollHeight;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    if (treeW === 0 || treeH === 0) return;

    const padding = 64; // safely account for container padding + breathing room
    const scaleX = (containerW - padding) / treeW;
    const scaleY = (containerH - padding) / treeH;
    const newScale = Math.min(scaleX, scaleY, 1); // never scale up, only down
    setScale(newScale);
    tree.style.transform = `scale(${newScale})`;
  }, []);

  useEffect(() => {
    // Recompute after render
    const frame = requestAnimationFrame(computeScale);
    return () => cancelAnimationFrame(frame);
  }, [ast, computeScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => computeScale());
    ro.observe(container);
    return () => ro.disconnect();
  }, [computeScale]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Syntax Analysis (Parse Tree)</h3>
      </div>
      
      <div className={styles.treeContainer} ref={containerRef}>
        {ast ? (
          <div className={styles.treeScaler} ref={treeRef} style={{ transform: `scale(${scale})` }}>
            <ASTNodeView node={ast} />
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No AST available. Check code for syntax errors.</div>
        )}
      </div>

      <div className={styles.infoArea}>
        <strong>What is happening?</strong> The parser reads tokens and builds an Abstract Syntax Tree (AST) representing the grammatical structure of the program.
      </div>
    </div>
  );
};
