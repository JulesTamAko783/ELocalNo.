"""
Elokano Test Scenario Runner
Runs all 110 scenarios, generates an HTML report and a PDF.
"""

import sys
import os
import html as html_module
from datetime import datetime

# Import the compiler components
from main import Lexer, Parser, SemanticAnalyzer, LexerError, ParserError, SemanticError

# ── Scenario definitions ──────────────────────────────────────────────────────
# Each scenario: (id, title, code, expected_phase, expected_outcome)
# expected_phase: "valid", "lexer", "parser", "semantic"
# expected_outcome: short description of what should happen

SCENARIOS = [
    # ══════════════════════════════════════════════════════════════════════════
    # SECTION A: VALID CODE (Scenarios 1–40)
    # ══════════════════════════════════════════════════════════════════════════
    (1, "Simple integer declaration with assignment",
     'Bilang x dutokan-> 10;',
     "valid", "Declares x as Bilang with value 10"),

    (2, "Simple float declaration with assignment",
     'Gudua pi dutokan-> 3.14;',
     "valid", "Declares pi as Gudua with value 3.14"),

    (3, "Simple string declaration with assignment",
     'Sarsarita pangalan dutokan-> "Jules";',
     "valid", "Declares pangalan as Sarsarita"),

    (4, "Simple boolean declaration with assignment",
     'Pudno flag dutokan-> true;',
     "valid", "Declares flag as Pudno with value true"),

    (5, "Declaration with default value (no initializer)",
     'Bilang count;',
     "valid", "Declares count with default value 0"),

    (6, "Multiple variable declarations of the same type",
     'Bilang x dutokan-> 10, y dutokan-> 20, z;',
     "valid", "Multi-declaration: x=10, y=20, z=0"),

    (7, "Variable reassignment",
     'Bilang age dutokan-> 21;\nage dutokan-> 25;',
     "valid", "Declares then reassigns age"),

    (8, "Float variable receiving an integer value (implicit widening)",
     'Gudua result dutokan-> 5;',
     "valid", "Gudua accepts Bilang value (widening)"),

    (9, "Arithmetic expression with addition and subtraction",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang sum dutokan-> a + b;\nBilang diff dutokan-> a - b;',
     "valid", "Integer arithmetic: sum and difference"),

    (10, "Arithmetic expression with multiplication",
     'Bilang x dutokan-> 4;\nBilang y dutokan-> 7;\nBilang product dutokan-> x * y;',
     "valid", "Integer multiplication"),

    (11, "Float division always returns Gudua",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nGudua result dutokan-> a / b;',
     "valid", "Division always returns Gudua"),

    (12, "Floor division with integer operands",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang quotient dutokan-> a // b;',
     "valid", "Floor division returns Bilang"),

    (13, "Modulo operation with integer operands",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang remainder dutokan-> a % b;',
     "valid", "Modulo returns Bilang"),

    (14, "Complex nested arithmetic expression",
     'Bilang x dutokan-> 5;\nBilang y dutokan-> 10;\nGudua result dutokan-> ((x + y) * 2) / 3;',
     "valid", "Nested arithmetic with grouping"),

    (15, "String concatenation",
     'Sarsarita first dutokan-> "Hello";\nSarsarita second dutokan-> " World";\nSarsarita greeting dutokan-> first + second;',
     "valid", "String + String = String"),

    (16, "String concatenation with literal",
     'Sarsarita name dutokan-> "Jules";\nSarsarita msg dutokan-> "Hello, " + name + "!";',
     "valid", "Chained string concatenation"),

    (17, "Comparison operators returning Pudno",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 5;\nPudno r1 dutokan-> a > b;\nPudno r2 dutokan-> a < b;\nPudno r3 dutokan-> a >= b;\nPudno r4 dutokan-> a <= b;\nPudno r5 dutokan-> a == b;\nPudno r6 dutokan-> a != b;',
     "valid", "All comparison operators produce Pudno"),

    (18, "Equality comparison between matching non-numeric types",
     'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> "hello";\nPudno same dutokan-> a == b;',
     "valid", "String == String is valid"),

    (19, "Mixed numeric comparison (Bilang vs Gudua)",
     'Bilang a dutokan-> 5;\nGudua b dutokan-> 5.5;\nPudno result dutokan-> a < b;',
     "valid", "Bilang < Gudua is valid (both numeric)"),

    (20, "Simple if statement",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("x is greater than 5");\n}',
     "valid", "If statement with true condition"),

    (21, "If-else statement",
     'Bilang x dutokan-> 3;\nnu (x > 5) {\n    Ibaga("big");\n}\nsabali {\n    Ibaga("small");\n}',
     "valid", "If-else with false condition"),

    (22, "If / else-if / else chain",
     'Bilang score dutokan-> 85;\nnu (score >= 90) {\n    Ibaga("Excellent");\n}\nsabali nu (score >= 80) {\n    Ibaga("Good");\n}\nsabali nu (score >= 70) {\n    Ibaga("Average");\n}\nsabali {\n    Ibaga("Needs Improvement");\n}',
     "valid", "Full if/else-if/else chain"),

    (23, "Nested if statements",
     'Bilang x dutokan-> 10;\nBilang y dutokan-> 20;\nnu (x > 5) {\n    nu (y > 15) {\n        Ibaga("Both conditions met");\n    }\n}',
     "valid", "Nested if blocks"),

    (24, "Variable scoping - inner scope accesses outer variable",
     'Bilang a dutokan-> 10;\nnu (a > 5) {\n    Ibaga(a);\n}',
     "valid", "Inner scope reads outer variable"),

    (25, "Variable scoping - inner scope declares local variable",
     'Bilang a dutokan-> 10;\nnu (a > 5) {\n    Bilang b dutokan-> 20;\n    Ibaga(b);\n}',
     "valid", "Local variable in if block"),

    (26, "Output with no arguments (blank line)",
     'Ibaga();',
     "valid", "Prints blank newline"),

    (27, "Output with expression",
     'Ibaga("Hello World");',
     "valid", "Prints string with newline"),

    (28, "Output with custom end string",
     'Ibaga("Hello", "");',
     "valid", "Prints with no newline"),

    (29, "Output with tab ending",
     'Ibaga("Value", "\\t");',
     "valid", "Prints with tab ending"),

    (30, "Output with numeric expression",
     'Bilang x dutokan-> 42;\nIbaga(x);',
     "valid", "Prints integer variable"),

    (31, "Output with arithmetic expression",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 20;\nIbaga(a + b);',
     "valid", "Prints arithmetic result"),

    (32, "Input without prompt",
     'Sarsarita name dutokan-> Ikabil;',
     "valid", "Input with no prompt"),

    (33, "Input with prompt string",
     'Sarsarita name dutokan-> Ikabil("Enter your name: ");',
     "valid", "Input with string prompt"),

    (34, "Boolean literal false",
     'Pudno isActive dutokan-> false;',
     "valid", "Boolean false declaration"),

    (35, "String with escape sequences",
     'Sarsarita msg dutokan-> "Line1\\nLine2\\tTabbed";',
     "valid", "String with escape sequences"),

    (36, "Multiple declarations of different types",
     'Bilang age dutokan-> 25;\nGudua gpa dutokan-> 3.85;\nSarsarita name dutokan-> "Jules";\nPudno enrolled dutokan-> true;',
     "valid", "All four types declared"),

    (37, "Reassignment after if block",
     'Bilang x dutokan-> 1;\nnu (x == 1) {\n    Ibaga("one");\n}\nx dutokan-> 2;',
     "valid", "Reassignment after control flow"),

    (38, "Multiple if statements in sequence",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 20;\nnu (a > 5) {\n    Ibaga("a is big");\n}\nnu (b > 15) {\n    Ibaga("b is big");\n}',
     "valid", "Two independent if statements"),

    (39, "Equality check on boolean values",
     'Pudno a dutokan-> true;\nPudno b dutokan-> false;\nPudno same dutokan-> a == b;',
     "valid", "Boolean == Boolean is valid"),

    (40, "Complex program with all features",
     'Sarsarita name dutokan-> Ikabil("Nagan mu: ");\nBilang x dutokan-> 10, y dutokan-> 5, z;\nz dutokan-> 69;\nGudua result dutokan-> ((x + y) * 2) / 3;\nBilang quotient dutokan-> y // 2;\nBilang rem dutokan-> y % 2;\nIbaga("Nagan mo ay " + name);\nIbaga("result:\\t", "");\nIbaga(result);\nnu (x > y) {\n    Ibaga("x is greater than y");\n}\nsabali nu (x == y) {\n    Ibaga("x is equal to y");\n}\nsabali {\n    Ibaga("x is less than y");\n}',
     "valid", "Full program with all features"),

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION B: SYNTAX ERRORS (Scenarios 41–70)
    # ══════════════════════════════════════════════════════════════════════════
    (41, "Missing semicolon after declaration",
     'Bilang x dutokan-> 10',
     "parser", "Expected SEMI"),

    (42, "Missing semicolon after assignment",
     'Bilang x dutokan-> 10;\nx dutokan-> 20',
     "parser", "Expected SEMI"),

    (43, "Missing semicolon after output statement",
     'Ibaga("Hello")',
     "parser", "Expected SEMI"),

    (44, "Missing assignment operator in declaration",
     'Bilang x 10;',
     "parser", "Expected SEMI or ASSIGN, got INT_LIT"),

    (45, "Misspelled assignment operator",
     'Bilang x dutokan> 10;',
     "parser", "dutokan lexed as IDENT, > as GT"),

    (46, "Missing opening parenthesis in if condition",
     'Bilang x dutokan-> 10;\nnu x > 5 {\n    Ibaga("hello");\n}',
     "parser", "Expected LPAREN after nu"),

    (47, "Missing closing parenthesis in if condition",
     'Bilang x dutokan-> 10;\nnu (x > 5 {\n    Ibaga("hello");\n}',
     "parser", "Expected RPAREN"),

    (48, "Missing opening brace for if body",
     'Bilang x dutokan-> 10;\nnu (x > 5)\n    Ibaga("hello");',
     "parser", "Expected LBRACE"),

    (49, "Missing closing brace for if body",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("hello");',
     "parser", "Expected RBRACE"),

    (50, "Missing opening parenthesis in Ibaga",
     'Ibaga "Hello";',
     "parser", "Expected LPAREN after OUTPUT"),

    (51, "Missing closing parenthesis in Ibaga",
     'Ibaga("Hello";',
     "parser", "Expected RPAREN"),

    (52, "Unterminated string literal",
     'Sarsarita msg dutokan-> "Hello World;',
     "lexer", "Unterminated string"),

    (53, "Invalid character in source",
     'Bilang x dutokan-> 10 @ 5;',
     "lexer", "Unexpected character @"),

    (54, "Using = instead of == for comparison",
     'Bilang x dutokan-> 10;\nnu (x = 5) {\n    Ibaga("five");\n}',
     "lexer", "Unexpected character = (no single = token exists)"),

    (55, "Missing variable name in declaration",
     'Bilang dutokan-> 10;',
     "parser", "Expected IDENT, got ASSIGN"),

    (56, "Extra comma with no following declaration",
     'Bilang x dutokan-> 10,;',
     "parser", "Expected IDENT after comma"),

    (57, "Ikabil used as standalone statement",
     'Ikabil("Enter: ");',
     "parser", "Invalid statement start"),

    (58, "Missing expression in assignment",
     'Bilang x dutokan-> 10;\nx dutokan-> ;',
     "parser", "Invalid expression token ;"),

    (59, "Double semicolons (actually valid)",
     'Bilang x dutokan-> 10;;',
     "valid", "Parser skips extra semicolons"),

    (60, "Operator with missing right operand",
     'Bilang x dutokan-> 10;\nBilang y dutokan-> x + ;',
     "parser", "Invalid expression token ;"),

    (61, "sabali without preceding nu",
     'sabali {\n    Ibaga("hello");\n}',
     "parser", "Invalid statement start sabali"),

    (62, "Two sabali blocks (double else)",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("big");\n}\nsabali {\n    Ibaga("small");\n}\nsabali {\n    Ibaga("other");\n}',
     "parser", "Invalid statement start sabali"),

    (63, "Missing condition in if statement",
     'nu () {\n    Ibaga("hello");\n}',
     "parser", "Invalid expression token )"),

    (64, "Nested unclosed braces",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    nu (x > 8) {\n        Ibaga("very big");\n    }',
     "parser", "Expected RBRACE"),

    (65, "Using a keyword as a variable name (nu)",
     'Bilang nu dutokan-> 5;',
     "parser", "Expected IDENT, got IF"),

    (66, "Using a type keyword as a variable name",
     'Bilang Bilang dutokan-> 5;',
     "parser", "Expected IDENT, got TYPE_INT"),

    (67, "Missing expression inside Ibaga with comma",
     'Ibaga(, "\\n");',
     "parser", "Invalid expression token ,"),

    (68, "Assignment without prior declaration (syntax valid, semantic error)",
     'y dutokan-> 10;',
     "semantic", "Variable y is not declared"),

    (69, "Stray closing brace",
     'Bilang x dutokan-> 10;\n}',
     "parser", "Expected EOF, got RBRACE"),

    (70, "Number starting a statement",
     '10 dutokan-> x;',
     "parser", "Invalid statement start 10"),

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION C: SEMANTIC ERRORS (Scenarios 71–110)
    # ══════════════════════════════════════════════════════════════════════════
    (71, "Type mismatch - assigning string to integer",
     'Bilang x dutokan-> "hello";',
     "semantic", "Type mismatch: expected Bilang, got Sarsarita"),

    (72, "Type mismatch - assigning integer to string",
     'Sarsarita name dutokan-> 42;',
     "semantic", "Type mismatch: expected Sarsarita, got Bilang"),

    (73, "Using an undeclared variable",
     'y dutokan-> 10;',
     "semantic", "Variable y is not declared"),

    (74, "Using an undeclared variable in an expression",
     'Bilang x dutokan-> y + 5;',
     "semantic", "Variable y is not declared"),

    (75, "Redeclaring a variable in the same scope",
     'Bilang x dutokan-> 10;\nBilang x dutokan-> 20;',
     "semantic", "Variable x already declared"),

    (76, "Type mismatch in reassignment",
     'Bilang x dutokan-> 10;\nx dutokan-> "hello";',
     "semantic", "Type mismatch: expected Bilang, got Sarsarita"),

    (77, "Assigning boolean to integer",
     'Bilang x dutokan-> true;',
     "semantic", "Type mismatch: expected Bilang, got Pudno"),

    (78, "Assigning float to integer (narrowing not allowed)",
     'Bilang x dutokan-> 3.14;',
     "semantic", "Type mismatch: expected Bilang, got Gudua"),

    (79, "Assigning integer to boolean",
     'Pudno flag dutokan-> 1;',
     "semantic", "Type mismatch: expected Pudno, got Bilang"),

    (80, "Assigning string to boolean",
     'Pudno flag dutokan-> "true";',
     "semantic", "Type mismatch: expected Pudno, got Sarsarita"),

    (81, "Adding string and integer",
     'Sarsarita name dutokan-> "Jules";\nBilang age dutokan-> 21;\nSarsarita result dutokan-> name + age;',
     "semantic", "Operator + requires matching types"),

    (82, "Subtracting strings",
     'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> "world";\nSarsarita c dutokan-> a - b;',
     "semantic", "Operator - requires numeric operands"),

    (83, "Multiplying strings",
     'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> a * a;',
     "semantic", "Operator * requires numeric operands"),

    (84, "Dividing strings",
     'Sarsarita a dutokan-> "hello";\nSarsarita b dutokan-> a / a;',
     "semantic", "Operator / requires numeric operands"),

    (85, "Floor division with float operands",
     'Gudua a dutokan-> 10.0;\nGudua b dutokan-> 3.0;\nGudua c dutokan-> a // b;',
     "semantic", "Operator // requires Bilang operands"),

    (86, "Modulo with float operands",
     'Gudua a dutokan-> 10.0;\nGudua b dutokan-> 3.0;\nGudua c dutokan-> a % b;',
     "semantic", "Operator % requires Bilang operands"),

    (87, "Floor division with mixed types",
     'Bilang a dutokan-> 10;\nGudua b dutokan-> 3.0;\nBilang c dutokan-> a // b;',
     "semantic", "Operator // requires Bilang operands"),

    (88, "Division by zero (literal)",
     'Bilang a dutokan-> 10;\nGudua result dutokan-> a / 0;',
     "semantic", "Division by zero"),

    (89, "Floor division by zero (literal)",
     'Bilang a dutokan-> 10;\nBilang result dutokan-> a // 0;',
     "semantic", "Operator // with zero divisor"),

    (90, "Modulo by zero (literal)",
     'Bilang a dutokan-> 10;\nBilang result dutokan-> a % 0;',
     "semantic", "Operator % with zero divisor"),

    (91, "Division by zero with float literal",
     'Gudua a dutokan-> 10.0;\nGudua result dutokan-> a / 0.0;',
     "semantic", "Division by zero"),

    (92, "Non-boolean if condition (integer)",
     'Bilang x dutokan-> 10;\nnu (x) {\n    Ibaga("hello");\n}',
     "semantic", "If condition must be Pudno, got Bilang"),

    (93, "Non-boolean if condition (string)",
     'Sarsarita s dutokan-> "hello";\nnu (s) {\n    Ibaga("world");\n}',
     "semantic", "If condition must be Pudno, got Sarsarita"),

    (94, "Non-boolean if condition (arithmetic expression)",
     'Bilang x dutokan-> 10;\nBilang y dutokan-> 5;\nnu (x + y) {\n    Ibaga("fifteen");\n}',
     "semantic", "If condition must be Pudno, got Bilang"),

    (95, "Non-boolean else-if condition",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga("big");\n}\nsabali nu (x) {\n    Ibaga("other");\n}',
     "semantic", "Else-if condition must be Pudno, got Bilang"),

    (96, "Non-string end argument in Ibaga (integer)",
     'Ibaga("Hello", 42);',
     "semantic", "Ibaga end argument must be Sarsarita"),

    (97, "Non-string end argument in Ibaga (boolean)",
     'Ibaga("Hello", true);',
     "semantic", "Ibaga end argument must be Sarsarita"),

    (98, "Non-string prompt in Ikabil",
     'Sarsarita input dutokan-> Ikabil(42);',
     "semantic", "Ikabil prompt must be Sarsarita"),

    (99, "Comparing incompatible types with ==",
     'Bilang x dutokan-> 10;\nSarsarita s dutokan-> "10";\nPudno result dutokan-> x == s;',
     "semantic", "Operator == requires matching types"),

    (100, "Comparing incompatible types with !=",
     'Pudno flag dutokan-> true;\nBilang x dutokan-> 1;\nPudno result dutokan-> flag != x;',
     "semantic", "Operator != requires matching types"),

    (101, "Relational comparison on strings",
     'Sarsarita a dutokan-> "apple";\nSarsarita b dutokan-> "banana";\nPudno result dutokan-> a > b;',
     "semantic", "Operator > requires numeric operands"),

    (102, "Relational comparison on booleans",
     'Pudno a dutokan-> true;\nPudno b dutokan-> false;\nPudno result dutokan-> a >= b;',
     "semantic", "Operator >= requires numeric operands"),

    (103, "Storing division result in integer (type mismatch)",
     'Bilang a dutokan-> 10;\nBilang b dutokan-> 3;\nBilang result dutokan-> a / b;',
     "semantic", "Type mismatch: expected Bilang, got Gudua"),

    (104, "Accessing variable from a different (sibling) scope",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Bilang inner dutokan-> 20;\n}\nIbaga(inner);',
     "semantic", "Variable inner is not declared"),

    (105, "Accessing variable from an exited inner scope",
     'Bilang a dutokan-> 10;\nnu (a > 5) {\n    Bilang b dutokan-> 20;\n}\nb dutokan-> 30;',
     "semantic", "Variable b is not declared"),

    (106, "Redeclaring variable in same scope after if block",
     'Bilang x dutokan-> 10;\nnu (x > 5) {\n    Ibaga(x);\n}\nBilang x dutokan-> 20;',
     "semantic", "Variable x already declared"),

    (107, "Undeclared variable in output",
     'Ibaga(undeclaredVar);',
     "semantic", "Variable undeclaredVar is not declared"),

    (108, "Undeclared variable in comparison",
     'Bilang x dutokan-> 10;\nnu (x > unknownVar) {\n    Ibaga("hello");\n}',
     "semantic", "Variable unknownVar is not declared"),

    (109, "Adding boolean values",
     'Pudno a dutokan-> true;\nPudno b dutokan-> false;\nPudno c dutokan-> a + b;',
     "semantic", "Operator + requires numeric or Sarsarita"),

    (110, "Assigning Gudua to Sarsarita",
     'Gudua x dutokan-> 3.14;\nSarsarita s dutokan-> x;',
     "semantic", "Type mismatch: expected Sarsarita, got Gudua"),
]


