import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Union


TYPE_INT = "Bilang"
TYPE_FLOAT = "Gudua"
TYPE_STRING = "Sarsarita"
TYPE_BOOL = "Pudno"


@dataclass
class Token:
    type: str
    value: str
    line: int
    column: int


class LexerError(Exception):
    pass


class ParserError(Exception):
    pass


class SemanticError(Exception):
    pass


@dataclass
class Literal:
    value: str
    kind: str
    token: Token


@dataclass
class Identifier:
    name: str
    token: Token


@dataclass
class BinaryOp:
    left: "Expr"
    op: str
    right: "Expr"
    token: Token


@dataclass
class InputExpr:
    prompt: Optional["Expr"]
    token: Token


Expr = Union[Literal, Identifier, BinaryOp, InputExpr]


@dataclass
class Declaration:
    var_type: str
    name: str
    expr: Expr
    token: Token


@dataclass
class Assignment:
    name: str
    expr: Expr
    token: Token


@dataclass
class Output:
    expr: Optional[Expr]
    end_expr: Optional[Expr]
    token: Token


Statement = Union[Declaration, Assignment, Output]


class Lexer:
    KEYWORDS = {
        "Bilang": "TYPE_INT",
        "Gudua": "TYPE_FLOAT",
        "Sarsarita": "TYPE_STRING",
        "Pudno": "TYPE_BOOL",
        "Ibaga": "OUTPUT",
        "Ikabil": "INPUT",
        "true": "BOOL_LIT",
        "false": "BOOL_LIT",
    }

    TOKEN_SPEC = [
        ("ASSIGN", r"dutokan->"),
        ("SEMI", r";"),
        ("LPAREN", r"\("),
        ("RPAREN", r"\)"),
        ("COMMA", r","),
        ("PLUS", r"\+"),
        ("MINUS", r"-"),
        ("MUL", r"\*"),
        ("FLOOR_DIV", r"//"),
        ("DIV", r"/"),
        ("MOD", r"%"),
        ("FLOAT_LIT", r"\d+\.\d+"),
        ("INT_LIT", r"\d+"),
        ("STRING_LIT", r'"[^"\\]*(?:\\.[^"\\]*)*"'),
        ("IDENT", r"[A-Za-z_][A-Za-z0-9_]*"),
        ("NEWLINE", r"\n"),
        ("SKIP", r"[ \t\r]+"),
        ("MISMATCH", r"."),
    ]

    def __init__(self, source: str):
        self.source = source
        parts = [f"(?P<{name}>{pattern})" for name, pattern in self.TOKEN_SPEC]
        self.regex = re.compile("|".join(parts))

    def tokenize(self) -> List[Token]:
        tokens: List[Token] = []
        line = 1
        line_start = 0

        for match in self.regex.finditer(self.source):
            kind = match.lastgroup
            value = match.group()
            column = match.start() - line_start + 1

            if kind == "NEWLINE":
                line += 1
                line_start = match.end()
                continue

            if kind == "SKIP":
                continue

            if kind == "MISMATCH":
                raise LexerError(f"Unexpected character {value!r} at line {line}, column {column}")

            if kind == "IDENT" and value in self.KEYWORDS:
                tokens.append(Token(self.KEYWORDS[value], value, line, column))
            else:
                tokens.append(Token(kind, value, line, column))

        tokens.append(Token("EOF", "", line, 1))
        return tokens


