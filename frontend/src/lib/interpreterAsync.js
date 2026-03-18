/**
 * Elokano Async Interpreter — Interactive Console Mode
 *
 * Async version of the interpreter that streams output via callbacks
 * and pauses execution at Ikabil (input) to wait for user input.
 *
 * Exports: interpretAsync(ast, { onOutput, onInputRequest }) => Promise<{ error }>
 */

import { TYPE_INT, TYPE_FLOAT, TYPE_STRING, TYPE_BOOL } from './semantic.js';

const DEFAULTS = {
  [TYPE_INT]: 0,
  [TYPE_FLOAT]: 0.0,
  [TYPE_STRING]: '',
  [TYPE_BOOL]: false,
};

function formatDouble(value) {
  const text = String(value);
  if (!text.includes('.') && !text.includes('e') && !text.includes('E')) {
    return text + '.0';
  }
  return text;
}

function formatOutput(value, type) {
  if (type === TYPE_BOOL) return value ? 'True' : 'False';
  if (type === TYPE_FLOAT) return formatDouble(value);
  return String(value);
}

function processEscapes(str) {
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

class InterpreterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InterpreterError';
  }
}

/**
 * Interpret an Elokano AST interactively.
 * @param {Array} ast - list of statement nodes
 * @param {Object} callbacks
 * @param {function(string): void} callbacks.onOutput - called with each output fragment
 * @param {function(): Promise<string>} callbacks.onInputRequest - called when Ikabil needs input; must return a Promise that resolves to the user's input string
 * @returns {Promise<{ error: string|null }>}
 */
export async function interpretAsync(ast, { onOutput, onInputRequest }) {
  const scopeStack = [{}];

  function currentScope() {
    return scopeStack[scopeStack.length - 1];
  }

  function pushScope() {
    scopeStack.push({});
  }

  function popScope() {
    scopeStack.pop();
  }

  function lookupVar(name) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i][name] !== undefined) return scopeStack[i][name];
    }
    return undefined;
  }

  function runtimeError(token, message) {
    throw new InterpreterError(`${message} at line ${token.line}, column ${token.column}`);
  }

  // ── Expression evaluation (async — evalInput awaits user input) ──────

  async function evalExpr(expr) {
    switch (expr.nodeType) {
      case 'Literal':
        return evalLiteral(expr);
      case 'Identifier':
        return evalIdentifier(expr);
      case 'BinaryOp':
        return await evalBinaryOp(expr);
      case 'InputExpr':
        return await evalInput(expr);
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
    const entry = lookupVar(expr.name);
    if (!entry) {
      runtimeError(expr.token, `Variable '${expr.name}' is not declared`);
    }
    return { value: entry.value, type: entry.type };
  }

  async function evalInput(expr) {
    if (expr.prompt !== null) {
      const promptResult = await evalExpr(expr.prompt);
      onOutput(String(promptResult.value));
    }
    const line = await onInputRequest();
    return { value: line, type: TYPE_STRING };
  }

  async function evalBinaryOp(expr) {
    const left = await evalExpr(expr.left);
    const right = await evalExpr(expr.right);
    const op = expr.op;

    if (op === '+' && left.type === TYPE_STRING && right.type === TYPE_STRING) {
      return { value: left.value + right.value, type: TYPE_STRING };
    }

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

    if (op === '>') return { value: Number(left.value) > Number(right.value), type: TYPE_BOOL };
    if (op === '<') return { value: Number(left.value) < Number(right.value), type: TYPE_BOOL };
    if (op === '>=') return { value: Number(left.value) >= Number(right.value), type: TYPE_BOOL };
    if (op === '<=') return { value: Number(left.value) <= Number(right.value), type: TYPE_BOOL };

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

  // ── Statement execution (async) ──────────────────────────────────────

  async function execStatements(statements) {
    for (const stmt of statements) {
      await execStatement(stmt);
    }
  }

  async function execStatement(stmt) {
    switch (stmt.nodeType) {
      case 'Declaration':
        await execDeclaration(stmt);
        break;
      case 'Assignment':
        await execAssignment(stmt);
        break;
      case 'Output':
        await execOutput(stmt);
        break;
      case 'IfStatement':
        await execIfStatement(stmt);
        break;
    }
  }

  async function execDeclaration(stmt) {
    let value;
    let type = stmt.varType;
    if (stmt.expr !== null) {
      const result = await evalExpr(stmt.expr);
      value = coerce(result.value, result.type, type);
    } else {
      value = DEFAULTS[type];
    }
    currentScope()[stmt.name] = { value, type };
  }

  async function execAssignment(stmt) {
    const entry = lookupVar(stmt.name);
    const result = await evalExpr(stmt.expr);
    entry.value = coerce(result.value, result.type, entry.type);
  }

  async function execOutput(stmt) {
    if (stmt.expr === null && stmt.endExpr === null) {
      onOutput('\n');
      return;
    }

    if (stmt.expr !== null) {
      const result = await evalExpr(stmt.expr);
      onOutput(formatOutput(result.value, result.type));
    }

    if (stmt.endExpr !== null) {
      const endResult = await evalExpr(stmt.endExpr);
      onOutput(String(endResult.value));
    } else if (stmt.expr !== null) {
      onOutput('\n');
    }
  }

  async function execIfStatement(stmt) {
    const cond = await evalExpr(stmt.condition);
    if (cond.value) {
      pushScope();
      await execStatements(stmt.body);
      popScope();
      return;
    }

    for (const branch of stmt.elifBranches) {
      const branchCond = await evalExpr(branch.condition);
      if (branchCond.value) {
        pushScope();
        await execStatements(branch.body);
        popScope();
        return;
      }
    }

    if (stmt.elseBody !== null) {
      pushScope();
      await execStatements(stmt.elseBody);
      popScope();
    }
  }

  function coerce(value, fromType, toType) {
    if (fromType === toType) return value;
    if (toType === TYPE_FLOAT && fromType === TYPE_INT) return Number(value);
    if (fromType === TYPE_STRING && toType === TYPE_INT) return parseInt(value, 10) || 0;
    if (fromType === TYPE_STRING && toType === TYPE_FLOAT) return parseFloat(value) || 0.0;
    if (fromType === TYPE_STRING && toType === TYPE_BOOL) return value.toLowerCase() === 'true';
    return value;
  }

  // ── Run ───────────────────────────────────────────────────────────────

  try {
    await execStatements(ast);
    return { error: null };
  } catch (e) {
    if (e instanceof InterpreterError) {
      return { error: e.message };
    }
    return { error: `Internal error: ${e.message}` };
  }
}