def run_scenario(scenario_id, title, code, expected_phase, expected_outcome):
    """Run a single scenario through lexer -> parser -> semantic analyzer."""
    result = {
        "id": scenario_id,
        "title": title,
        "code": code,
        "expected_phase": expected_phase,
        "expected_outcome": expected_outcome,
        "actual_phase": None,
        "actual_result": None,
        "tokens": None,
        "ast": None,
        "symbol_table": None,
        "passed": False,
    }

    # Phase 1: Lexer
    try:
        lexer = Lexer(code)
        tokens = lexer.tokenize()
        result["tokens"] = [(t.type, t.value, t.line, t.column) for t in tokens]
    except LexerError as e:
        result["actual_phase"] = "lexer"
        result["actual_result"] = str(e)
        result["passed"] = (expected_phase == "lexer")
        return result

    # Phase 2: Parser
    try:
        parser = Parser(tokens)
        ast = parser.parse()
        result["ast"] = repr(ast)[:500]
    except ParserError as e:
        result["actual_phase"] = "parser"
        result["actual_result"] = str(e)
        result["passed"] = (expected_phase == "parser")
        return result

    # Phase 3: Semantic Analysis
    try:
        analyzer = SemanticAnalyzer()
        analyzer.analyze(ast)
        result["symbol_table"] = [
            (s.name, s.var_type, s.scope, s.offset, s.weight, s.line, s.column)
            for s in analyzer.symbol_table
        ]
        result["actual_phase"] = "valid"
        result["actual_result"] = "All phases passed successfully"
        result["passed"] = (expected_phase == "valid")
    except SemanticError as e:
        result["actual_phase"] = "semantic"
        result["actual_result"] = str(e)
        result["passed"] = (expected_phase == "semantic")

    return result


