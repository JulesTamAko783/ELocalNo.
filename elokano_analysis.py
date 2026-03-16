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


SEPARATOR = "=" * 60


# ---------------------------------------------------------------------------
# Lexical Analysis
# ---------------------------------------------------------------------------

def print_lexical_analysis(tokens: List[Token]) -> None:
    print(SEPARATOR)
    print("  LEXICAL ANALYSIS")
    print(SEPARATOR)
    visible = [t for t in tokens if t.type != "EOF"]
    if not visible:
        print("  Status: OK (no tokens - empty program)")
        return
    print("  Status: OK")
    print(f"  Tokens generated: {len(visible)}\n")
    for tok in visible:
        print(f"    [{tok.line}:{tok.column}]  {tok.type:<14} {tok.value!r}")


# ---------------------------------------------------------------------------
# Syntax Analysis (AST Tree)
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
        total = 1 + len(stmt.elif_branches) + (1 if stmt.else_body is not None else 0)
        idx = 0

        idx += 1
        branch_last = idx == total
        branch_conn = "`-- " if branch_last else "|-- "
        branch_child = child_prefix + ("    " if branch_last else "|   ")
        result += f"{child_prefix}{branch_conn}If: {expr_str(stmt.condition)}\n"
        for i, s in enumerate(stmt.body):
            result += format_statement(s, branch_child, i == len(stmt.body) - 1)

        for elif_branch in stmt.elif_branches:
            idx += 1
            branch_last = idx == total
            branch_conn = "`-- " if branch_last else "|-- "
            branch_child = child_prefix + ("    " if branch_last else "|   ")
            result += f"{child_prefix}{branch_conn}ElseIf: {expr_str(elif_branch.condition)}\n"
            for i, s in enumerate(elif_branch.body):
                result += format_statement(s, branch_child, i == len(elif_branch.body) - 1)

        if stmt.else_body is not None:
            branch_conn = "`-- "
            branch_child = child_prefix + "    "
            result += f"{child_prefix}{branch_conn}Else\n"
            for i, s in enumerate(stmt.else_body):
                result += format_statement(s, branch_child, i == len(stmt.else_body) - 1)

        return result

    return f"{prefix}{connector}Unknown statement\n"


def print_syntax_analysis(statements: List[Statement]) -> None:
    print("\n" + SEPARATOR)
    print("  SYNTAX ANALYSIS")
    print(SEPARATOR)
    if not statements:
        print("  Status: OK (empty program)")
        return
    print("  Status: OK\n")
    print("  Program")
    for i, stmt in enumerate(statements):
        lines = format_statement(stmt, "", i == len(statements) - 1).rstrip("\n").split("\n")
        for line in lines:
            print(f"  {line}")


# ---------------------------------------------------------------------------
# Semantic Analysis (Symbol Table)
# ---------------------------------------------------------------------------

def print_semantic_analysis(semantic: SemanticAnalyzer) -> None:
    print("\n" + SEPARATOR)
    print("  SEMANTIC ANALYSIS")
    print(SEPARATOR)
    print("  Status: OK\n")
    if not semantic.symbol_table:
        print("  Symbol Table: (empty)")
        return
    print("  Symbol Table:")
    for entry in semantic.symbol_table:
        print(f"    {entry.name} : {entry.var_type}  (line {entry.line}, col {entry.column})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Show Lexical, Syntax, and Semantic analysis of an .elokano source file."
    )
    ap.add_argument("source", nargs="?", default="test.elokano")
    args = ap.parse_args()

    source_path = Path(args.source)
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    source = source_path.read_text(encoding="utf-8-sig")

    print(f"\n  Source: {source_path}\n")

    # Phase 1 — Lexical Analysis
    lexer = Lexer(source)
    tokens = lexer.tokenize()
    print_lexical_analysis(tokens)

    # Phase 2 — Syntax Analysis
    p = Parser(tokens)
    statements = p.parse()
    print_syntax_analysis(statements)

    # Phase 3 — Semantic Analysis
    semantic = SemanticAnalyzer()
    semantic.analyze(statements)
    print_semantic_analysis(semantic)

    print()


if __name__ == "__main__":
    try:
        main()
    except (LexerError, ParserError, SemanticError, FileNotFoundError) as err:
        print(f"\n  ERROR: {err}")