class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0

    def current(self) -> Token:
        return self.tokens[self.pos]

    def consume(self, expected_type: str) -> Token:
        token = self.current()
        if token.type != expected_type:
            raise ParserError(
                f"Expected {expected_type}, got {token.type} ({token.value!r}) "
                f"at line {token.line}, column {token.column}"
            )
        self.pos += 1
        return token

    def match(self, token_type: str) -> bool:
        if self.current().type == token_type:
            self.pos += 1
            return True
        return False

    def parse(self) -> List[Statement]:
        statements: List[Statement] = []
        while self.current().type != "EOF":
            statements.append(self.statement())
            self.consume("SEMI")
            while self.match("SEMI"):
                pass
        self.consume("EOF")
        return statements

    def statement(self) -> Statement:
        token = self.current()
        if token.type in {"TYPE_INT", "TYPE_FLOAT", "TYPE_STRING", "TYPE_BOOL"}:
            return self.declaration()
        if token.type == "OUTPUT":
            return self.output_statement()
        if token.type == "IDENT":
            return self.assignment()
        raise ParserError(
            f"Invalid statement start {token.value!r} at line {token.line}, column {token.column}"
        )

    def declaration(self) -> Declaration:
        type_token = self.current()
        self.pos += 1
        name_token = self.consume("IDENT")
        self.consume("ASSIGN")
        expr = self.expression()
        return Declaration(var_type=type_token.value, name=name_token.value, expr=expr, token=type_token)

    def assignment(self) -> Assignment:
        name_token = self.consume("IDENT")
        self.consume("ASSIGN")
        expr = self.expression()
        return Assignment(name=name_token.value, expr=expr, token=name_token)

    def output_statement(self) -> Output:
        token = self.consume("OUTPUT")
        expr: Optional[Expr] = None
        end_expr: Optional[Expr] = None

        self.consume("LPAREN")
        if self.current().type != "RPAREN":
            expr = self.expression()
            if self.match("COMMA"):
                end_expr = self.expression()
        self.consume("RPAREN")

        return Output(expr=expr, end_expr=end_expr, token=token)

    def expression(self) -> Expr:
        return self.addition()

    def addition(self) -> Expr:
        node = self.multiplication()
        while self.current().type in {"PLUS", "MINUS"}:
            op_token = self.current()
            self.pos += 1
            node = BinaryOp(left=node, op=op_token.value, right=self.multiplication(), token=op_token)
        return node

    def multiplication(self) -> Expr:
        node = self.factor()
        while self.current().type in {"MUL", "DIV", "FLOOR_DIV", "MOD"}:
            op_token = self.current()
            self.pos += 1
            node = BinaryOp(left=node, op=op_token.value, right=self.factor(), token=op_token)
        return node

    def factor(self) -> Expr:
        if self.match("LPAREN"):
            node = self.expression()
            self.consume("RPAREN")
            return node
        return self.primary()

    def primary(self) -> Expr:
        token = self.current()

        if token.type == "IDENT":
            self.pos += 1
            return Identifier(name=token.value, token=token)

        if token.type in {"INT_LIT", "FLOAT_LIT", "STRING_LIT", "BOOL_LIT"}:
            self.pos += 1
            return Literal(value=token.value, kind=token.type, token=token)

        if token.type == "INPUT":
            return self.input_expression()

        raise ParserError(
            f"Invalid expression token {token.value!r} at line {token.line}, column {token.column}"
        )

    def input_expression(self) -> InputExpr:
        token = self.consume("INPUT")
        prompt: Optional[Expr] = None

        if self.match("LPAREN"):
            if self.current().type != "RPAREN":
                prompt = self.expression()
            self.consume("RPAREN")

        return InputExpr(prompt=prompt, token=token)


