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
- `/` -> floating-point division
- `//` -> floor/integer division
- `%` -> modulo/remainder

## 2. Grammar (Current)

Each statement must end with `;`.

```text
<program>      ::= <statement>* EOF

<statement>    ::= <declaration> | <assignment> | <output>
<declaration>  ::= (Bilang|Gudua|Sarsarita|Pudno) IDENT dutokan-> <expr> ;
<assignment>   ::= IDENT dutokan-> <expr> ;
<output>       ::= Ibaga() ;
                | Ibaga(<expr>) ;
                | Ibaga(<expr>, <end_expr>) ;

<expr>         ::= <term> ((+|-) <term>)*
<term>         ::= <factor> ((*|/|//|%) <factor>)*
<factor>       ::= (<expr>) | IDENT | INT | FLOAT | STRING | true | false | Ikabil | Ikabil(<expr>)
```

## 3. Semantic Rules (Current)

- Variables must be declared before use.
- Variable redeclaration is not allowed.
- Assignment value must match declared variable type.
- `Gudua` may receive `Bilang` values.
- `Ikabil` returns `Sarsarita`.
- `Ikabil(prompt)` requires `prompt` to be `Sarsarita`.
- `Ibaga(...)` must use parentheses.
- `Ibaga(expr)` prints with a newline by default.
- `Ibaga(expr, end)` prints using `end` instead of default newline.
  - `end` must be `Sarsarita`.
  - escape sequences in strings are supported (e.g., `"\n"`, `"\t"`).
- `Ibaga()` prints a blank newline.
- `+` supports:
  - numeric + numeric
  - `Sarsarita` + `Sarsarita`
- `-` and `*` require numeric operands.
- `/` requires numeric operands and returns `Gudua` (floating-point division).
- `//` requires `Bilang` operands and returns `Bilang`.
- `%` requires `Bilang` operands and returns `Bilang`.
- Literal zero divisors are rejected by semantic analysis:
  - `a / 0`, `a / 0.0`
  - `a // 0`
  - `a % 0`

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

### 6.4 Simple Command (`elocalno run`)

Command:

```powershell
elocalno run test.elokano
```

If PowerShell does not find `elocalno`, add this project folder to `PATH` for the current terminal session:

```powershell
$env:PATH = "$PWD;$env:PATH"
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
Bilang quotient dutokan-> y // 2;
Bilang rem dutokan-> y % 2;
Ibaga("Nagan mo ay " + ngalan + " anak ni " + mom + " at " + dad + " kapatid ni " + sibling, "\n");
Ibaga("result:\t", "");
Ibaga(result);
Ibaga("quotient:\t", "");
Ibaga(quotient, "\t");
Ibaga(rem, "\n");
```

## 9. Common Semantic Errors

- `Variable 'x' is not declared`
  - Declare it first: `Bilang x dutokan-> 0;`
- `Variable 'x' already declared`
  - Remove duplicate declaration or rename variable.
- `Type mismatch in declaration/assignment`
  - Make expression type compatible with variable type.
- `Division by zero is not allowed`
  - Change the right-hand divisor from `0`/`0.0` to a non-zero value.



