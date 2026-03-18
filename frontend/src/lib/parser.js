/**
 * Elokano Parser — Ported from main.py
 *
 * Recursive-descent parser that converts a token stream into an AST.
 * The AST uses plain objects with a `nodeType` discriminator.
 *
 * Exports: parse(tokens) => { ast, error }
 */

// ── AST node constructors ───────────────────────────────────────────────────

/** Literal value (integer, float, string, boolean) */
export function Literal(value, kind, token) {
  return { nodeType: 'Literal', value, kind, token };
}

/** Variable reference */
export function Identifier(name, token) {
  return { nodeType: 'Identifier', name, token };
}

/** Binary operation (arithmetic, comparison, equality) */
export function BinaryOp(left, op, right, token) {
  return { nodeType: 'BinaryOp', left, op, right, token };
}

/** Input expression — Ikabil() or Ikabil(prompt) */
export function InputExpr(prompt, token) {
  return { nodeType: 'InputExpr', prompt, token };
}

/** Variable declaration with optional initializer */
export function Declaration(varType, name, expr, token) {
  return { nodeType: 'Declaration', varType, name, expr, token };
}

/** Variable assignment */
export function Assignment(name, expr, token) {
  return { nodeType: 'Assignment', name, expr, token };
}

/** Output statement — Ibaga(...) */
export function Output(expr, endExpr, token) {
  return { nodeType: 'Output', expr, endExpr, token };
}

/** Else-if branch */
export function ElifBranch(condition, body, token) {
  return { nodeType: 'ElifBranch', condition, body, token };
}

/** If / else-if / else statement */
export function IfStatement(condition, body, elifBranches, elseBody, token) {
  return { nodeType: 'IfStatement', condition, body, elifBranches, elseBody, token };
}

// ── Type token set ──────────────────────────────────────────────────────────

const TYPE_TOKENS = new Set(['TYPE_INT', 'TYPE_FLOAT', 'TYPE_STRING', 'TYPE_BOOL']);

// ── Parser ──────────────────────────────────────────────────────────────────

/**
 * Parse a token array into an AST (list of statements).
 * @param {Array} tokens - array of {type, value, line, column}
 * @returns {{ ast: Array|null, error: string|null }}
 */