def generate_html(results):
    """Generate a styled HTML report."""
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed

    valid_results = [r for r in results if r["expected_phase"] == "valid"]
    syntax_results = [r for r in results if r["expected_phase"] in ("lexer", "parser")]
    semantic_results = [r for r in results if r["expected_phase"] == "semantic"]

    def status_badge(r):
        if r["passed"]:
            return '<span class="badge pass">PASS</span>'
        return '<span class="badge fail">FAIL</span>'

    def phase_badge(phase):
        colors = {
            "valid": ("#a6e3a1", "#1e1e2e"),
            "lexer": ("#f38ba8", "#1e1e2e"),
            "parser": ("#fab387", "#1e1e2e"),
            "semantic": ("#cba6f7", "#1e1e2e"),
        }
        bg, fg = colors.get(phase, ("#cdd6f4", "#1e1e2e"))
        label = phase.upper() if phase != "valid" else "VALID"
        return f'<span class="phase-badge" style="background:{bg};color:{fg}">{label}</span>'

    def escape(text):
        return html_module.escape(str(text))

    def render_tokens(tokens):
        if not tokens:
            return ""
        rows = ""
        for t_type, t_val, t_line, t_col in tokens:
            rows += f"<tr><td>{escape(t_type)}</td><td>{escape(t_val)}</td><td>{t_line}</td><td>{t_col}</td></tr>"
        return f"""<details><summary>Tokens ({len(tokens)})</summary>
        <table class="mini-table"><tr><th>Type</th><th>Value</th><th>Line</th><th>Col</th></tr>{rows}</table></details>"""

    def render_symbols(symbols):
        if not symbols:
            return ""
        rows = ""
        for name, vtype, scope, offset, weight, line, col in symbols:
            rows += f"<tr><td>{escape(name)}</td><td>{escape(vtype)}</td><td>{escape(scope)}</td><td>{offset}</td><td>{weight}</td><td>{line}:{col}</td></tr>"
        return f"""<details><summary>Symbol Table ({len(symbols)} entries)</summary>
        <table class="mini-table"><tr><th>Name</th><th>Type</th><th>Scope</th><th>Offset</th><th>Weight</th><th>Location</th></tr>{rows}</table></details>"""

    def render_section(title, section_results, section_class):
        cards = ""
        for r in section_results:
            error_class = "error-msg" if not r["passed"] or r["actual_phase"] != "valid" else "success-msg"
            if r["actual_phase"] == "valid":
                error_class = "success-msg"

            cards += f"""
            <div class="card {section_class} {'card-pass' if r['passed'] else 'card-fail'}">
                <div class="card-header">
                    <div class="card-title">
                        <span class="scenario-num">#{r['id']}</span>
                        {escape(r['title'])}
                    </div>
                    <div class="card-badges">
                        {phase_badge(r['actual_phase'] or '?')}
                        {status_badge(r)}
                    </div>
                </div>
                <div class="card-body">
                    <div class="code-block"><pre>{escape(r['code'])}</pre></div>
                    <div class="result-row">
                        <div class="result-label">Expected:</div>
                        <div class="result-value">{escape(r['expected_outcome'])}</div>
                    </div>
                    <div class="result-row">
                        <div class="result-label">Actual:</div>
                        <div class="{error_class}">{escape(r['actual_result'] or 'N/A')}</div>
                    </div>
                    {render_tokens(r.get('tokens'))}
                    {render_symbols(r.get('symbol_table'))}
                </div>
            </div>"""
        return f"""<div class="section">
            <h2 class="section-title">{title}</h2>
            {cards}
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Elokano Test Scenarios Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');

* {{ margin: 0; padding: 0; box-sizing: border-box; }}

body {{
    font-family: 'Inter', sans-serif;
    background: #0d0d1a;
    color: #cdd6f4;
    line-height: 1.6;
    padding: 20px;
}}

.container {{ max-width: 1200px; margin: 0 auto; }}

/* Header */
.header {{
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
    border-radius: 16px;
    margin-bottom: 30px;
    border: 1px solid #313244;
}}
.header h1 {{
    font-size: 2.2em;
    color: #cba6f7;
    margin-bottom: 8px;
    letter-spacing: 1px;
}}
.header .subtitle {{
    color: #a6adc8;
    font-size: 0.95em;
}}

/* Stats bar */
.stats {{
    display: flex;
    gap: 16px;
    justify-content: center;
    margin: 24px 0;
    flex-wrap: wrap;
}}
.stat-box {{
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 12px;
    padding: 16px 28px;
    text-align: center;
    min-width: 140px;
}}
.stat-box .stat-num {{
    font-size: 2em;
    font-weight: 700;
}}
.stat-box .stat-label {{
    font-size: 0.8em;
    color: #a6adc8;
    text-transform: uppercase;
    letter-spacing: 1px;
}}
.stat-total .stat-num {{ color: #89b4fa; }}
.stat-pass .stat-num {{ color: #a6e3a1; }}
.stat-fail .stat-num {{ color: #f38ba8; }}
.stat-valid .stat-num {{ color: #a6e3a1; }}
.stat-syntax .stat-num {{ color: #fab387; }}
.stat-semantic .stat-num {{ color: #cba6f7; }}

/* Filter bar */
.filter-bar {{
    display: flex;
    gap: 10px;
    justify-content: center;
    margin: 20px 0 30px;
    flex-wrap: wrap;
}}
.filter-btn {{
    padding: 8px 20px;
    border: 1px solid #313244;
    border-radius: 8px;
    background: #1e1e2e;
    color: #cdd6f4;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s;
}}
.filter-btn:hover {{ background: #2d2d3d; }}
.filter-btn.active {{ background: #89b4fa; color: #1e1e2e; border-color: #89b4fa; font-weight: 600; }}

/* Section */
.section {{ margin-bottom: 30px; }}
.section-title {{
    font-size: 1.4em;
    color: #89b4fa;
    padding: 12px 0;
    border-bottom: 2px solid #313244;
    margin-bottom: 16px;
}}

/* Cards */
.card {{
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
    transition: border-color 0.2s;
}}
.card:hover {{ border-color: #45475a; }}
.card-pass {{ border-left: 4px solid #a6e3a1; }}
.card-fail {{ border-left: 4px solid #f38ba8; }}

.card-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: #181825;
    flex-wrap: wrap;
    gap: 8px;
}}
.card-title {{
    font-weight: 600;
    font-size: 0.95em;
}}
.scenario-num {{
    color: #89b4fa;
    margin-right: 8px;
    font-family: 'Fira Code', monospace;
    font-size: 0.85em;
}}
.card-badges {{ display: flex; gap: 8px; align-items: center; }}

.badge {{
    padding: 3px 12px;
    border-radius: 6px;
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.5px;
}}
.badge.pass {{ background: #a6e3a1; color: #1e1e2e; }}
.badge.fail {{ background: #f38ba8; color: #1e1e2e; }}

.phase-badge {{
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.7em;
    font-weight: 700;
    letter-spacing: 0.5px;
}}

.card-body {{ padding: 14px 18px; }}

.code-block {{
    background: #11111b;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
    overflow-x: auto;
}}
.code-block pre {{
    font-family: 'Fira Code', monospace;
    font-size: 0.82em;
    color: #a6e3a1;
    white-space: pre-wrap;
    word-break: break-word;
}}

.result-row {{
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
    align-items: flex-start;
}}
.result-label {{
    font-weight: 600;
    color: #a6adc8;
    min-width: 75px;
    font-size: 0.85em;
}}
.result-value {{ font-size: 0.85em; }}
.success-msg {{ color: #a6e3a1; font-size: 0.85em; }}
.error-msg {{ color: #fab387; font-family: 'Fira Code', monospace; font-size: 0.8em; }}

/* Expandable details */
details {{
    margin-top: 10px;
    border-top: 1px solid #313244;
    padding-top: 8px;
}}
summary {{
    cursor: pointer;
    color: #89b4fa;
    font-size: 0.85em;
    font-weight: 600;
    margin-bottom: 6px;
}}

.mini-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78em;
    font-family: 'Fira Code', monospace;
}}
.mini-table th {{
    background: #181825;
    color: #cba6f7;
    padding: 6px 10px;
    text-align: left;
    border-bottom: 1px solid #313244;
}}
.mini-table td {{
    padding: 4px 10px;
    border-bottom: 1px solid #1e1e2e;
    color: #cdd6f4;
}}
.mini-table tr:hover td {{ background: #181825; }}

/* Progress bar */
.progress-bar {{
    width: 100%;
    height: 8px;
    background: #313244;
    border-radius: 4px;
    margin: 16px 0;
    overflow: hidden;
}}
.progress-fill {{
    height: 100%;
    background: linear-gradient(90deg, #a6e3a1, #89b4fa);
    border-radius: 4px;
    transition: width 0.3s;
}}

@media print {{
    body {{ background: white; color: #1e1e2e; padding: 10px; }}
    .filter-bar {{ display: none; }}
    .card {{ break-inside: avoid; page-break-inside: avoid; border: 1px solid #ccc; }}
    .card-header {{ background: #f5f5f5; }}
    .code-block {{ background: #f0f0f0; }}
    .code-block pre {{ color: #1e1e2e; }}
    .header {{ background: #f5f5f5; border: 1px solid #ccc; }}
    .header h1 {{ color: #6c3fb5; }}
    .section-title {{ color: #2563eb; }}
    .stat-box {{ border: 1px solid #ccc; }}
    .mini-table th {{ background: #f0f0f0; color: #6c3fb5; }}
    .error-msg {{ color: #c2410c; }}
    .success-msg {{ color: #16a34a; }}
}}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>ELOKANO TEST SCENARIOS REPORT</h1>
        <p class="subtitle">Automated Testing of Lexer, Parser, and Semantic Analyzer &mdash; {datetime.now().strftime('%B %d, %Y %I:%M %p')}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:{passed/total*100:.1f}%"></div></div>
    </div>

    <div class="stats">
        <div class="stat-box stat-total"><div class="stat-num">{total}</div><div class="stat-label">Total</div></div>
        <div class="stat-box stat-pass"><div class="stat-num">{passed}</div><div class="stat-label">Passed</div></div>
        <div class="stat-box stat-fail"><div class="stat-num">{failed}</div><div class="stat-label">Failed</div></div>
        <div class="stat-box stat-valid"><div class="stat-num">{len(valid_results)}</div><div class="stat-label">Valid Code</div></div>
        <div class="stat-box stat-syntax"><div class="stat-num">{len(syntax_results)}</div><div class="stat-label">Syntax Errors</div></div>
        <div class="stat-box stat-semantic"><div class="stat-num">{len(semantic_results)}</div><div class="stat-label">Semantic Errors</div></div>
    </div>

    <div class="filter-bar">
        <button class="filter-btn active" onclick="filterCards('all')">All ({total})</button>
        <button class="filter-btn" onclick="filterCards('valid')">Valid ({len(valid_results)})</button>
        <button class="filter-btn" onclick="filterCards('syntax')">Syntax Errors ({len(syntax_results)})</button>
        <button class="filter-btn" onclick="filterCards('semantic')">Semantic Errors ({len(semantic_results)})</button>
        <button class="filter-btn" onclick="filterCards('pass')">Passed ({passed})</button>
        <button class="filter-btn" onclick="filterCards('fail')">Failed ({failed})</button>
    </div>

    {render_section("Section A: Valid Code (Scenarios 1-40)", valid_results, "section-valid")}
    {render_section("Section B: Syntax Errors (Scenarios 41-70)", syntax_results, "section-syntax")}
    {render_section("Section C: Semantic Errors (Scenarios 71-110)", semantic_results, "section-semantic")}
</div>

<script>
function filterCards(type) {{
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.card').forEach(card => {{
        let show = true;
        if (type === 'valid') show = card.classList.contains('section-valid');
        else if (type === 'syntax') show = card.classList.contains('section-syntax');
        else if (type === 'semantic') show = card.classList.contains('section-semantic');
        else if (type === 'pass') show = card.classList.contains('card-pass');
        else if (type === 'fail') show = card.classList.contains('card-fail');
        card.style.display = show ? '' : 'none';
    }});
    document.querySelectorAll('.section').forEach(sec => {{
        if (type === 'all' || type === 'pass' || type === 'fail') {{
            sec.style.display = '';
        }} else if (type === 'valid') {{
            sec.style.display = sec.querySelector('.section-valid') ? '' : 'none';
        }} else if (type === 'syntax') {{
            sec.style.display = sec.querySelector('.section-syntax') ? '' : 'none';
        }} else if (type === 'semantic') {{
            sec.style.display = sec.querySelector('.section-semantic') ? '' : 'none';
        }}
    }});
}}
</script>
</body>
</html>"""
    return html


