import argparse
from pathlib import Path
from typing import Dict, List, Optional

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
        if expr.op == "/":
            return f"(static_cast<double>({left}) / static_cast<double>({right}))"
        if expr.op == "//":
            return f"({left} / {right})"
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
        "#include <iomanip>",
        "#include <sstream>",
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
        "std::string elokano_format_double(double value) {",
        "    std::ostringstream oss;",
        "    oss << std::setprecision(15) << std::defaultfloat << value;",
        "    std::string text = oss.str();",
        "    if (text.find('.') == std::string::npos && text.find('e') == std::string::npos && text.find('E') == std::string::npos) {",
        "        text += \".0\";",
        "    }",
        "    return text;",
        "}",
        "",
        "void elokano_print() {",
        "    std::cout << std::endl;",
        "}",
        "",
        "void elokano_print(double value, const std::string& end = \"\\n\") {",
        "    std::cout << elokano_format_double(value) << end;",
        "}",
        "",
        "void elokano_print(bool value, const std::string& end = \"\\n\") {",
        "    std::cout << (value ? \"True\" : \"False\") << end;",
        "}",
        "",
        "template <typename T>",
        "void elokano_print(const T& value, const std::string& end = \"\\n\") {",
        "    std::cout << value << end;",
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
            value_code: Optional[str] = None
            end_code: Optional[str] = None

            if stmt.expr is not None:
                value_code = expr_to_cpp(stmt.expr)
            if stmt.end_expr is not None:
                end_code = expr_to_cpp(stmt.end_expr)

            if value_code is None and end_code is None:
                lines.append("    elokano_print();")
            elif value_code is None and end_code is not None:
                lines.append(f"    std::cout << {end_code};")
            elif value_code is not None and end_code is None:
                lines.append(f"    elokano_print({value_code});")
            else:
                lines.append(f"    elokano_print({value_code}, {end_code});")

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