class SemanticAnalyzer:
    def __init__(self):
        self.symbols: Dict[str, str] = {}

    def analyze(self, statements: List[Statement]) -> None:
        for statement in statements:
            if isinstance(statement, Declaration):
                self.analyze_declaration(statement)
            elif isinstance(statement, Assignment):
                self.analyze_assignment(statement)
            elif isinstance(statement, Output):
                if statement.expr is not None:
                    self.infer_expr_type(statement.expr)
                if statement.end_expr is not None:
                    end_type = self.infer_expr_type(statement.end_expr)
                    if end_type != TYPE_STRING:
                        self.error(
                            statement.token,
                            f"Ibaga end argument must be {TYPE_STRING}, got {end_type}",
                        )

    def analyze_declaration(self, statement: Declaration) -> None:
        if statement.name in self.symbols:
            self.error(statement.token, f"Variable {statement.name!r} already declared")

        expr_type = self.infer_expr_type(statement.expr)
        if not self.is_assignable(statement.var_type, expr_type):
            self.error(
                statement.token,
                f"Type mismatch in declaration of {statement.name!r}: "
                f"expected {statement.var_type}, got {expr_type}",
            )

        self.symbols[statement.name] = statement.var_type

    def analyze_assignment(self, statement: Assignment) -> None:
        if statement.name not in self.symbols:
            self.error(statement.token, f"Variable {statement.name!r} is not declared")

        var_type = self.symbols[statement.name]
        expr_type = self.infer_expr_type(statement.expr)

        if not self.is_assignable(var_type, expr_type):
            self.error(
                statement.token,
                f"Type mismatch in assignment to {statement.name!r}: "
                f"expected {var_type}, got {expr_type}",
            )

    def infer_expr_type(self, expr: Expr) -> str:
        if isinstance(expr, Literal):
            if expr.kind == "INT_LIT":
                return TYPE_INT
            if expr.kind == "FLOAT_LIT":
                return TYPE_FLOAT
            if expr.kind == "STRING_LIT":
                return TYPE_STRING
            return TYPE_BOOL

        if isinstance(expr, Identifier):
            if expr.name not in self.symbols:
                self.error(expr.token, f"Variable {expr.name!r} is not declared")
            return self.symbols[expr.name]

        if isinstance(expr, InputExpr):
            if expr.prompt is not None:
                prompt_type = self.infer_expr_type(expr.prompt)
                if prompt_type != TYPE_STRING:
                    self.error(expr.token, f"Ikabil prompt must be {TYPE_STRING}, got {prompt_type}")
            return TYPE_STRING

        if isinstance(expr, BinaryOp):
            left_type = self.infer_expr_type(expr.left)
            right_type = self.infer_expr_type(expr.right)
            op = expr.op

            if op == "+":
                if left_type == TYPE_STRING and right_type == TYPE_STRING:
                    return TYPE_STRING
                if self.is_numeric(left_type) and self.is_numeric(right_type):
                    if TYPE_FLOAT in {left_type, right_type}:
                        return TYPE_FLOAT
                    return TYPE_INT
                self.error(
                    expr.token,
                    f"Operator '+' requires both operands numeric or both {TYPE_STRING} "
                    f"(got {left_type} and {right_type})",
                )

            if op in {"-", "*", "/"}:
                if not (self.is_numeric(left_type) and self.is_numeric(right_type)):
                    self.error(
                        expr.token,
                        f"Operator '{op}' requires numeric operands (got {left_type} and {right_type})",
                    )
                if op == "/" and self.is_zero_numeric_literal(expr.right):
                    self.error(expr.token, "Division by zero is not allowed")
                if op == "/":
                    return TYPE_FLOAT
                if TYPE_FLOAT in {left_type, right_type}:
                    return TYPE_FLOAT
                return TYPE_INT

            if op in {"//", "%"}:
                if left_type != TYPE_INT or right_type != TYPE_INT:
                    self.error(
                        expr.token,
                        f"Operator '{op}' requires {TYPE_INT} operands (got {left_type} and {right_type})",
                    )
                if self.is_zero_int_literal(expr.right):
                    self.error(expr.token, f"Operator '{op}' with zero divisor is not allowed")
                return TYPE_INT

            self.error(expr.token, f"Unknown operator {op!r}")

        raise SemanticError("Unknown expression node")

    @staticmethod
    def is_numeric(value_type: str) -> bool:
        return value_type in {TYPE_INT, TYPE_FLOAT}

    @staticmethod
    def is_assignable(target_type: str, value_type: str) -> bool:
        if target_type == value_type:
            return True
        return target_type == TYPE_FLOAT and value_type == TYPE_INT

    @staticmethod
    def is_zero_numeric_literal(expr: Expr) -> bool:
        if not isinstance(expr, Literal):
            return False
        if expr.kind == "INT_LIT":
            return int(expr.value) == 0
        if expr.kind == "FLOAT_LIT":
            return float(expr.value) == 0.0
        return False

    @staticmethod
    def is_zero_int_literal(expr: Expr) -> bool:
        return isinstance(expr, Literal) and expr.kind == "INT_LIT" and int(expr.value) == 0

    @staticmethod
    def error(token: Token, message: str) -> None:
        raise SemanticError(f"{message} at line {token.line}, column {token.column}")


def print_tokens(tokens: List[Token]) -> None:
    print("TOKENS:")
    for tok in tokens:
        print(f"{tok.type:<12} {tok.value!r:<12} (line={tok.line}, col={tok.column})")


def main() -> None:
    sample_program = '''
Bilang x dutokan-> 10;
Bilang y dutokan-> 20;
Gudua avg dutokan-> (x + y) / 2;
Bilang quotient dutokan-> y // 3;
Bilang rem dutokan-> y % 3;
Sarsarita name dutokan-> "Jules";
Pudno active dutokan-> true;
Ibaga("Hello, " + name, "\n");
Ibaga("avg=\t", "");
Ibaga(avg);
Ibaga("quotient=\t", "");
Ibaga(quotient, "\t");
Ibaga(rem);
'''.strip("\n")

    lexer = Lexer(sample_program)

    try:
        tokens = lexer.tokenize()
        print_tokens(tokens)

        parser = Parser(tokens)
        statements = parser.parse()
        print("\nSYNTAX: Valid program")

        semantic = SemanticAnalyzer()
        semantic.analyze(statements)
        print("SEMANTIC: Valid program")
    except (LexerError, ParserError, SemanticError) as err:
        print(f"\nERROR: {err}")


if __name__ == "__main__":
    main()

