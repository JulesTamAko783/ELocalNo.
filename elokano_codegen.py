import argparse
from pathlib import Path
from typing import Dict, List

from main import (
    Assignment,
    BinaryOp,
    Declaration,
    Expr,
    Identifier,
    InputExpr,
    Lexer,
    LexerError,
    Literal,
    Output,
    Parser,
    ParserError,
    SemanticAnalyzer,
    SemanticError,
    TYPE_BOOL,
    TYPE_FLOAT,
    TYPE_INT,
    TYPE_STRING,
)


def expr_to_python(expr: Expr) -> str:
    if isinstance(expr, Identifier):
        return expr.name

    if isinstance(expr, Literal):
        if expr.kind == "BOOL_LIT":
            return "True" if expr.value == "true" else "False"
        return expr.value

    if isinstance(expr, BinaryOp):
        left = expr_to_python(expr.left)
        right = expr_to_python(expr.right)
        return f"({left} {expr.op} {right})"

    if isinstance(expr, InputExpr):
        if expr.prompt is None:
            return "input()"
        return f"input({expr_to_python(expr.prompt)})"

    raise ValueError(f"Unhandled expression type: {type(expr)}")


def coerce_expr(var_type: str, expr_code: str) -> str:
    if var_type == TYPE_INT:
        return f"int({expr_code})"
    if var_type == TYPE_FLOAT:
        return f"float({expr_code})"
    if var_type == TYPE_STRING:
        return f"str({expr_code})"
    if var_type == TYPE_BOOL:
        return f"_elokano_to_bool({expr_code})"
    return expr_code


def generate_python(statements: List[Declaration | Assignment | Output]) -> str:
    lines = ["# Auto-generated from .elokano source"]
    symbol_types: Dict[str, str] = {}
    needs_bool_helper = False

    for stmt in statements:
        if isinstance(stmt, Declaration):
            expr_code = expr_to_python(stmt.expr)
            lines.append(f"{stmt.name} = {coerce_expr(stmt.var_type, expr_code)}")
            symbol_types[stmt.name] = stmt.var_type
            if stmt.var_type == TYPE_BOOL:
                needs_bool_helper = True
            continue

        if isinstance(stmt, Assignment):
            var_type = symbol_types[stmt.name]
            expr_code = expr_to_python(stmt.expr)
            lines.append(f"{stmt.name} = {coerce_expr(var_type, expr_code)}")
            if var_type == TYPE_BOOL:
                needs_bool_helper = True
            continue

        if isinstance(stmt, Output):
            lines.append(f"print({expr_to_python(stmt.expr)})")

    if needs_bool_helper:
        helper_lines = [
            "",
            "def _elokano_to_bool(v):",
            "    if isinstance(v, bool):",
            "        return v",
            "    if isinstance(v, str):",
            "        text = v.strip().lower()",
            "        if text in {'true', '1', 'yes', 'y', 'on'}:",
            "            return True",
            "        if text in {'false', '0', 'no', 'n', 'off'}:",
            "            return False",
            "    return bool(v)",
            "",
        ]
        lines = [lines[0], *helper_lines, *lines[1:]]

    lines.append("")
    return "\n".join(lines)


def compile_file(source_path: Path) -> str:
    source = source_path.read_text(encoding="utf-8-sig")
    tokens = Lexer(source).tokenize()

    parser = Parser(tokens)
    statements = parser.parse()

    semantic = SemanticAnalyzer()
    semantic.analyze(statements)

    return generate_python(statements)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate Python target code from .elokano and run it."
    )
    parser.add_argument("source", nargs="?", default="test.elokano")
    parser.add_argument("--out", default="generated_target.py")
    args = parser.parse_args()

    source_path = Path(args.source)
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    python_code = compile_file(source_path)
    out_path = Path(args.out)
    out_path.write_text(python_code, encoding="utf-8")

    print(f"Generated Python code: {out_path}")
    print("\n--- Generated Code ---")
    print(python_code, end="")
    print("--- Program Output ---")
    exec(python_code, {})


if __name__ == "__main__":
    try:
        main()
    except (LexerError, ParserError, SemanticError, FileNotFoundError) as err:
        print(f"ERROR: {err}")
