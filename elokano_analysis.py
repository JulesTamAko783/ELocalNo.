import argparse
from pathlib import Path
from typing import List

from main import (
    Assignment,
    BinaryOp,
    Declaration,
    ElifBranch,
    Expr,
    Identifier,
    IfStatement,
    InputExpr,
    Lexer,
    LexerError,
    Literal,
    Output,
    Parser,
    ParserError,
    SemanticAnalyzer,
    SemanticError,
    Statement,
    SymbolEntry,
    Token,
)


# ---------------------------------------------------------------------------
# Lexical Analysis display
# ---------------------------------------------------------------------------

def print_lexical_analysis(tokens: List[Token]) -> None:
    print("=" * 70)
    print("LEXICAL ANALYSIS (Tokenization)")
    print("=" * 70)
    print(f"{'TOKEN TYPE':<14} {'VALUE':<30} {'LINE':<6} {'COL':<6}")
    print("-" * 70)
    for tok in tokens:
        print(f"{tok.type:<14} {tok.value!r:<30} {tok.line:<6} {tok.column:<6}")
    print(f"\nTotal tokens: {len(tokens)}")


# ---------------------------------------------------------------------------
# Syntax Analysis display (AST tree)
# ---------------------------------------------------------------------------

def expr_str(expr: Expr) -> str:
    if isinstance(expr, Literal):
        return expr.value
    if isinstance(expr, Identifier):
        return expr.name
    if isinstance(expr, BinaryOp):
        return f"({expr_str(expr.left)} {expr.op} {expr_str(expr.right)})"
    if isinstance(expr, InputExpr):
        if expr.prompt is None:
            return "Ikabil()"
        return f"Ikabil({expr_str(expr.prompt)})"
    return "?"


def print_ast_node(prefix: str, label: str, is_last: bool, children_fn=None) -> str:
    connector = "└── " if is_last else "├── "
    child_prefix = prefix + ("    " if is_last else "│   ")
    result = f"{prefix}{connector}{label}\n"
    if children_fn:
        result += children_fn(child_prefix)
    return result


def format_statement(stmt: Statement, prefix: str, is_last: bool) -> str:
    connector = "`-- " if is_last else "|-- "
    child_prefix = prefix + ("    " if is_last else "|   ")

    if isinstance(stmt, Declaration):
        if stmt.expr is not None:
            label = f"Declaration: {stmt.var_type} {stmt.name} = {expr_str(stmt.expr)}"
        else:
            label = f"Declaration: {stmt.var_type} {stmt.name} (default)"
        return f"{prefix}{connector}{label}\n"

    if isinstance(stmt, Assignment):
        label = f"Assignment: {stmt.name} = {expr_str(stmt.expr)}"
        return f"{prefix}{connector}{label}\n"

    if isinstance(stmt, Output):
        parts = []
        if stmt.expr is not None:
            parts.append(expr_str(stmt.expr))
        if stmt.end_expr is not None:
            parts.append(expr_str(stmt.end_expr))
        label = f"Output: Ibaga({', '.join(parts)})"
        return f"{prefix}{connector}{label}\n"

    if isinstance(stmt, IfStatement):
        result = f"{prefix}{connector}IfStatement\n"
        # Count total children for is_last tracking
        total = 1 + len(stmt.elif_branches) + (1 if stmt.else_body is not None else 0)
        idx = 0

        # If branch
        idx += 1
        branch_last = idx == total
        branch_conn = "`-- " if branch_last else "|-- "
        branch_child = child_prefix + ("    " if branch_last else "|   ")
        result += f"{child_prefix}{branch_conn}If: {expr_str(stmt.condition)}\n"
        for i, s in enumerate(stmt.body):
            result += format_statement(s, branch_child, i == len(stmt.body) - 1)

        # Elif branches
        for elif_branch in stmt.elif_branches:
            idx += 1
            branch_last = idx == total
            branch_conn = "`-- " if branch_last else "|-- "
            branch_child = child_prefix + ("    " if branch_last else "|   ")
            result += f"{child_prefix}{branch_conn}ElseIf: {expr_str(elif_branch.condition)}\n"
            for i, s in enumerate(elif_branch.body):
                result += format_statement(s, branch_child, i == len(elif_branch.body) - 1)

        # Else branch
        if stmt.else_body is not None:
            idx += 1
            branch_conn = "`-- "
            branch_child = child_prefix + "    "
            result += f"{child_prefix}{branch_conn}Else\n"
            for i, s in enumerate(stmt.else_body):
                result += format_statement(s, branch_child, i == len(stmt.else_body) - 1)

        return result

    return f"{prefix}{connector}Unknown statement\n"


def print_syntax_analysis(statements: List[Statement]) -> None:
    print("\n" + "=" * 70)
    print("SYNTAX ANALYSIS (Abstract Syntax Tree)")
    print("=" * 70)
    print("Program")
    for i, stmt in enumerate(statements):
        print(format_statement(stmt, "", i == len(statements) - 1), end="")


# ---------------------------------------------------------------------------
# Semantic Analysis display (Symbol Table + Validation)
# ---------------------------------------------------------------------------

def print_symbol_table(symbol_table: List[SymbolEntry]) -> None:
    print("\n" + "=" * 70)
    print("SYMBOL TABLE")
    print("=" * 70)
    print(f"{'#':<4} {'NAME':<16} {'TYPE':<14} {'LINE':<6} {'COL':<6}")
    print("-" * 70)
    for i, entry in enumerate(symbol_table, 1):
        print(f"{i:<4} {entry.name:<16} {entry.var_type:<14} {entry.line:<6} {entry.column:<6}")
    print(f"\nTotal symbols: {len(symbol_table)}")


def print_semantic_analysis(semantic: SemanticAnalyzer) -> None:
    print("\n" + "=" * 70)
    print("SEMANTIC ANALYSIS (Type Checking)")
    print("=" * 70)
    print("All type checks passed.")
    print_symbol_table(semantic.symbol_table)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Show Lexical, Syntax, and Semantic analysis of an .elokano source file."
    )
    parser.add_argument("source", nargs="?", default="test.elokano")
    args = parser.parse_args()

    source_path = Path(args.source)
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    source = source_path.read_text(encoding="utf-8-sig")

    # Phase 1: Lexical Analysis
    print(f"Source file: {source_path}\n")
    lexer = Lexer(source)
    tokens = lexer.tokenize()
    print_lexical_analysis(tokens)

    # Phase 2: Syntax Analysis
    p = Parser(tokens)
    statements = p.parse()
    print_syntax_analysis(statements)

    # Phase 3: Semantic Analysis
    semantic = SemanticAnalyzer()
    semantic.analyze(statements)
    print_semantic_analysis(semantic)


if __name__ == "__main__":
    try:
        main()
    except (LexerError, ParserError, SemanticError, FileNotFoundError) as err:
        print(f"\nERROR: {err}")
