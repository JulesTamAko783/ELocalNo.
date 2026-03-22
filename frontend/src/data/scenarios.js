/**
 * Elokano Test Scenarios — 110 scenarios for Lexer, Parser, and Semantic Analyzer.
 *
 * Each scenario: { id, title, code, expectedPhase, expectedOutcome }
 * expectedPhase: "valid" | "lexer" | "parser" | "semantic"
 */

const SCENARIOS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION A: VALID CODE (1–40)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 1, title: "Simple integer declaration with assignment",
    code: 'Bilang x dutokan-> 10;',
    expectedPhase: "valid", expectedOutcome: "Declares x as Bilang with value 10" },

  { id: 2, title: "Simple float declaration with assignment",
    code: 'Gudua pi dutokan-> 3.14;',
    expectedPhase: "valid", expectedOutcome: "Declares pi as Gudua with value 3.14" },

  { id: 3, title: "Simple string declaration with assignment",
    code: 'Sarsarita pangalan dutokan-> "Jules";',
    expectedPhase: "valid", expectedOutcome: "Declares pangalan as Sarsarita" },

  { id: 4, title: "Simple boolean declaration with assignment",
    code: 'Pudno flag dutokan-> true;',
    expectedPhase: "valid", expectedOutcome: "Declares flag as Pudno with value true" },

  { id: 5, title: "Declaration with default value (no initializer)",
    code: 'Bilang count;',
    expectedPhase: "valid", expectedOutcome: "Declares count with default value 0" },

  { id: 6, title: "Multiple variable declarations of the same type",
    code: 'Bilang x dutokan-> 10, y dutokan-> 20, z;',
    expectedPhase: "valid", expectedOutcome: "Multi-declaration: x=10, y=20, z=0" },

  { id: 7, title: "Variable reassignment",
    code: 'Bilang age dutokan-> 21;\nage dutokan-> 25;',
    expectedPhase: "valid", expectedOutcome: "Declares then reassigns age" },

  { id: 8, title: "Float variable receiving an integer value (implicit widening)",
    code: 'Gudua result dutokan-> 5;',
    expectedPhase: "valid", expectedOutcome: "Gudua accepts Bilang value (widening)" },

  { id: 9, title: "Arithmetic expression with addition and subtraction",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang sum dutokan-> a + b;\nBilang diff dutokan-> a - b;',
    expectedPhase: "valid", expectedOutcome: "Integer arithmetic: sum and difference" },

  { id: 10, title: "Arithmetic expression with multiplication",
    code: 'Bilang x dutokan-> 4;\nBilang y dutokan-> 7;\nBilang product dutokan-> x * y;',
    expectedPhase: "valid", expectedOutcome: "Integer multiplication" },

  { id: 11, title: "Float division always returns Gudua",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nGudua result dutokan-> a / b;',
    expectedPhase: "valid", expectedOutcome: "Division always returns Gudua" },

  { id: 12, title: "Floor division with integer operands",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang quotient dutokan-> a // b;',
    expectedPhase: "valid", expectedOutcome: "Floor division returns Bilang" },

  { id: 13, title: "Modulo operation with integer operands",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang remainder dutokan-> a % b;',
    expectedPhase: "valid", expectedOutcome: "Modulo returns Bilang" },

  { id: 14, title: "Complex nested arithmetic expression",
    code: 'Bilang x dutokan-> 5;\nBilang y dutokan-> 10;\nGudua result dutokan-> ((x + y) * 2) / 3;',
    expectedPhase: "valid", expectedOutcome: "Nested arithmetic with grouping" },

  { id: 15, title: "String concatenation",
    code: 'Sarsarita first dutokan-> "Hello";\nSarsarita second dutokan-> " World";\nSarsarita greeting dutokan-> first + second;',
    expectedPhase: "valid", expectedOutcome: "String + String = String" },

  { id: 16, title: "String concatenation with literal",
    code: 'Sarsarita name dutokan-> "Jules";\nSarsarita msg dutokan-> "Hello, " + name + "!";',
    expectedPhase: "valid", expectedOutcome: "Chained string concatenation" },

  { id: 17, title: "Comparison operators returning Pudno",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 5;\nPudno r1 dutokan-> a > b;\nPudno r2 dutokan-> a < b;\nPudno r3 dutokan-> a >= b;\nPudno r4 dutokan-> a <= b;\nPudno r5 dutokan-> a == b;\nPudno r6 dutokan-> a != b;',
    expectedPhase: "valid", expectedOutcome: "All comparison operators produce Pudno" },

  { id: 18, title: "Equality comparison between matching non-numeric types",
    code: 'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> "hello";\nPudno same dutokan-> a == b;',
    expectedPhase: "valid", expectedOutcome: "String == String is valid" },

  { id: 19, title: "Mixed numeric comparison (Bilang vs Gudua)",
    code: 'Bilang a dutokan-> 5;\nGudua b dutokan-> 5.5;\nPudno result dutokan-> a < b;',
    expectedPhase: "valid", expectedOutcome: "Bilang < Gudua is valid (both numeric)" },

  { id: 20, title: "Simple if statement",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("x is greater than 5");\n}',
    expectedPhase: "valid", expectedOutcome: "If statement with true condition" },

  { id: 21, title: "If-else statement",
    code: 'Bilang x dutokan-> 3;\nnu (x > 5) {\n    Ibaga("big");\n}\nsabali {\n    Ibaga("small");\n}',
    expectedPhase: "valid", expectedOutcome: "If-else with false condition" },

  { id: 22, title: "If / else-if / else chain",
    code: 'Bilang score dutokan-> 85;\nnu (score >= 90) {\n    Ibaga("Excellent");\n}\nsabali nu (score >= 80) {\n    Ibaga("Good");\n}\nsabali nu (score >= 70) {\n    Ibaga("Average");\n}\nsabali {\n    Ibaga("Needs Improvement");\n}',
    expectedPhase: "valid", expectedOutcome: "Full if/else-if/else chain" },

  { id: 23, title: "Nested if statements",
    code: 'Bilang x dutokan-> 10;\nBilang y dutokan-> 20;\nnu (x > 5) {\n    nu (y > 15) {\n        Ibaga("Both conditions met");\n    }\n}',
    expectedPhase: "valid", expectedOutcome: "Nested if blocks" },

  { id: 24, title: "Variable scoping - inner scope accesses outer variable",
    code: 'Bilang a dutokan-> 10;\nnu (a > 5) {\n    Ibaga(a);\n}',
    expectedPhase: "valid", expectedOutcome: "Inner scope reads outer variable" },

  { id: 25, title: "Variable scoping - inner scope declares local variable",
    code: 'Bilang a dutokan-> 10;\nnu (a > 5) {\n    Bilang b dutokan-> 20;\n    Ibaga(b);\n}',
    expectedPhase: "valid", expectedOutcome: "Local variable in if block" },

  { id: 26, title: "Output with no arguments (blank line)",
    code: 'Ibaga();',
    expectedPhase: "valid", expectedOutcome: "Prints blank newline" },

  { id: 27, title: "Output with expression",
    code: 'Ibaga("Hello World");',
    expectedPhase: "valid", expectedOutcome: "Prints string with newline" },

  { id: 28, title: "Output with custom end string",
    code: 'Ibaga("Hello", "");',
    expectedPhase: "valid", expectedOutcome: "Prints with no newline" },

  { id: 29, title: "Output with tab ending",
    code: 'Ibaga("Value", "\\t");',
    expectedPhase: "valid", expectedOutcome: "Prints with tab ending" },

  { id: 30, title: "Output with numeric expression",
    code: 'Bilang x dutokan-> 42;\nIbaga(x);',
    expectedPhase: "valid", expectedOutcome: "Prints integer variable" },

  { id: 31, title: "Output with arithmetic expression",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 20;\nIbaga(a + b);',
    expectedPhase: "valid", expectedOutcome: "Prints arithmetic result" },

  { id: 32, title: "Input without prompt",
    code: 'Sarsarita name dutokan-> Ikabil;',
    expectedPhase: "valid", expectedOutcome: "Input with no prompt" },

  { id: 33, title: "Input with prompt string",
    code: 'Sarsarita name dutokan-> Ikabil("Enter your name: ");',
    expectedPhase: "valid", expectedOutcome: "Input with string prompt" },

  { id: 34, title: "Boolean literal false",
    code: 'Pudno isActive dutokan-> false;',
    expectedPhase: "valid", expectedOutcome: "Boolean false declaration" },

  { id: 35, title: "String with escape sequences",
    code: 'Sarsarita msg dutokan-> "Line1\\nLine2\\tTabbed";',
    expectedPhase: "valid", expectedOutcome: "String with escape sequences" },

  { id: 36, title: "Multiple declarations of different types",
    code: 'Bilang age dutokan-> 25;\nGudua gpa dutokan-> 3.85;\nSarsarita name dutokan-> "Jules";\nPudno enrolled dutokan-> true;',
    expectedPhase: "valid", expectedOutcome: "All four types declared" },

  { id: 37, title: "Reassignment after if block",
    code: 'Bilang x dutokan-> 1;\nnu (x == 1) {\n    Ibaga("one");\n}\nx dutokan-> 2;',
    expectedPhase: "valid", expectedOutcome: "Reassignment after control flow" },

  { id: 38, title: "Multiple if statements in sequence",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 20;\nnu (a > 5) {\n    Ibaga("a is big");\n}\nnu (b > 15) {\n    Ibaga("b is big");\n}',
    expectedPhase: "valid", expectedOutcome: "Two independent if statements" },

  { id: 39, title: "Equality check on boolean values",
    code: 'Pudno a dutokan-> true;\nPudno b dutokan-> false;\nPudno same dutokan-> a == b;',
    expectedPhase: "valid", expectedOutcome: "Boolean == Boolean is valid" },

  { id: 40, title: "Complex program with all features",
    code: 'Sarsarita name dutokan-> Ikabil("Nagan mu: ");\nBilang x dutokan-> 10, y dutokan-> 5, z;\nz dutokan-> 69;\nGudua result dutokan-> ((x + y) * 2) / 3;\nBilang quotient dutokan-> y // 2;\nBilang rem dutokan-> y % 2;\nIbaga("Nagan mo ay " + name);\nIbaga("result:\\t", "");\nIbaga(result);\nnu (x > y) {\n    Ibaga("x is greater than y");\n}\nsabali nu (x == y) {\n    Ibaga("x is equal to y");\n}\nsabali {\n    Ibaga("x is less than y");\n}',
    expectedPhase: "valid", expectedOutcome: "Full program with all features" },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION B: SYNTAX ERRORS (41–70)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 41, title: "Missing semicolon after declaration",
    code: 'Bilang x dutokan-> 10',
    expectedPhase: "parser", expectedOutcome: "Expected SEMI" },

  { id: 42, title: "Missing semicolon after assignment",
    code: 'Bilang x dutokan-> 10;\nx dutokan-> 20',
    expectedPhase: "parser", expectedOutcome: "Expected SEMI" },

  { id: 43, title: "Missing semicolon after output statement",
    code: 'Ibaga("Hello")',
    expectedPhase: "parser", expectedOutcome: "Expected SEMI" },

  { id: 44, title: "Missing assignment operator in declaration",
    code: 'Bilang x 10;',
    expectedPhase: "parser", expectedOutcome: "Expected SEMI or ASSIGN, got INT_LIT" },

  { id: 45, title: "Misspelled assignment operator",
    code: 'Bilang x dutokan> 10;',
    expectedPhase: "parser", expectedOutcome: "dutokan lexed as IDENT, > as GT" },

  { id: 46, title: "Missing opening parenthesis in if condition",
    code: 'Bilang x dutokan-> 10;\nnu x > 5 {\n    Ibaga("hello");\n}',
    expectedPhase: "parser", expectedOutcome: "Expected LPAREN after nu" },

  { id: 47, title: "Missing closing parenthesis in if condition",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5 {\n    Ibaga("hello");\n}',
    expectedPhase: "parser", expectedOutcome: "Expected RPAREN" },

  { id: 48, title: "Missing opening brace for if body",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5)\n    Ibaga("hello");',
    expectedPhase: "parser", expectedOutcome: "Expected LBRACE" },

  { id: 49, title: "Missing closing brace for if body",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("hello");',
    expectedPhase: "parser", expectedOutcome: "Expected RBRACE" },

  { id: 50, title: "Missing opening parenthesis in Ibaga",
    code: 'Ibaga "Hello";',
    expectedPhase: "parser", expectedOutcome: "Expected LPAREN after OUTPUT" },

  { id: 51, title: "Missing closing parenthesis in Ibaga",
    code: 'Ibaga("Hello";',
    expectedPhase: "parser", expectedOutcome: "Expected RPAREN" },

  { id: 52, title: "Unterminated string literal",
    code: 'Sarsarita msg dutokan-> "Hello World;',
    expectedPhase: "lexer", expectedOutcome: "Unterminated string" },

  { id: 53, title: "Invalid character in source",
    code: 'Bilang x dutokan-> 10 @ 5;',
    expectedPhase: "lexer", expectedOutcome: "Unexpected character @" },

  { id: 54, title: "Using = instead of == for comparison",
    code: 'Bilang x dutokan-> 10;\nnu (x = 5) {\n    Ibaga("five");\n}',
    expectedPhase: "lexer", expectedOutcome: "Unexpected character = (no single = token)" },

  { id: 55, title: "Missing variable name in declaration",
    code: 'Bilang dutokan-> 10;',
    expectedPhase: "parser", expectedOutcome: "Expected IDENT, got ASSIGN" },

  { id: 56, title: "Extra comma with no following declaration",
    code: 'Bilang x dutokan-> 10,;',
    expectedPhase: "parser", expectedOutcome: "Expected IDENT after comma" },

  { id: 57, title: "Ikabil used as standalone statement",
    code: 'Ikabil("Enter: ");',
    expectedPhase: "parser", expectedOutcome: "Invalid statement start" },

  { id: 58, title: "Missing expression in assignment",
    code: 'Bilang x dutokan-> 10;\nx dutokan-> ;',
    expectedPhase: "parser", expectedOutcome: "Invalid expression token ;" },

  { id: 59, title: "Double semicolons (actually valid)",
    code: 'Bilang x dutokan-> 10;;',
    expectedPhase: "valid", expectedOutcome: "Parser skips extra semicolons" },

  { id: 60, title: "Operator with missing right operand",
    code: 'Bilang x dutokan-> 10;\nBilang y dutokan-> x + ;',
    expectedPhase: "parser", expectedOutcome: "Invalid expression token ;" },

  { id: 61, title: "sabali without preceding nu",
    code: 'sabali {\n    Ibaga("hello");\n}',
    expectedPhase: "parser", expectedOutcome: "Invalid statement start sabali" },

  { id: 62, title: "Two sabali blocks (double else)",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("big");\n}\nsabali {\n    Ibaga("small");\n}\nsabali {\n    Ibaga("other");\n}',
    expectedPhase: "parser", expectedOutcome: "Invalid statement start sabali" },

  { id: 63, title: "Missing condition in if statement",
    code: 'nu () {\n    Ibaga("hello");\n}',
    expectedPhase: "parser", expectedOutcome: "Invalid expression token )" },

  { id: 64, title: "Nested unclosed braces",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    nu (x > 8) {\n        Ibaga("very big");\n    }',
    expectedPhase: "parser", expectedOutcome: "Expected RBRACE" },

  { id: 65, title: "Using a keyword as a variable name (nu)",
    code: 'Bilang nu dutokan-> 5;',
    expectedPhase: "parser", expectedOutcome: "Expected IDENT, got IF" },

  { id: 66, title: "Using a type keyword as a variable name",
    code: 'Bilang Bilang dutokan-> 5;',
    expectedPhase: "parser", expectedOutcome: "Expected IDENT, got TYPE_INT" },

  { id: 67, title: "Missing expression inside Ibaga with comma",
    code: 'Ibaga(, "\\n");',
    expectedPhase: "parser", expectedOutcome: "Invalid expression token ," },

  { id: 68, title: "Assignment without prior declaration (syntax valid, semantic error)",
    code: 'y dutokan-> 10;',
    expectedPhase: "semantic", expectedOutcome: "Variable y is not declared" },

  { id: 69, title: "Stray closing brace",
    code: 'Bilang x dutokan-> 10;\n}',
    expectedPhase: "parser", expectedOutcome: "Expected EOF, got RBRACE" },

  { id: 70, title: "Number starting a statement",
    code: '10 dutokan-> x;',
    expectedPhase: "parser", expectedOutcome: "Invalid statement start 10" },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION C: SEMANTIC ERRORS (71–110)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 71, title: "Type mismatch - assigning string to integer",
    code: 'Bilang x dutokan-> "hello";',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Bilang, got Sarsarita" },

  { id: 72, title: "Type mismatch - assigning integer to string",
    code: 'Sarsarita name dutokan-> 42;',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Sarsarita, got Bilang" },

  { id: 73, title: "Using an undeclared variable",
    code: 'y dutokan-> 10;',
    expectedPhase: "semantic", expectedOutcome: "Variable y is not declared" },

  { id: 74, title: "Using an undeclared variable in an expression",
    code: 'Bilang x dutokan-> y + 5;',
    expectedPhase: "semantic", expectedOutcome: "Variable y is not declared" },

  { id: 75, title: "Redeclaring a variable in the same scope",
    code: 'Bilang x dutokan-> 10;\nBilang x dutokan-> 20;',
    expectedPhase: "semantic", expectedOutcome: "Variable x already declared" },

  { id: 76, title: "Type mismatch in reassignment",
    code: 'Bilang x dutokan-> 10;\nx dutokan-> "hello";',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Bilang, got Sarsarita" },

  { id: 77, title: "Assigning boolean to integer",
    code: 'Bilang x dutokan-> true;',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Bilang, got Pudno" },

  { id: 78, title: "Assigning float to integer (narrowing not allowed)",
    code: 'Bilang x dutokan-> 3.14;',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Bilang, got Gudua" },

  { id: 79, title: "Assigning integer to boolean",
    code: 'Pudno flag dutokan-> 1;',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Pudno, got Bilang" },

  { id: 80, title: "Assigning string to boolean",
    code: 'Pudno flag dutokan-> "true";',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Pudno, got Sarsarita" },

  { id: 81, title: "Adding string and integer",
    code: 'Sarsarita name dutokan-> "Jules";\nBilang age dutokan-> 21;\nSarsarita result dutokan-> name + age;',
    expectedPhase: "semantic", expectedOutcome: "Operator + requires matching types" },

  { id: 82, title: "Subtracting strings",
    code: 'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> "world";\nSarsarita c dutokan-> a - b;',
    expectedPhase: "semantic", expectedOutcome: "Operator - requires numeric operands" },

  { id: 83, title: "Multiplying strings",
    code: 'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> a * a;',
    expectedPhase: "semantic", expectedOutcome: "Operator * requires numeric operands" },

  { id: 84, title: "Dividing strings",
    code: 'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> a / a;',
    expectedPhase: "semantic", expectedOutcome: "Operator / requires numeric operands" },

  { id: 85, title: "Floor division with float operands",
    code: 'Gudua a dutokan-> 10.0;\nGudua b dutokan-> 3.0;\nGudua c dutokan-> a // b;',
    expectedPhase: "semantic", expectedOutcome: "Operator // requires Bilang operands" },

  { id: 86, title: "Modulo with float operands",
    code: 'Gudua a dutokan-> 10.0;\nGudua b dutokan-> 3.0;\nGudua c dutokan-> a % b;',
    expectedPhase: "semantic", expectedOutcome: "Operator % requires Bilang operands" },

  { id: 87, title: "Floor division with mixed types",
    code: 'Bilang a dutokan-> 10;\nGudua b dutokan-> 3.0;\nBilang c dutokan-> a // b;',
    expectedPhase: "semantic", expectedOutcome: "Operator // requires Bilang operands" },

  { id: 88, title: "Division by zero (literal)",
    code: 'Bilang a dutokan-> 10;\nGudua result dutokan-> a / 0;',
    expectedPhase: "semantic", expectedOutcome: "Division by zero" },

  { id: 89, title: "Floor division by zero (literal)",
    code: 'Bilang a dutokan-> 10;\nBilang result dutokan-> a // 0;',
    expectedPhase: "semantic", expectedOutcome: "Operator // with zero divisor" },

  { id: 90, title: "Modulo by zero (literal)",
    code: 'Bilang a dutokan-> 10;\nBilang result dutokan-> a % 0;',
    expectedPhase: "semantic", expectedOutcome: "Operator % with zero divisor" },

  { id: 91, title: "Division by zero with float literal",
    code: 'Gudua a dutokan-> 10.0;\nGudua result dutokan-> a / 0.0;',
    expectedPhase: "semantic", expectedOutcome: "Division by zero" },

  { id: 92, title: "Non-boolean if condition (integer)",
    code: 'Bilang x dutokan-> 10;\nnu (x) {\n    Ibaga("hello");\n}',
    expectedPhase: "semantic", expectedOutcome: "If condition must be Pudno, got Bilang" },

  { id: 93, title: "Non-boolean if condition (string)",
    code: 'Sarsarita s dutokan-> "hello";\nnu (s) {\n    Ibaga("world");\n}',
    expectedPhase: "semantic", expectedOutcome: "If condition must be Pudno, got Sarsarita" },

  { id: 94, title: "Non-boolean if condition (arithmetic expression)",
    code: 'Bilang x dutokan-> 10;\nBilang y dutokan-> 5;\nnu (x + y) {\n    Ibaga("fifteen");\n}',
    expectedPhase: "semantic", expectedOutcome: "If condition must be Pudno, got Bilang" },

  { id: 95, title: "Non-boolean else-if condition",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("big");\n}\nsabali nu (x) {\n    Ibaga("other");\n}',
    expectedPhase: "semantic", expectedOutcome: "Else-if condition must be Pudno, got Bilang" },

  { id: 96, title: "Non-string end argument in Ibaga (integer)",
    code: 'Ibaga("Hello", 42);',
    expectedPhase: "semantic", expectedOutcome: "Ibaga end argument must be Sarsarita" },

  { id: 97, title: "Non-string end argument in Ibaga (boolean)",
    code: 'Ibaga("Hello", true);',
    expectedPhase: "semantic", expectedOutcome: "Ibaga end argument must be Sarsarita" },

  { id: 98, title: "Non-string prompt in Ikabil",
    code: 'Sarsarita input dutokan-> Ikabil(42);',
    expectedPhase: "semantic", expectedOutcome: "Ikabil prompt must be Sarsarita" },

  { id: 99, title: "Comparing incompatible types with ==",
    code: 'Bilang x dutokan-> 10;\nSarsarita s dutokan-> "10";\nPudno result dutokan-> x == s;',
    expectedPhase: "semantic", expectedOutcome: "Operator == requires matching types" },

  { id: 100, title: "Comparing incompatible types with !=",
    code: 'Pudno flag dutokan-> true;\nBilang x dutokan-> 1;\nPudno result dutokan-> flag != x;',
    expectedPhase: "semantic", expectedOutcome: "Operator != requires matching types" },

  { id: 101, title: "Relational comparison on strings",
    code: 'Sarsarita a dutokan-> "apple";\nSarsarita b dutokan-> "banana";\nPudno result dutokan-> a > b;',
    expectedPhase: "semantic", expectedOutcome: "Operator > requires numeric operands" },

  { id: 102, title: "Relational comparison on booleans",
    code: 'Pudno a dutokan-> true;\nPudno b dutokan-> false;\nPudno result dutokan-> a >= b;',
    expectedPhase: "semantic", expectedOutcome: "Operator >= requires numeric operands" },

  { id: 103, title: "Storing division result in integer (type mismatch)",
    code: 'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang result dutokan-> a / b;',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Bilang, got Gudua" },

  { id: 104, title: "Accessing variable from a different (sibling) scope",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Bilang inner dutokan-> 20;\n}\nIbaga(inner);',
    expectedPhase: "semantic", expectedOutcome: "Variable inner is not declared" },

  { id: 105, title: "Accessing variable from an exited inner scope",
    code: 'Bilang a dutokan-> 10;\nnu (a > 5) {\n    Bilang b dutokan-> 20;\n}\nb dutokan-> 30;',
    expectedPhase: "semantic", expectedOutcome: "Variable b is not declared" },

  { id: 106, title: "Redeclaring variable in same scope after if block",
    code: 'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga(x);\n}\nBilang x dutokan-> 20;',
    expectedPhase: "semantic", expectedOutcome: "Variable x already declared" },

  { id: 107, title: "Undeclared variable in output",
    code: 'Ibaga(undeclaredVar);',
    expectedPhase: "semantic", expectedOutcome: "Variable undeclaredVar is not declared" },

  { id: 108, title: "Undeclared variable in comparison",
    code: 'Bilang x dutokan-> 10;\nnu (x > unknownVar) {\n    Ibaga("hello");\n}',
    expectedPhase: "semantic", expectedOutcome: "Variable unknownVar is not declared" },

  { id: 109, title: "Adding boolean values",
    code: 'Pudno a dutokan-> true;\nPudno b dutokan-> false;\nPudno c dutokan-> a + b;',
    expectedPhase: "semantic", expectedOutcome: "Operator + requires numeric or Sarsarita" },

  { id: 110, title: "Assigning Gudua to Sarsarita",
    code: 'Gudua x dutokan-> 3.14;\nSarsarita s dutokan-> x;',
    expectedPhase: "semantic", expectedOutcome: "Type mismatch: expected Sarsarita, got Gudua" },
];

export default SCENARIOS;
