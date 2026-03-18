/**
 * Elokano Interpreter
 *
 * Executes an Elokano AST directly in the browser.
 * Since the original language transpiles to C++, this is a new JS-based interpreter
 * that matches the C++ runtime semantics (output formatting, type coercion, etc.).
 *
 * Input (Ikabil) is handled via a pre-supplied input buffer.
 *
 * Exports: interpret(ast, inputLines) => { output, error }
 */

import { TYPE_INT, TYPE_FLOAT, TYPE_STRING, TYPE_BOOL } from './semantic.js';

// ── Default values for each type ────────────────────────────────────────────

const DEFAULTS = {
  [TYPE_INT]: 0,
  [TYPE_FLOAT]: 0.0,
  [TYPE_STRING]: '',
  [TYPE_BOOL]: false,
};

// ── Format a float to match C++ elokano_format_double ───────────────────────
// Ensures floats display with ".0" suffix when they are whole numbers.

function formatDouble(value) {
  const text = String(value);
  if (!text.includes('.') && !text.includes('e') && !text.includes('E')) {
    return text + '.0';
  }
  return text;
}

// ── Format a value for output ───────────────────────────────────────────────

function formatOutput(value, type) {
  if (type === TYPE_BOOL) return value ? 'True' : 'False';
  if (type === TYPE_FLOAT) return formatDouble(value);
  return String(value);
}

// ── Process escape sequences in a string literal ────────────────────────────

function processEscapes(str) {
  // Remove surrounding quotes
  const inner = str.slice(1, -1);
  return inner.replace(/\\(.)/g, (_, ch) => {
    switch (ch) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case '"': return '"';
      default: return '\\' + ch;
    }
  });
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Interpret an Elokano AST.
 * @param {Array} ast - list of statement nodes
 * @param {string[]} inputLines - pre-supplied input lines (for Ikabil)
 * @returns {{ output: string, error: string|null }}
 */
