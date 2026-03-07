import argparse
import subprocess
import sys
from pathlib import Path

from elokano_codegen import compile_file
from main import LexerError, ParserError, SemanticError


def run(source: Path, out: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Source file not found: {source}")

    python_code = compile_file(source)
    out.write_text(python_code, encoding="utf-8")

    print(f"[coderun] Source: {source}", flush=True)
    print(f"[coderun] Generated: {out}", flush=True)
    print("[coderun] Output:", flush=True)
    subprocess.run([sys.executable, str(out)], check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a .elokano program")
    parser.add_argument("source", nargs="?", default="test.elokano")
    parser.add_argument("--out", default="generated_target.py")
    args = parser.parse_args()

    run(Path(args.source), Path(args.out))


if __name__ == "__main__":
    try:
        main()
    except (
        LexerError,
        ParserError,
        SemanticError,
        FileNotFoundError,
        subprocess.CalledProcessError,
    ) as err:
        print(f"ERROR: {err}")
        raise SystemExit(1)
