export const slidesText = `
Compiler Construction — Table of Contents
Table of Contents — According to HEC Course Content
Chapter 1: Introduction
Introduction to Interpreter 
Introduction to Compiler 
Compiler vs Interpreter 
Chapter 2: Compiler Techniques and Methodology
Introduction to Compiler Techniques 
Compiler Methodology 
Basic Working of a Compiler 
Chapter 3: Organization of Compilers
Organization of a Compiler 
Main Phases of a Compiler 
Lexical Analysis 
Syntax Analysis 
Semantic Analysis 
Code Generation 
Code Optimization 
Symbol Table 
Error Handling 
Chapter 4: Lexical Analysis
Introduction to Lexical Analysis 
Lexical Analyzer 
Tokens 
Lexemes 
Patterns 
Lexical Errors 
Chapter 5: Syntax Analysis
Introduction to Syntax Analysis 
Syntax Analyzer 
Grammar 
Parse Tree 
Chapter 6: Parsing Techniques
Introduction to Parsing 
Parsing Techniques 
Types of Parsers 
Chapter 7: Top-Down Parsing
Introduction to Top-Down Parsing 
Basic Working of Top-Down Parsing 
Recursive Descent Parsing 
Predictive Parsing 
Chapter 8: Bottom-Up Parsing
Introduction to Bottom-Up Parsing 
Basic Working of Bottom-Up Parsing 
Shift-Reduce Parsing 
Chapter 9: Type Checking
Introduction to Type Checking 
Type Errors 
Type Compatibility 
Type Conversion 
Chapter 10: Semantic Analyzer
Introduction to Semantic Analysis 
Role of Semantic Analyzer 
Semantic Errors 
Chapter 11: Object Code Generation
Introduction to Code Generation 
Object Code 
Basic Object Code Generation 
Chapter 12: Code Optimization
Introduction to Code Optimization 
Need for Optimization 
Basic Optimization Techniques 
Chapter 13: Detection and Recovery from Errors
Types of Compiler Errors 
Error Detection 
Error Recovery 
Chapter 1: Introduction
1.1 Interpreter
An interpreter is a program that translates and executes a high-level program statement by statement.
In simple words:
Interpreter reads one statement, translates it, executes it, and then moves to the next statement.
Example
Python uses an interpreter to run Python programs.
print("Hello")
a = 10
b = 20
print(a + b)
The interpreter processes the statements during program execution.
Simple Flow
Source Program
      ↓
  Interpreter
      ↓
Translate + Execute
      ↓
Result stored in RAM
      ↓
Next Statement
For example:
a = 10
   ↓
Translate + Execute
   ↓
a = 10 is stored in RAM
b = 20
   ↓
Translate + Execute
   ↓
b = 20 is stored in RAM
print(a + b)
   ↓
10 + 20 = 30
   ↓
30 is displayed
If an Error Occurs
If the interpreter finds an error while executing a statement, it reports the error and normally stops execution at that point.
1.2 Compiler
A compiler is a program that translates a high-level program into target code before execution.
Example
C programs are commonly compiled using a compiler.
#include &lt;stdio.h&gt;
int main() {
    int a = 10;
    int b = 20;
    printf("%d", a + b);
    return 0;
}
The compiler translates the program before it is executed.
Simple Flow
Source Program
      ↓
    Compiler
      ↓
Translate Program
      ↓
 Target Code
      ↓
Stored as an executable/object file
      ↓
   Execute
      ↓
    Output
The translated target code is stored in an executable or object file (depending on the compilation process). When the program runs, its instructions and data are loaded into RAM for execution.
1.3 Compiler vs Interpreter
Compiler
Interpreter
Translates the program before execution.
Translates and executes statement by statement.
Produces target code in a typical compilation process.
Usually does not produce a separate executable file.
Errors are reported during compilation.
Errors are reported during execution when the problematic statement is reached.
Program usually runs faster after compilation.
Execution is generally slower in the traditional interpretation model.
Example: C, C++
Example: Python, JavaScript
Easy Difference
Compiler → Translate first, execute later.
Interpreter → Translate and execute statement by statement.
1.4 Compiler Construction
Compiler Construction is the study of how compilers are designed and developed.
A compiler converts a high-level program into target code through several steps.
Source Program
      ↓
Lexical Analysis
      ↓
Syntax Analysis
      ↓
Semantic Analysis
      ↓
Intermediate Code
      ↓
Code Optimization
      ↓
Code Generation
      ↓
Target Program
1.5 Why Do We Need a Compiler?
Computers understand machine language, while programmers prefer high-level languages.
A compiler acts as a bridge:
Programmer
     ↓
High-Level Language
     ↓
  Compiler
     ↓
Target/Machine Code
     ↓
 Computer
1.6 Important Terms
Source Program:The program written by the programmer.
Target Program:The program produced after translation by a compiler.
High-Level Language:A programming language that is easier for humans to understand, such as C, C++, and Python.
Machine Language:Instructions that can be directly understood by the computer's processor.
⭐ Quick Revision
Interpreter:Translates and executes a program statement by statement.
Compiler:Translates a program before execution.
Compiler Construction:The study of designing and developing compilers.
Main difference:
Compiler     → Translate → Store Target Code → Execute
Interpreter  → Translate + Execute → Result in RAM
Chapter 2: Compiler Techniques and Methodology
2.1 Introduction to Compiler Techniques
Compiler techniques are the methods used by a compiler to read, check, translate, and improve a program.
A compiler uses different techniques to convert a source program into a target program.
Simple Flow
Source Program
      ↓
   Compiler
      ↓
Read and Check
      ↓
   Translate
      ↓
Target Program
The main techniques used by a compiler are:
Lexical Analysis – Finds words and symbols. 
Syntax Analysis – Checks the structure of the program. 
Semantic Analysis – Checks the meaning of the program. 
Intermediate Code Generation – Creates an intermediate form. 
Code Optimization – Improves the code. 
Code Generation – Produces target code. 
These techniques help the compiler correctly translate the source program.
A compiler normally processes a program through several stages:
We will study each stage separately.
1. Lexical Analysis
Lexical Analysis is the first major stage.
It reads the source program and breaks it into small units called tokens.
Example
int age = 20;
Tokens are:
int
age
=
20
;
The component that performs this work is called a Lexical Analyzer or Scanner.
Remember:
Lexical Analysis = Identify tokens.
2. Syntax Analysis
Syntax Analysis checks whether the tokens are arranged according to the rules of the programming language.
It is also called Parsing.
Correct:
a = b + c;
Incorrect:
a = + * b;
The component responsible for this stage is called a Parser.
Remember:
Syntax Analysis = Check the structure of the program.
3. Semantic Analysis
Semantic Analysis checks the meaning of the program.
For example:
int age;
age = "Hello";
The syntax may be correct, but assigning a string to an integer variable is normally a type error.
Semantic analysis performs checks such as:
Type checking 
Variable declaration 
Scope checking 
Function parameter checking 
Remember:
Semantic Analysis = Check the meaning of the program.
4. Intermediate Code Generation
The compiler may convert the source program into an Intermediate Representation (IR) before generating machine code.
Example
Source:
a = b + c * 10;
Intermediate code:
t1 = c * 10
t2 = b + t1
a = t2
Here, t1 and t2 are temporary variables.
Why use intermediate code?
It makes the compiler:
Easier to optimize 
Easier to convert to different target machines 
Remember:
Intermediate Code = Code between source code and target code.
6. Code Optimization
Code Optimization improves the generated code so that it can run more efficiently.
The goals can include:
Faster execution 
Less memory usage 
Smaller code 
Example
x = 10 * 2;
The compiler can calculate this during compilation:
x = 20;
This technique is called constant folding.
Remember:
Code Optimization = Improve code efficiency without changing its intended result.
7. Code Generation
Code Generation is the stage where the compiler produces the final target code.
The target code may be:
Machine code 
Assembly code 
Other target-specific code 
Remember:
Code Generation = Convert intermediate representation into target code.
2.3 Basic Working of a Compiler
The basic working of a compiler can be understood in the following steps:
        Source Program
              ↓
       Lexical Analysis
              ↓
        Syntax Analysis
              ↓
       Semantic Analysis
              ↓
    Intermediate Code
              ↓
       Code Optimization
              ↓
        Code Generation
              ↓
        Target Program
Example
Suppose the programmer writes:
a = 10 + 20
The compiler processes it:
Step 1: Lexical Analysis
The compiler identifies:
a    =    10    +    20
Step 2: Syntax Analysis
It checks whether the statement has the correct structure.
a = 10 + 20
      ✓
Step 3: Semantic Analysis
It checks whether the statement makes sense.
a = 10 + 20
      ✓
Step 4: Intermediate Code
The compiler creates an intermediate representation.
For example:
t1 = 10 + 20
a = t1
Step 5: Code Optimization
The compiler may simplify the calculation:
a = 30
Step 6: Code Generation
The compiler produces target code that the computer can execute.
⭐ Quick Revision
Compiler Techniques
Techniques are the methods used by a compiler to read, check, translate, and improve a program.
Compiler Methodology
Compiler methodology is the step-by-step process used by a compiler to convert a source program into a target program.
Chapter 3: Organization of Compilers
3.1 Organization of a Compiler
A compiler is divided into different parts called phases. Each phase performs a specific task.
The compiler also uses a Symbol Table and Error Handling to support these phases.
3.2 Main Phases of a Compiler
The main phases are:
Lexical Analysis – Identifies tokens. 
Syntax Analysis – Checks the structure of the program. 
Semantic Analysis – Checks the meaning of the program. 
Code Optimization – Makes the code more efficient. 
Code Generation – Produces target code. 
Each phase performs a specific task and passes its result to the next phase.
3.3 Symbol Table
A Symbol Table is used by the compiler to store information about the names used in a program.
It can store information about:
Variables 
Functions 
Constants 
Data types 
Example
int age = 20;
The symbol table may contain:
Name
Type
Value
age
int
20
Symbol Table → Stores information about program names.
Used in: Multiple phases, especially Semantic Analysis and Code Generation.
3.4 Error Handling
Error Handling means finding and reporting errors in a program.
The compiler checks the program and reports errors when it finds a problem.
Example
int a
a = 10;
If a semicolon is required after int a, the compiler reports an error.
Error Handling → Finds and reports errors.
Used in: Multiple phases because different types of errors can occur at different stages.
⭐ Chapter 3 – Quick Revision
Organization of Compiler:A compiler is divided into different phases that work together.
Main Phases:
Lexical Analysis → Syntax Analysis → Semantic Analysis → Code Optimization → Code Generation
Symbol Table:Stores information about program names.
Used in: Multiple phases, especially Semantic Analysis and Code Generation.
Error Handling:Finds and reports errors.
Used in: Multiple phases of the compiler.
Chapter 4: Lexical Analysis
4.1 Introduction to Lexical Analysis
Lexical Analysis is the first phase of a compiler.
It reads the source program and breaks it into small meaningful units called tokens.
Example
a = b + 10
The lexical analyzer identifies:
a    =    b    +    10
Lexical Analysis → Converts source code into tokens.
Used in: First phase of the compiler.
4.2 Lexical Analyzer
A Lexical Analyzer is the part of the compiler that performs lexical analysis.
It reads the source program from left to right and identifies tokens.
Simple Flow
Source Program
      ↓
Lexical Analyzer
      ↓
Tokens
Main Jobs
Reads the source program. 
Identifies tokens. 
Removes unnecessary spaces and comments. 
Reports lexical errors. 
Sends tokens to the next phase. 
Lexical Analyzer → Reads source code and produces tokens.
4.3 Tokens
A token is a meaningful unit identified by the lexical analyzer.
Example
int age = 20;
Tokens:
int
age
=
20
;
Common types of tokens are:
Keyword 
Identifier 
Operator 
Number 
Separator 
Example
Lexeme
Token Type
int
Keyword
age
Identifier
=
Operator
20
Number
;
Separator
Token → Type or category of a program element.
4.4 Lexemes
A lexeme is the actual text found in the source program that forms a token.
Example
int age = 20;
The lexemes are:
int
age
=
20
;
For example:
age → Lexeme
Identifier → Token Type
Easy Difference
Lexeme = Actual text
Token = Type or category
4.5 Patterns
A pattern is a rule that describes what a token should look like.
Example
A simple pattern for an identifier is:
Letter → Letter or Digit
Valid identifiers:
age
total
student1
marks
Pattern → Rule that describes the form of a token.
4.6 Lexical Errors
A lexical error occurs when the lexical analyzer finds an invalid character or sequence of characters.
Example
int @age;
If @ is not allowed in that position, it causes a lexical error.
Another example:
print("Hello)
The closing quotation mark is missing.
Common Lexical Errors
Invalid characters 
Invalid identifiers 
Incorrect numbers 
Unterminated strings 
Lexical Error → Invalid character or sequence of characters.
Used in: Lexical Analysis.
⭐ Chapter 4 – Quick Revision
Lexical Analysis:Converts source code into tokens.
Lexical Analyzer:Reads source code and produces tokens.
Token:Type or category of a program element.
Lexeme:Actual text in the source program.
Pattern:Rule that describes the form of a token.
Lexical Error:An invalid character or sequence of characters.
⭐ Remember
Lexeme  → Actual Text
Token   → Type
Pattern → Rule
This keeps Chapter 3 focused on the organization of the compiler and Chapter 4 focused completely on Lexical Analysis, without unnecessary repetition.
Chapter 5: Syntax Analysis
5.1 Introduction to Syntax Analysis
Syntax Analysis is the second phase of a compiler.
It checks whether the tokens produced by the lexical analyzer are arranged according to the grammar rules of the programming language.
Example
Correct:
a = b + 10;
Incorrect:
a = + b 10;
Syntax Analysis → Checks the structure of the program.
Used in: Second phase of the compiler.
5.2 Syntax Analyzer
A Syntax Analyzer is the part of the compiler that performs syntax analysis.
It receives tokens from the lexical analyzer and checks their structure.
Simple Flow
Lexical Analyzer
       ↓
     Tokens
       ↓
Syntax Analyzer
       ↓
   Parse Tree
Syntax Analyzer → Checks whether tokens follow the grammar rules.
5.3 Grammar
A Grammar is a set of rules that defines the correct structure of a programming language.
Example
A simple grammar can define an expression as:
Expression → Number + Number
Therefore:
10 + 20
follows the rule.
Grammar → Rules that define the structure of a language.
5.4 Parse Tree
A Parse Tree is a tree-like structure that shows how a program follows the grammar rules.
Example
For:
10 + 20
A simple parse tree can be:
       Expression
        /   |   \
     Number + Number
       |          |
      10          20
Parse Tree → Shows the structure of a program according to grammar.
⭐ Chapter 5 – Quick Revision
Syntax Analysis:Checks the structure of the program.
Syntax Analyzer:Checks tokens according to grammar rules.
Grammar:Rules that define the structure of a language.
Parse Tree:Shows the structure of a program according to grammar.
⭐ Remember
Tokens → Syntax Analyzer → Parse Tree
Chapter 6: Parsing Techniques
6.1 Introduction to Parsing
Parsing is the process of analyzing tokens according to the grammar of a programming language.
The parser checks whether the tokens form a valid structure.
Simple Flow
Tokens
  ↓
Parser
  ↓
Grammar
  ↓
Parse Tree
Parsing → Analyzing tokens according to grammar rules.
6.2 Parsing Techniques
There are two main parsing techniques:
Top-Down Parsing 
Bottom-Up Parsing 
Top-Down Parsing
Starts from the start symbol of the grammar and works toward the input.
Start Symbol
     ↓
Grammar
     ↓
Input
Bottom-Up Parsing
Starts with the input and works toward the start symbol.
Input
  ↓
Grammar
  ↓
Start Symbol
6.3 Types of Parsers
Common types of parsers include:
Top-Down Parsers
Recursive Descent Parser 
Predictive Parser 
Bottom-Up Parsers
Shift-Reduce Parser 
LR Parser 
Parser → Checks whether the input follows the grammar.
⭐ Chapter 6 – Quick Revision
Parsing:Analyzing tokens according to grammar rules.
Main Parsing Techniques:
Top-Down Parsing
Bottom-Up Parsing
Top-Down:Start symbol → Input
Bottom-Up:Input → Start symbol
Chapter 7: Top-Down Parsing
7.1 Introduction to Top-Down Parsing
Top-Down Parsing starts with the start symbol of the grammar and tries to generate the input string.
It builds the parse tree from the root toward the leaves.
Simple Flow
Start Symbol
     ↓
  Grammar
     ↓
   Input
Top-Down Parsing → Starts from the start symbol and moves toward the input.
7.2 Basic Working of Top-Down Parsing
The parser starts with the start symbol and repeatedly applies grammar rules to match the input.
Example
Suppose:
S → aB
B → b
Input:
ab
The parser starts with:
S
↓
aB
↓
ab
The input is successfully matched.
Top-Down Parser → Builds the parse tree from top to bottom.
7.3 Recursive Descent Parsing
Recursive Descent Parsing is a top-down parsing technique that uses a set of recursive functions to process the grammar.
Usually, each grammar rule is represented by a function.
Example
Expression → Number + Number
The parser can use a function for Expression to process the rule.
Recursive Descent Parser → Uses recursive functions to parse the input.
7.4 Predictive Parsing
Predictive Parsing is a top-down parsing technique that selects the correct grammar rule by looking at the next input token.
It tries to choose the correct rule without backtracking.
Predictive Parser → Uses the next input token to choose a grammar rule.
⭐ Chapter 7 – Quick Revision
Top-Down Parsing:Starts from the start symbol and moves toward the input.
Recursive Descent Parsing:Uses recursive functions to parse the input.
Predictive Parsing:Uses the next input token to select the correct grammar rule.
⭐ Remember
Top-Down
Start Symbol
     ↓
Input
Chapter 8: Bottom-Up Parsing
8.1 Introduction to Bottom-Up Parsing
Bottom-Up Parsing starts with the input tokens and works toward the start symbol of the grammar.
It builds the parse tree from the leaves toward the root.
Simple Flow
Input
  ↓
Grammar
  ↓
Start Symbol
Bottom-Up Parsing → Starts with the input and moves toward the start symbol.
8.2 Basic Working of Bottom-Up Parsing
The parser starts with the input and gradually combines the tokens to form larger structures.
Example
Suppose:
S → aB
B → b
Input:
ab
The parser works toward the start symbol:
ab
↓
aB
↓
S
Bottom-Up Parser → Builds the parse tree from bottom to top.
8.3 Shift-Reduce Parsing
Shift-Reduce Parsing is a bottom-up parsing technique.
It uses two main actions:
Shift
Moves an input token onto the parser stack.
Reduce
Replaces a group of symbols with a grammar rule.
Simple Example
Input: a + b
The parser may:
Shift → a
Shift → +
Shift → b
Reduce → a + b
Shift → Move input to the stack.
Reduce → Replace symbols with a grammar rule.
⭐ Chapter 8 – Quick Revision
Bottom-Up Parsing:Starts with input and moves toward the start symbol.
Shift:Moves an input token to the stack.
Reduce:Replaces symbols with a grammar rule.
⭐ Remember
Top-Down    → Start Symbol → Input
Bottom-Up   → Input → Start Symbol
Chapter 9: Type Checking
9.1 Introduction to Type Checking
Type Checking is the process of checking whether operations and values are used with the correct data types.
It is mainly performed during semantic analysis.
Example
int age;
age = 20;
This is correct because age is an integer and 20 is an integer.
Type Checking → Checks whether data types are used correctly.
9.2 Type Errors
A Type Error occurs when incompatible data types are used together.
Example
int age;
age = "Ali";
age is an integer, but "Ali" is a string.
Therefore, this is a type error.
Type Error → Using an incorrect data type.
9.3 Type Compatibility
Type Compatibility means that two data types can be used together in an operation or assignment.
Example
int a = 10;
int b = 20;
int c = a + b;
The types are compatible.
Type Compatibility → Determines whether data types can be used together.
9.4 Type Conversion
Type Conversion means changing a value from one data type to another.
Example
int a = 10;
float b = a;
The integer value 10 is converted to a floating-point value.
There are two common types:
Implicit Conversion – Done automatically. 
Explicit Conversion – Done by the programmer. 
Type Conversion → Changes a value from one data type to another.
⭐ Chapter 9 – Quick Revision
Type Checking:Checks whether data types are used correctly.
Type Error:Incorrect use of data types.
Type Compatibility:Checks whether data types can be used together.
Type Conversion:Changes one data type into another.
⭐ Remember
Type Checking → Check
Type Error → Wrong Type
Compatibility → Can they work together?
Conversion → Change Type
Chapter 10: Semantic Analyzer
10.1 Introduction to Semantic Analysis
Semantic Analysis checks the meaning of the program.
A program may have correct syntax but still have an incorrect meaning.
Example
int age;
age = "Ali";
The structure may be correct, but the assignment is not meaningful because age is an integer.
Semantic Analysis → Checks the meaning of the program.
10.2 Role of Semantic Analyzer
A Semantic Analyzer performs semantic checks on the program.
It checks things such as:
Data types 
Variable declarations 
Type compatibility 
Use of variables 
Function usage 
It also uses information from the Symbol Table.
Semantic Analyzer → Checks whether the program makes sense according to language rules.
10.3 Semantic Errors
A Semantic Error occurs when the program has correct syntax but incorrect meaning.
Example
int age;
age = "Ali";
The statement may follow the basic syntax, but the data types are incompatible.
Therefore, it is a semantic error.
Semantic Error → A meaningful/logic-related violation of language rules detected during semantic analysis.
⭐ Chapter 10 – Quick Revision
Semantic Analysis:Checks the meaning of the program.
Semantic Analyzer:Performs semantic checks.
Semantic Error:An error caused by incorrect meaning or use of language rules.
Chapter 11: Object Code Generation
11.1 Introduction to Code Generation
Code Generation is the process of producing target code from the processed program.
It is one of the final stages of a compiler.
Code Generation → Produces target code.
11.2 Object Code
Object Code is the code produced by a compiler that can be used to create an executable program.
It is usually stored in an object file.
Example
Source Code
     ↓
 Compiler
     ↓
 Object Code
     ↓
 Object File
Object Code → Code produced by the compiler for further processing or execution.
11.3 Basic Object Code Generation
The compiler converts the processed program into instructions suitable for the target machine.
Example
a = b + c
The compiler generates machine/target instructions that perform:
Load b
Add c
Store a
The actual instructions depend on the target processor.
Object Code Generation → Converts the processed program into target instructions.
⭐ Chapter 11 – Quick Revision
Code Generation:Produces target code.
Object Code:Code produced by the compiler and stored in an object file.
Object Code Generation:Produces target instructions for the target machine.
Chapter 12: Code Optimization
12.1 Introduction to Code Optimization
Code Optimization is the process of improving code so that it uses less time or resources while producing the same result.
Code Optimization → Improves the efficiency of code.
12.2 Need for Optimization
Optimization is needed to:
Reduce execution time. 
Reduce memory usage. 
Remove unnecessary operations. 
Improve program performance. 
Example
Before optimization:
a = 10 + 20
After optimization:
a = 30
The compiler does not need to calculate 10 + 20 every time the program runs.
12.3 Basic Optimization Techniques
Some basic optimization techniques are:
1. Constant Folding
Calculates constant values during compilation.
a = 10 + 20
becomes:
a = 30
2. Dead Code Elimination
Removes code that is never used.
3. Common Subexpression Elimination
Avoids calculating the same expression more than once.
4. Strength Reduction
Replaces an expensive operation with a simpler one when possible.
Optimization → Removes unnecessary work and improves performance.
⭐ Chapter 12 – Quick Revision
Code Optimization:Improves the efficiency of code.
Need:To reduce execution time, memory usage, and unnecessary operations.
Constant Folding:Calculates constants during compilation.
Dead Code Elimination:Removes unused code.
Common Subexpression Elimination:Avoids repeated calculations.
Strength Reduction:Replaces an expensive operation with a simpler one.
Chapter 13: Detection and Recovery from Errors
13.1 Types of Compiler Errors
A compiler error is a problem in a program that prevents the compiler from correctly processing it.
Common types include:
1. Lexical Error
Caused by an invalid character or sequence.
Example:
int @age;
2. Syntax Error
Caused by incorrect program structure.
Example:
a = + b 10;
3. Semantic Error
Caused by incorrect meaning or use of language rules.
Example:
int age;
age = "Ali";
13.2 Error Detection
Error Detection is the process of finding errors in a program.
Different compiler phases detect different types of errors.
Error
Mainly Detected By
Lexical Error
Lexical Analyzer
Syntax Error
Syntax Analyzer
Semantic Error
Semantic Analyzer
Error Detection → Finds errors in the source program.
13.3 Error Recovery
Error Recovery is the process of handling an error and allowing the compiler to continue analyzing the rest of the program when possible.
Example
If the compiler finds an error in one statement, it can skip or correct the problematic part and continue checking later statements.
The purpose is to:
Continue compilation when possible. 
Find more errors. 
Give useful error messages to the programmer. 
Error Recovery → Handles errors and allows the compiler to continue when possible.
⭐ Chapter 13 – Quick Revision
Compiler Errors:
Lexical Error → Invalid character or sequence
Syntax Error → Incorrect structure
Semantic Error → Incorrect meaning/use
Error Detection:Finds errors in the program.
Error Recovery:Handles errors and allows compilation to continue when possible.
⭐ Remember
Lexical Error  → Lexical Analyzer
Syntax Error   → Syntax Analyzer
Semantic Error → Semantic Analyzer
`;