def generate_pdf(results, output_path):
    """Generate a PDF report using fpdf2."""
    from fpdf import FPDF

    class PDF(FPDF):
        def header(self):
            self.set_font('Helvetica', 'B', 14)
            self.set_text_color(108, 63, 181)
            self.cell(0, 10, 'ELOKANO TEST SCENARIOS REPORT', align='C', new_x="LMARGIN", new_y="NEXT")
            self.set_font('Helvetica', '', 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 5, datetime.now().strftime('%B %d, %Y %I:%M %p'), align='C', new_x="LMARGIN", new_y="NEXT")
            self.ln(4)

        def footer(self):
            self.set_y(-15)
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(150, 150, 150)
            self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    pdf = PDF('P', 'mm', 'A4')
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed

    # Summary stats
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 8, 'SUMMARY', new_x="LMARGIN", new_y="NEXT")

    pdf.set_font('Helvetica', '', 9)
    pdf.set_fill_color(240, 240, 240)
    stats = [
        f"Total: {total}",
        f"Passed: {passed}",
        f"Failed: {failed}",
        f"Valid Code: {sum(1 for r in results if r['expected_phase']=='valid')}",
        f"Syntax Errors: {sum(1 for r in results if r['expected_phase'] in ('lexer','parser'))}",
        f"Semantic Errors: {sum(1 for r in results if r['expected_phase']=='semantic')}",
    ]
    pdf.cell(0, 7, '  |  '.join(stats), fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    sections = [
        ("SECTION A: VALID CODE", [r for r in results if r["expected_phase"] == "valid"]),
        ("SECTION B: SYNTAX ERRORS", [r for r in results if r["expected_phase"] in ("lexer", "parser")]),
        ("SECTION C: SEMANTIC ERRORS", [r for r in results if r["expected_phase"] == "semantic"]),
    ]

    for section_title, section_results in sections:
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(37, 99, 235)
        pdf.cell(0, 8, section_title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(200, 200, 200)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)

        for r in section_results:
            # Check if we need a new page (estimate card height)
            if pdf.get_y() > 245:
                pdf.add_page()

            # Scenario header
            status = "PASS" if r["passed"] else "FAIL"
            phase = (r["actual_phase"] or "?").upper()

            pdf.set_font('Helvetica', 'B', 9)
            pdf.set_text_color(30, 30, 30)

            if r["passed"]:
                pdf.set_fill_color(220, 252, 231)
            else:
                pdf.set_fill_color(254, 226, 226)

            pdf.cell(0, 6,
                     f"#{r['id']}  {r['title']}  [{phase}] [{status}]",
                     fill=True, new_x="LMARGIN", new_y="NEXT")

            # Code
            pdf.set_font('Courier', '', 7.5)
            pdf.set_text_color(30, 80, 30)
            pdf.set_fill_color(245, 245, 245)
            code_lines = r["code"].split("\n")
            for line in code_lines:
                safe_line = line.encode('latin-1', 'replace').decode('latin-1')
                pdf.cell(0, 4, f"  {safe_line}", fill=True, new_x="LMARGIN", new_y="NEXT")

            # Expected
            pdf.set_font('Helvetica', '', 7.5)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 5, f"  Expected: {r['expected_outcome']}", new_x="LMARGIN", new_y="NEXT")

            # Actual
            if r["actual_phase"] == "valid":
                pdf.set_text_color(22, 163, 74)
            else:
                pdf.set_text_color(194, 65, 12)

            actual_text = (r["actual_result"] or "N/A")
            safe_actual = actual_text.encode('latin-1', 'replace').decode('latin-1')
            # Truncate if too long
            if len(safe_actual) > 120:
                safe_actual = safe_actual[:117] + "..."
            pdf.cell(0, 5, f"  Actual: {safe_actual}", new_x="LMARGIN", new_y="NEXT")

            # Symbol table summary for valid scenarios
            if r.get("symbol_table"):
                pdf.set_text_color(108, 63, 181)
                pdf.set_font('Helvetica', 'I', 7)
                pdf.cell(0, 4, f"  Symbol Table: {len(r['symbol_table'])} entries", new_x="LMARGIN", new_y="NEXT")

            pdf.ln(3)

    return pdf


