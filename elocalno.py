import argparse
import subprocess
from pathlib import Path

from coderun import CompileError, run as coderun_run
from main import LexerError, ParserError, SemanticError


def main() -> None:
    parser = argparse.ArgumentParser(prog="elocalno", description="Elocalno CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_parser = subparsers.add_parser("run", help="Compile and run a .elokano file")
    run_parser.add_argument("source", nargs="?", default="test.elokano")
    run_parser.add_argument("--out", default="generated_target.cpp")
    run_parser.add_argument("--exe", default="generated_target.exe")

    args = parser.parse_args()

    if args.command == "run":
        coderun_run(Path(args.source), Path(args.out), Path(args.exe))


if __name__ == "__main__":
    try:
        main()
    except (
        LexerError,
        ParserError,
        SemanticError,
        FileNotFoundError,
        CompileError,
        subprocess.CalledProcessError,
    ) as err:
        print(f"ERROR: {err}")
        raise SystemExit(1)
