import argparse
import shutil
import subprocess
from pathlib import Path

from elokano_codegen import compile_file
from main import LexerError, ParserError, SemanticError


class CompileError(Exception):
    pass


def find_compiler() -> tuple[str, str]:
    if shutil.which("g++"):
        return "g++", "gnu"
    if shutil.which("clang++"):
        return "clang++", "clang"
    if shutil.which("cl"):
        return "cl", "msvc"
    raise CompileError("No C++ compiler found. Install g++, clang++, or cl.")


def compile_cpp(cpp_path: Path, exe_path: Path) -> None:
    compiler, family = find_compiler()

    if family in {"gnu", "clang"}:
        cmd = [compiler, "-std=c++17", str(cpp_path), "-o", str(exe_path)]
    else:
        # MSVC cl.exe output path must be /Fe:<path>
        cmd = [compiler, "/std:c++17", str(cpp_path), f"/Fe:{exe_path}"]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        details = (result.stderr or result.stdout).strip()
        raise CompileError(f"C++ compilation failed using {compiler}.\n{details}")


def run(source: Path, cpp_out: Path, exe_out: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Source file not found: {source}")

    cpp_code = compile_file(source)
    cpp_out.write_text(cpp_code, encoding="utf-8")

    compile_cpp(cpp_out, exe_out)

    print(f"[coderun] Source: {source}", flush=True)
    print(f"[coderun] Generated C++: {cpp_out}", flush=True)
    print(f"[coderun] Executable: {exe_out}", flush=True)
    print("[coderun] Output:", flush=True)

    subprocess.run([str(exe_out)], check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a .elokano program via C++ target code")
    parser.add_argument("source", nargs="?", default="test.elokano")
    parser.add_argument("--out", default="generated_target.cpp", help="Path for generated C++ file")
    parser.add_argument("--exe", default="generated_target.exe", help="Path for compiled executable")
    args = parser.parse_args()

    run(Path(args.source), Path(args.out), Path(args.exe))


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
