# Elokano Language Cheatsheet

> File extension: `.elokano` | Run: `python coderun.py file.elokano --out out.cpp --exe out.exe`

---

## Data Types

| Type        | Description | Default | Size    | Example                            |
|-------------|-------------|---------|---------|------------------------------------|
| `Bilang`    | Integer     | `0`     | 4 bytes | `Bilang x dutokan-> 10;`          |
| `Gudua`     | Float/Double| `0.0`   | 8 bytes | `Gudua pi dutokan-> 3.14;`        |
| `Sarsarita` | String      | `""`    | 32 bytes| `Sarsarita s dutokan-> "hello";`   |
| `Pudno`     | Boolean     | `false` | 1 byte  | `Pudno flag dutokan-> true;`       |

## Variables

```elokano
Bilang age dutokan-> 21;                         // declare + assign
Sarsarita name;                                  // declare with default ""
Bilang x dutokan-> 1, y dutokan-> 2, z;          // multi-declare
age dutokan-> 25;                                // reassign
```

- `dutokan->` is the assignment operator
- Every statement ends with `;`
- `Gudua` can receive `Bilang` values; other type mismatches are errors

## Operators

| Category    | Operators                                        |
|-------------|--------------------------------------------------|
| Arithmetic  | `+`  `-`  `*`  `/` (float div)  `//` (int div)  `%` (mod) |
| Comparison  | `==`  `!=`  `>`  `<`  `>=`  `<=`                |
| String      | `+` (concatenation)                              |

- `/` always returns `Gudua`; `//` and `%` require `Bilang` operands
- Comparisons return `Pudno` (boolean)

## Input / Output

```elokano
Ibaga("Hello World");                   // print with newline
Ibaga("No newline", "");                // print with custom ending
Ibaga("Tab end", "\t");                 // print ending with tab
Ibaga();                                // print blank line

Sarsarita name dutokan-> Ikabil("Enter name: ");   // input with prompt
Sarsarita raw dutokan-> Ikabil;                     // input without prompt
```

## Control Flow (if / else-if / else)

```elokano
nu (x > 10) {
    Ibaga("big");
}
sabali nu (x == 10) {
    Ibaga("ten");
}
sabali {
    Ibaga("small");
}
```

| Keyword     | Meaning  |
|-------------|----------|
| `nu`        | if       |
| `sabali nu` | else if  |
| `sabali`    | else     |

- Conditions must evaluate to `Pudno`
- No `;` after closing `}`
- Blocks create their own scope (inner variables are not visible outside)

## Scoping

```elokano
Bilang a dutokan-> 10;          // outer scope
nu (a > 5) {
    Bilang b dutokan-> 20;      // inner scope only
    Ibaga(a);                   // can access outer 'a'
}
                                // 'b' is NOT accessible here
```

## Escape Sequences (in strings)

`\n` newline | `\t` tab | `\\` backslash | `\"` quote

## Complete Example

```elokano
Sarsarita name dutokan-> Ikabil("What is your name? ");
Bilang x dutokan-> 10, y dutokan-> 5;

Gudua result dutokan-> ((x + y) * 2) / 3;
Bilang quotient dutokan-> y // 2;
Bilang remainder dutokan-> y % 2;

Ibaga("Hello, " + name);
Ibaga("Result: " + result);

nu (x > y) {
    Ibaga("x is greater");
}
sabali nu (x == y) {
    Ibaga("x equals y");
}
sabali {
    Ibaga("y is greater");
}
```

## How to Run

```bash
python coderun.py myfile.elokano --out output.cpp --exe output.exe   # full pipeline
python elokano_analysis.py myfile.elokano                            # analysis only
python elokano_codegen.py myfile.elokano --out output.cpp            # generate C++ only
```

---

*Elokano compiles to C++ which is then compiled with g++/clang++/MSVC.*