export function parse(tokens) {
  let pos = 0;

  function current() {
    return tokens[pos];
  }

  function consume(expectedType) {
    const token = current();
    if (token.type !== expectedType) {
      throw new ParseError(
        `Expected ${expectedType}, got ${token.type} (${JSON.stringify(token.value)}) ` +
        `at line ${token.line}, column ${token.column}`
      );
    }
    pos++;
    return token;
  }

  function match(tokenType) {
    if (current().type === tokenType) {
      pos++;
      return true;
    }
    return false;
  }

  // ── Statement list ──────────────────────────────────────────────────────

  function statementList(until) {
    const statements = [];
    while (current().type !== until) {
      const token = current();
      if (TYPE_TOKENS.has(token.type)) {
        statements.push(...declaration());
        consume('SEMI');
      } else if (token.type === 'IF') {
        statements.push(ifStatement());
      } else {
        statements.push(statement());
        consume('SEMI');
      }
      // Skip extra semicolons
      while (match('SEMI')) { /* no-op */ }
    }
    return statements;
  }

  function parseBlock() {
    consume('LBRACE');
    const stmts = statementList('RBRACE');
    consume('RBRACE');
    return stmts;
  }

  // ── Statements ──────────────────────────────────────────────────────────

  function statement() {
    const token = current();
    if (token.type === 'OUTPUT') return outputStatement();
    if (token.type === 'IDENT') return assignment();
    throw new ParseError(
      `Invalid statement start ${JSON.stringify(token.value)} at line ${token.line}, column ${token.column}`
    );
  }

  function declaration() {
    const typeToken = current();
    pos++;
    const declarations = [];

    let nameToken = consume('IDENT');
    let expr = null;
    if (current().type === 'ASSIGN') {
      consume('ASSIGN');
      expr = expression();
    }
    declarations.push(Declaration(typeToken.value, nameToken.value, expr, typeToken));

    while (match('COMMA')) {
      nameToken = consume('IDENT');
      expr = null;
      if (current().type === 'ASSIGN') {
        consume('ASSIGN');
        expr = expression();
      }
      declarations.push(Declaration(typeToken.value, nameToken.value, expr, typeToken));
    }

    return declarations;
  }

  function ifStatement() {
    const token = consume('IF');
    consume('LPAREN');
    const condition = expression();
    consume('RPAREN');
    const body = parseBlock();

    const elifBranches = [];
    let elseBody = null;

    while (current().type === 'ELSE') {
      const elseToken = current();
      pos++;
      if (current().type === 'IF') {
        pos++;
        consume('LPAREN');
        const elifCond = expression();
        consume('RPAREN');
        const elifBody = parseBlock();
        elifBranches.push(ElifBranch(elifCond, elifBody, elseToken));
      } else {
        elseBody = parseBlock();
        break;
      }
    }

    return IfStatement(condition, body, elifBranches, elseBody, token);
  }

  function assignment() {
    const nameToken = consume('IDENT');
    consume('ASSIGN');
    const expr = expression();
    return Assignment(nameToken.value, expr, nameToken);
  }

  function outputStatement() {
    const token = consume('OUTPUT');
    let expr = null;
    let endExpr = null;

    consume('LPAREN');
    if (current().type !== 'RPAREN') {
      expr = expression();
      if (match('COMMA')) {
        endExpr = expression();
      }
    }
    consume('RPAREN');

    return Output(expr, endExpr, token);
  }

  // ── Expressions (operator precedence climbing) ──────────────────────────

  function expression() {
    return comparison();
  }

  function comparison() {
    let node = addition();
    const CMP = new Set(['GT', 'LT', 'GE', 'LE', 'EQ', 'NE']);
    while (CMP.has(current().type)) {
      const opToken = current();
      pos++;
      node = BinaryOp(node, opToken.value, addition(), opToken);
    }
    return node;
  }

  function addition() {
    let node = multiplication();
    while (current().type === 'PLUS' || current().type === 'MINUS') {
      const opToken = current();
      pos++;
      node = BinaryOp(node, opToken.value, multiplication(), opToken);
    }
    return node;
  }

  function multiplication() {
    let node = factor();
    const MUL_OPS = new Set(['MUL', 'DIV', 'FLOOR_DIV', 'MOD']);
    while (MUL_OPS.has(current().type)) {
      const opToken = current();
      pos++;
      node = BinaryOp(node, opToken.value, factor(), opToken);
    }
    return node;
  }

  function factor() {
    if (match('LPAREN')) {
      const node = expression();
      consume('RPAREN');
      return node;
    }
    return primary();
  }

  function primary() {
    const token = current();

    if (token.type === 'IDENT') {
      pos++;
      return Identifier(token.value, token);
    }

    if (['INT_LIT', 'FLOAT_LIT', 'STRING_LIT', 'BOOL_LIT'].includes(token.type)) {
      pos++;
      return Literal(token.value, token.type, token);
    }

    if (token.type === 'INPUT') {
      return inputExpression();
    }

    throw new ParseError(
      `Invalid expression token ${JSON.stringify(token.value)} at line ${token.line}, column ${token.column}`
    );
  }

  function inputExpression() {
    const token = consume('INPUT');
    let prompt = null;

    if (match('LPAREN')) {
      if (current().type !== 'RPAREN') {
        prompt = expression();
      }
      consume('RPAREN');
    }

    return InputExpr(prompt, token);
  }

  // ── Entry point ─────────────────────────────────────────────────────────

  try {
    const ast = statementList('EOF');
    consume('EOF');
    return { ast, error: null };
  } catch (e) {
    if (e instanceof ParseError) {
      return { ast: null, error: e.message };
    }
    throw e;
  }
}

// ── Error class ─────────────────────────────────────────────────────────────

class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}