def main():
    print("=" * 60)
    print("  ELOKANO TEST SCENARIO RUNNER")
    print("=" * 60)
    print()

    results = []
    for scenario in SCENARIOS:
        sid, title, code, expected_phase, expected_outcome = scenario
        result = run_scenario(sid, title, code, expected_phase, expected_outcome)
        results.append(result)
        status = "PASS" if result["passed"] else "FAIL"
        phase = (result["actual_phase"] or "?").upper()
        icon = "+" if result["passed"] else "X"
        print(f"  [{icon}] #{sid:3d} [{phase:8s}] [{status}] {title}")

    print()
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    print(f"  Results: {passed}/{total} passed, {failed} failed")
    print()

    # Generate HTML
    html_path = os.path.join(os.path.dirname(__file__), "Elokano_Test_Report.html")
    html_content = generate_html(results)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"  HTML Report: {html_path}")

    # Generate PDF
    pdf_path = os.path.join(os.path.dirname(__file__), "Elokano_Test_Report.pdf")
    try:
        pdf = generate_pdf(results, pdf_path)
        pdf.output(pdf_path)
        print(f"  PDF Report:  {pdf_path}")
    except Exception as e:
        print(f"  PDF Error: {e}")

    print()
    print("=" * 60)
    print("  DONE")
    print("=" * 60)


if __name__ == "__main__":
    main()
