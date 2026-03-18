/**
 * Elokano Lexer — Ported from main.py
 *
 * Tokenizes Elokano source code into a stream of Token objects.
 * Each token carries its type, lexeme value, line number, and column number.
 *
 * Exports: tokenize(sourceCode) => { tokens, error }
 */

// ── Token type constants ────────────────────────────────────────────────────

export const TOKEN_TYPES = {
  // Types
  TYPE_INT: 'TYPE_INT',
  TYPE_FLOAT: 'TYPE_FLOAT',
  TYPE_STRING: 'TYPE_STRING',
  TYPE_BOOL: 'TYPE_BOOL',
  // I/O
  OUTPUT: 'OUTPUT',
  INPUT: 'INPUT',
  // Control flow
  IF: 'IF',
  ELSE: 'ELSE',
  // Literals
  BOOL_LIT: 'BOOL_LIT',
  INT_LIT: 'INT_LIT',
  FLOAT_LIT: 'FLOAT_LIT',
  STRING_LIT: 'STRING_LIT',
  // Identifiers
  IDENT: 'IDENT',
  // Assignment
  ASSIGN: 'ASSIGN',
  // Delimiters
  SEMI: 'SEMI',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  COMMA: 'COMMA',
  // Arithmetic operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MUL: 'MUL',
  DIV: 'DIV',
  FLOOR_DIV: 'FLOOR_DIV',
  MOD: 'MOD',
  // Comparison operators
  GE: 'GE',
  LE: 'LE',
  NE: 'NE',
  EQ: 'EQ',
  GT: 'GT',
  LT: 'LT',
  // Special
  EOF: 'EOF',
};

// ── Keyword map ─────────────────────────────────────────────────────────────

const KEYWORDS = {
  Bilang: TOKEN_TYPES.TYPE_INT,
  Gudua: TOKEN_TYPES.TYPE_FLOAT,
  Sarsarita: TOKEN_TYPES.TYPE_STRING,
  Pudno: TOKEN_TYPES.TYPE_BOOL,
  Ibaga: TOKEN_TYPES.OUTPUT,
  Ikabil: TOKEN_TYPES.INPUT,
  nu: TOKEN_TYPES.IF,
  sabali: TOKEN_TYPES.ELSE,
  true: TOKEN_TYPES.BOOL_LIT,
  false: TOKEN_TYPES.BOOL_LIT,
};

// ── Token spec — order matters (longer matches first) ───────────────────────
// Each entry: [tokenType, regex]
// Regexes must NOT have the global flag — we use them inside a combined pattern.

const TOKEN_SPEC = [
  ['ASSIGN', /dutokan->/],
  ['SEMI', /;/],
  ['LPAREN', /\(/],
  ['RPAREN', /\)/],
  ['LBRACE', /\{/],
  ['RBRACE', /\}/],
  ['COMMA', /,/],
  ['PLUS', /\+/],
  ['MINUS', /-/],
  ['MUL', /\*/],
  ['FLOOR_DIV', /\/\//],
  ['DIV', /\//],
  ['MOD', /%/],
  ['GE', />=/],
  ['LE', /<=/],
  ['NE', /!=/],
  ['EQ', /==/],
  ['GT', />/],
  ['LT', /</],
  ['FLOAT_LIT', /\d+\.\d+/],
  ['INT_LIT', /\d+/],
  ['STRING_LIT', /"[^"\\]*(?:\\.[^"\\]*)*"/],
  ['IDENT', /[A-Za-z_][A-Za-z0-9_]*/],
  ['NEWLINE', /\n/],
  ['SKIP', /[ \t\r]+/],
  ['MISMATCH', /./],
];

// Build one combined regex with named groups.
// JavaScript named groups: (?<name>pattern)
// Since names must be unique and we reuse them, we use indexed groups instead.
function buildMasterRegex() {
  const parts = TOKEN_SPEC.map(([name], i) => {
    const src = TOKEN_SPEC[i][1].source;
    return `(?<_${i}>${src})`;
  });
  return new RegExp(parts.join('|'), 'g');
}

const MASTER_RE = buildMasterRegex();

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Tokenize Elokano source code.
 * @param {string} sourceCode - raw source text
 * @returns {{ tokens: Array<{type:string,value:string,line:number,column:number}>, error: string|null }}
 */
export function tokenize(sourceCode) {
  const tokens = [];
  let line = 1;
  let lineStart = 0;

  // Reset the regex lastIndex (global flag)
  MASTER_RE.lastIndex = 0;

  let match;
  while ((match = MASTER_RE.exec(sourceCode)) !== null) {
    // Determine which group matched
    let kind = null;
    let value = match[0];
    for (let i = 0; i < TOKEN_SPEC.length; i++) {
      if (match.groups[`_${i}`] !== undefined) {
        kind = TOKEN_SPEC[i][0];
        break;
      }
    }

    const column = match.index - lineStart + 1;

    if (kind === 'NEWLINE') {
      line++;
      lineStart = match.index + value.length;
      continue;
    }

    if (kind === 'SKIP') {
      continue;
    }

    if (kind === 'MISMATCH') {
      return {
        tokens: [],
        error: `Unexpected character ${JSON.stringify(value)} at line ${line}, column ${column}`,
      };
    }

    // Check if identifier is a keyword
    if (kind === 'IDENT' && KEYWORDS[value]) {
      tokens.push({ type: KEYWORDS[value], value, line, column });
    } else {
      tokens.push({ type: kind, value, line, column });
    }
  }

  tokens.push({ type: TOKEN_TYPES.EOF, value: '', line, column: 1 });
  return { tokens, error: null };
}