export function interpret(ast, inputLines = []) {
  const variables = {};     // name → { value, type }
  const outputParts = [];   // collected output strings
  let inputIndex = 0;

  function runtimeError(token, message) {
    throw new InterpreterError(`${message} at line ${token.line}, column ${token.column}`);
  }

  // ── Expression evaluation ─────────────────────────────────────────────

  function evalExpr(expr) {
    switch (expr.nodeType) {
      case 'Literal':
        return evalLiteral(expr);
      case 'Identifier':
        return evalIdentifier(expr);
      case 'BinaryOp':
        return evalBinaryOp(expr);
      case 'InputExpr':
        return evalInput(expr);
      default:
        throw new InterpreterError('Unknown expression node type');
    }
  }

  function evalLiteral(expr) {
    switch (expr.kind) {
      case 'INT_LIT':
        return { value: parseInt(expr.value, 10), type: TYPE_INT };
      case 'FLOAT_LIT':
        return { value: parseFloat(expr.value), type: TYPE_FLOAT };
      case 'STRING_LIT':
        return { value: processEscapes(expr.value), type: TYPE_STRING };
      case 'BOOL_LIT':
        return { value: expr.value === 'true', type: TYPE_BOOL };
      default:
        return { value: expr.value, type: TYPE_STRING };
    }
  }

  function evalIdentifier(expr) {
    const entry = variables[expr.name];
    if (!entry) {
      runtimeError(expr.token, `Variable '${expr.name}' is not declared`);
    }
    return { value: entry.value, type: entry.type };
  }

  function evalInput(expr) {
    // Show prompt if present
    if (expr.prompt !== null) {
      const promptResult = evalExpr(expr.prompt);
      outputParts.push(String(promptResult.value));
    }
    // Read from input buffer
    if (inputIndex < inputLines.length) {
      const line = inputLines[inputIndex++];
      return { value: line, type: TYPE_STRING };
    }
    return { value: '', type: TYPE_STRING };
  }

  function evalBinaryOp(expr) {
    const left = evalExpr(expr.left);
    const right = evalExpr(expr.right);
    const op = expr.op;

    // String concatenation
    if (op === '+' && left.type === TYPE_STRING && right.type === TYPE_STRING) {
      return { value: left.value + right.value, type: TYPE_STRING };
    }

    // Arithmetic
    if (op === '+' || op === '-' || op === '*') {
      const lv = Number(left.value);
      const rv = Number(right.value);
      let result;
      if (op === '+') result = lv + rv;
      else if (op === '-') result = lv - rv;
      else result = lv * rv;

      const resultType = (left.type === TYPE_FLOAT || right.type === TYPE_FLOAT) ? TYPE_FLOAT : TYPE_INT;
      return { value: resultType === TYPE_INT ? Math.trunc(result) : result, type: resultType };
    }

    if (op === '/') {
      const rv = Number(right.value);
      if (rv === 0) runtimeError(expr.token, 'Division by zero');
      return { value: Number(left.value) / rv, type: TYPE_FLOAT };
    }

    if (op === '//') {
      const rv = Number(right.value);
      if (rv === 0) runtimeError(expr.token, 'Division by zero');
      return { value: Math.trunc(Number(left.value) / rv), type: TYPE_INT };
    }

    if (op === '%') {
      const rv = Number(right.value);
      if (rv === 0) runtimeError(expr.token, 'Modulo by zero');
      return { value: Number(left.value) % rv, type: TYPE_INT };
    }

    // Comparison operators
    if (op === '>') return { value: Number(left.value) > Number(right.value), type: TYPE_BOOL };
    if (op === '<') return { value: Number(left.value) < Number(right.value), type: TYPE_BOOL };
    if (op === '>=') return { value: Number(left.value) >= Number(right.value), type: TYPE_BOOL };
    if (op === '<=') return { value: Number(left.value) <= Number(right.value), type: TYPE_BOOL };

    // Equality
    if (op === '==') {
      if (left.type === right.type) return { value: left.value === right.value, type: TYPE_BOOL };
      return { value: Number(left.value) === Number(right.value), type: TYPE_BOOL };
    }
    if (op === '!=') {
      if (left.type === right.type) return { value: left.value !== right.value, type: TYPE_BOOL };
      return { value: Number(left.value) !== Number(right.value), type: TYPE_BOOL };
    }

    runtimeError(expr.token, `Unknown operator '${op}'`);
  }

  // ── Statement execution ───────────────────────────────────────────────

  function execStatements(statements) {
    for (const stmt of statements) {
      execStatement(stmt);
    }
  }

  function execStatement(stmt) {
    switch (stmt.nodeType) {
      case 'Declaration':
        execDeclaration(stmt);
        break;
      case 'Assignment':
        execAssignment(stmt);
        break;
      case 'Output':
        execOutput(stmt);
        break;
      case 'IfStatement':
        execIfStatement(stmt);
        break;
    }
  }

  function execDeclaration(stmt) {
    let value;
    let type = stmt.varType;
    if (stmt.expr !== null) {
      const result = evalExpr(stmt.expr);
      value = coerce(result.value, result.type, type);
    } else {
      value = DEFAULTS[type];
    }
    variables[stmt.name] = { value, type };
  }

  function execAssignment(stmt) {
    const entry = variables[stmt.name];
    const result = evalExpr(stmt.expr);
    entry.value = coerce(result.value, result.type, entry.type);
  }

  function execOutput(stmt) {
    if (stmt.expr === null && stmt.endExpr === null) {
      // Ibaga() — blank newline
      outputParts.push('\n');
      return;
    }

    if (stmt.expr !== null) {
      const result = evalExpr(stmt.expr);
      outputParts.push(formatOutput(result.value, result.type));
    }

    // Determine end string
    if (stmt.endExpr !== null) {
      const endResult = evalExpr(stmt.endExpr);
      outputParts.push(String(endResult.value));
    } else if (stmt.expr !== null) {
      outputParts.push('\n'); // default newline
    }
  }

  function execIfStatement(stmt) {
    const cond = evalExpr(stmt.condition);
    if (cond.value) {
      execStatements(stmt.body);
      return;
    }

    for (const branch of stmt.elifBranches) {
      const branchCond = evalExpr(branch.condition);
      if (branchCond.value) {
        execStatements(branch.body);
        return;
      }
    }

    if (stmt.elseBody !== null) {
      execStatements(stmt.elseBody);
    }
  }

  // ── Type coercion (Bilang → Gudua) ───────────────────────────────────

  function coerce(value, fromType, toType) {
    if (fromType === toType) return value;
    if (toType === TYPE_FLOAT && fromType === TYPE_INT) return Number(value);
    return value;
  }

  // ── Run ───────────────────────────────────────────────────────────────

  try {
    execStatements(ast);
    return { output: outputParts.join(''), error: null };
  } catch (e) {
    if (e instanceof InterpreterError) {
      return { output: outputParts.join(''), error: e.message };
    }
    return { output: outputParts.join(''), error: `Internal error: ${e.message}` };
  }
}

class InterpreterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InterpreterError';
  }
}
