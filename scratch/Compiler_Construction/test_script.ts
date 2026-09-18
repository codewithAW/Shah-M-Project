import { tokenize } from './src/compiler/lexer/lexer';
import { parse } from './src/compiler/parser/parser';
import { analyze } from './src/compiler/semantic/analyzer';
import { generateIR } from './src/compiler/ir/generator';
import { optimize } from './src/compiler/optimizer/optimizer';
import { generateTargetCode } from './src/compiler/codegen/generator';
import { execute } from './src/compiler/executor/executor';

const prog1 = `#include <iostream>

int main() {
    int x = 10;
    int y = 20;
    int sum = x + y;

    std::cout << "Sum: " << sum << std::endl;

    return 0;
}`;

const prog2 = `int main() {
    int a = 5;
    int b = 10;
    int c = a + b;
    return c;
}`;

const progUndeclared = `int main() { x = 10; return 0; }`;
const progDuplicate = `int main() { int a = 5; int a = 10; return 0; }`;
const progSyntax = `int main() { int a = 5 return 0; }`;

function runPipeline(name: string, code: string) {
    console.log(`\n\n=== Running Pipeline for ${name} ===`);
    const tokens = tokenize(code);
    console.log(`Lexer: ${tokens.length} tokens generated`);
    
    const ast = parse(tokens);
    console.log(`Parser: AST generated`);
    
    const semantic = analyze(ast);
    const errors = semantic.checks.filter(c=>!c.passed);
    console.log(`Semantic: ${semantic.symbolTable.length} symbols, ${errors.length} errors`);
    if (errors.length > 0) console.log('Semantic Errors:', errors.map(e => e.name));
    
    const ir = generateIR(ast);
    console.log(`IR: ${ir.length} instructions`);
    
    const optIR = optimize(ir);
    console.log(`Optimize: ${optIR.length} instructions`);
    
    const target = generateTargetCode(optIR);
    console.log(`CodeGen: ${target.length} target instructions`);
    
    const exec = execute(target);
    console.log(`Execution Output:`);
    console.log(exec.output.join('\n'));
    console.log(`Registers:`, exec.registers);
}

runPipeline('Program 1', prog1);
runPipeline('Program 2', prog2);
runPipeline('Undeclared Var', progUndeclared);
runPipeline('Duplicate Var', progDuplicate);
runPipeline('Syntax Error', progSyntax);
