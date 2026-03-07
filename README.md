# Elokano Language Prototype

Small compiler pipeline for a custom `.elokano` language:
- lexical analysis (tokenization)
- syntax analysis (parsing)
- semantic analysis (type and symbol checks)
- target code generation to C++
- one-command run flow (`coderun`)

## 1. Language Reference

### 1.1 Keywords

- `Bilang` -> integer type
- `Gudua` -> float type
- `Sarsarita` -> string type
- `Pudno` -> boolean type
- `Ibaga` -> output
- `Ikabil` -> input
- `true`, `false` -> boolean literals

### 1.2 Operators and Delimiters

- `dutokan->` -> assignment
- `;` -> statement delimiter
- `(` `)` -> grouping / enclosing delimiters
- `+` -> addition
- `-` -> subtraction
- `*` -> multiplication
- `/` -> division

## 2. Grammar (Current)

Each statement must end with `;`.

```text
<program>      ::= <statement>* EOF

<statement>    ::= <declaration> | <assignment> | <output>
<declaration>  ::= (Bilang|Gudua|Sarsarita|Pudno) IDENT dutokan-> <expr> ;
<assignment>   ::= IDENT dutokan-> <expr> ;
<output>       ::= Ibaga <expr> ;

<expr>         ::= <term> ((+|-) <term>)*
<term>         ::= <factor> ((*|/) <factor>)*
<factor>       ::= (<expr>) | IDENT | INT | FLOAT | STRING | true | false | Ikabil | Ikabil(<expr>)
```

## 3. Semantic Rules (Current)

- Variables must be declared before use.
- Variable redeclaration is not allowed.
- Assignment value must match declared variable type.
- `Gudua` may receive `Bilang` values.
- `Ikabil` returns `Sarsarita`.
- `Ikabil(prompt)` requires `prompt` to be `Sarsarita`.
- `+` supports:
  - numeric + numeric
  - `Sarsarita` + `Sarsarita`
- `-`, `*`, `/` require numeric operands.

## 4. Project Files

- `main.py`
  - Lexer, parser, and semantic analyzer.
  - Runs an internal sample program.
- `elokano_codegen.py`
  - Compiles `.elokano` source into C++ target code.
- `coderun.py`
  - Recommended runner: generate C++, compile, then execute.
  - Looks for `g++`, `clang++`, or `cl`.
- `coderun.ps1`
  - PowerShell wrapper for `coderun.py`.
- `test.elokano`
  - Example source file.
- `generated_target.cpp`
  - Auto-generated C++ output (overwritten on each run).
- `generated_target.exe`
  - Compiled executable output (overwritten on each run).

## 5. Requirements

- Python 3.x
- C++ compiler (`g++` or `clang++` or `cl`)

## 6. How To Run

### 6.1 Validate Lexer + Parser + Semantic Analyzer

```powershell
python main.py
```

### 6.2 Generate C++ Code Only

```powershell
python elokano_codegen.py test.elokano --out generated_target.cpp
```

### 6.3 Run with Coderun (Recommended)

```powershell
python coderun.py test.elokano --out generated_target.cpp --exe generated_target.exe
```

PowerShell wrapper:

```powershell
.\coderun.ps1 test.elokano
```

## 7. Input (`Ikabil`) Usage

Interactive:

```powershell
python coderun.py test.elokano
```

Piped multi-line input example (for multiple `Ikabil(...)` calls):

```powershell
@"
Jules
Maria
Pedro
Ana
"@ | python coderun.py test.elokano
```

## 8. Example Program

```text
Sarsarita ngalan dutokan-> Ikabil("Nagan mu: ");
Sarsarita mom dutokan-> Ikabil("Nagan ni ina mu: ");
Sarsarita dad dutokan-> Ikabil("Nagan ni ama mu: ");
Sarsarita sibling dutokan-> Ikabil("Nagan ni Ate o Kuya mu: ");

Bilang x dutokan-> 10;
Bilang y dutokan-> 5;
Gudua result dutokan-> ((x + y) * 2) / 3;
Ibaga "Nagan mo ay " + ngalan + " anak ni " + mom + " at " + dad + " kapatid ni " + sibling;
Ibaga result;
```

## 9. Common Semantic Errors

- `Variable 'x' is not declared`
  - Declare it first: `Bilang x dutokan-> 0;`
- `Variable 'x' already declared`
  - Remove duplicate declaration or rename variable.
- `Type mismatch in declaration/assignment`
  - Make expression type compatible with variable type.



