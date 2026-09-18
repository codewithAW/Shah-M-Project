import { create } from 'zustand';
import type { Token } from '../compiler/lexer/types';
import { tokenize } from '../compiler/lexer/lexer';
import type { ProgramNode } from '../compiler/parser/ast';
import { parse } from '../compiler/parser/parser';
import type { SemanticResult } from '../compiler/semantic/analyzer';
import { analyze } from '../compiler/semantic/analyzer';
import type { IRInstruction } from '../compiler/ir/generator';
import { generateIR } from '../compiler/ir/generator';
import { optimize } from '../compiler/optimizer/optimizer';
import type { TargetInstruction } from '../compiler/codegen/generator';
import { generateTargetCode } from '../compiler/codegen/generator';
import type { ExecutionState } from '../compiler/executor/executor';
import { execute } from '../compiler/executor/executor';

export type StageIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ViewMode = 'pipeline' | 'full' | 'slides';

export interface CompilerState {
  currentStageIndex: StageIndex;
  viewMode: ViewMode;
  sourceCode: string;
  tokens: Token[];
  ast: ProgramNode | null;
  semanticResult: SemanticResult;
  irInstructions: IRInstruction[];
  optimizedIR: IRInstruction[];
  targetCode: TargetInstruction[];
  executionOutput: ExecutionState;
  isAnimating: boolean;
  animationTrigger: number;
  
  // Actions
  setStageIndex: (index: StageIndex) => void;
  setViewMode: (mode: ViewMode) => void;
  setSourceCode: (code: string) => void;
  nextStage: () => void;
  previousStage: () => void;
  setAnimating: (animating: boolean) => void;
  triggerAnimation: () => void;
}

const defaultCode = `#include <iostream>

int main() {
    int x = 10;
    int y = 20;
    int sum = x + y;

    std::cout << "Sum: " << sum << std::endl;

    return 0;
}`;

export const useCompilerStore = create<CompilerState>((set) => ({
  currentStageIndex: 0,
  viewMode: 'pipeline',
  sourceCode: defaultCode,
  tokens: tokenize(defaultCode),
  ast: parse(tokenize(defaultCode)),
  semanticResult: analyze(parse(tokenize(defaultCode))),
  irInstructions: generateIR(parse(tokenize(defaultCode))),
  optimizedIR: optimize(generateIR(parse(tokenize(defaultCode)))),
  targetCode: generateTargetCode(optimize(generateIR(parse(tokenize(defaultCode))))),
  executionOutput: execute(generateTargetCode(optimize(generateIR(parse(tokenize(defaultCode)))))),
  isAnimating: false,
  animationTrigger: 0,
  
  setStageIndex: (index) => set({ currentStageIndex: index, viewMode: 'full' }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSourceCode: (code) => {
    const newTokens = tokenize(code);
    const newAst = parse(newTokens);
    set({ 
      sourceCode: code,
      tokens: newTokens,
      ast: newAst,
      semanticResult: analyze(newAst),
      irInstructions: generateIR(newAst),
      optimizedIR: optimize(generateIR(newAst)),
      targetCode: generateTargetCode(optimize(generateIR(newAst))),
      executionOutput: execute(generateTargetCode(optimize(generateIR(newAst))))
    });
  },
  nextStage: () => set((state) => ({ 
    currentStageIndex: Math.min(state.currentStageIndex + 1, 6) as StageIndex,
    viewMode: 'pipeline'
  })),
  previousStage: () => set((state) => ({ 
    currentStageIndex: Math.max(state.currentStageIndex - 1, 0) as StageIndex,
    viewMode: 'pipeline'
  })),
  setAnimating: (animating) => set({ isAnimating: animating }),
  triggerAnimation: () => set(() => ({ animationTrigger: Date.now() }))
}));
