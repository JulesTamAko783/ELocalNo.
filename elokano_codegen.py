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


def expr_to_cpp(expr: Expr) -> str:
    if isinstance(expr, Identifier):
        return expr.name

    if isinstance(expr, Literal):
        if expr.kind == "BOOL_LIT":
            return "true" if expr.value == "true" else "false"
        return expr.value

    if isinstance(expr, BinaryOp):
        left = expr_to_cpp(expr.left)
        right = expr_to_cpp(expr.right)
        return f"({left} {expr.op} {right})"

    if isinstance(expr, InputExpr):
        if expr.prompt is None:
            return "elokano_input()"
        return f"elokano_input({expr_to_cpp(expr.prompt)})"

    raise ValueError(f"Unhandled expression type: {type(expr)}")


def elokano_type_to_cpp(elokano_type: str) -> str:
    if elokano_type == TYPE_INT:
        return "int"
    if elokano_type == TYPE_FLOAT:
        return "double"
    if elokano_type == TYPE_STRING:
        return "std::string"
    if elokano_type == TYPE_BOOL:
        return "bool"
    raise ValueError(f"Unknown type: {elokano_type}")


def generate_cpp(statements: List[Declaration | Assignment | Output]) -> str:
    lines = [
        "// Auto-generated from .elokano source",
        "#include <iostream>",
        "#include <string>",
        "",
        "std::string elokano_input(const std::string& prompt = \"\") {",
        "    if (!prompt.empty()) {",
        "        std::cout << prompt;",
        "    }",
        "    std::string line;",
        "    std::getline(std::cin, line);",
        "    return line;",
        "}",
        "",
        "int main() {",
    ]

    symbol_types: Dict[str, str] = {}

    for stmt in statements:
        if isinstance(stmt, Declaration):
            cpp_type = elokano_type_to_cpp(stmt.var_type)
            expr_code = expr_to_cpp(stmt.expr)
            lines.append(f"    {cpp_type} {stmt.name} = {expr_code};")
            symbol_types[stmt.name] = stmt.var_type
            continue

        if isinstance(stmt, Assignment):
            # Semantic analysis guarantees variable exists and type compatibility.
            _ = symbol_types[stmt.name]
            expr_code = expr_to_cpp(stmt.expr)
            lines.append(f"    {stmt.name} = {expr_code};")
            continue

        if isinstance(stmt, Output):
            lines.append(f"    std::cout << {expr_to_cpp(stmt.expr)} << std::endl;")

    lines.extend(
        [
            "    return 0;",
            "}",
            "",
        ]
    )

    return "\n".join(lines)


def compile_file(source_path: Path) -> str:
    source = source_path.read_text(encoding="utf-8-sig")
    tokens = Lexer(source).tokenize()

    parser = Parser(tokens)
    statements = parser.parse()

    semantic = SemanticAnalyzer()
    semantic.analyze(statements)

    return generate_cpp(statements)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate C++ target code from .elokano source."
    )
    parser.add_argument("source", nargs="?", default="test.elokano")
    parser.add_argument("--out", default="generated_target.cpp")
    args = parser.parse_args()

    source_path = Path(args.source)
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    cpp_code = compile_file(source_path)
    out_path = Path(args.out)
    out_path.write_text(cpp_code, encoding="utf-8")

    print(f"Generated C++ code: {out_path}")
    print("\n--- Generated Code ---")
    print(cpp_code, end="")


if __name__ == "__main__":
    try:
        main()
    except (LexerError, ParserError, SemanticError, FileNotFoundError) as err:
        print(f"ERROR: {err}")
