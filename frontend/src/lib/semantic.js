/**
 * Elokano Semantic Analyzer — Ported from main.py
 *
 * Performs type checking, symbol resolution, and semantic validation on the AST.
 * Maintains a symbol table for variable declarations.
 *
 * Exports: analyze(ast) => { symbols, symbolTable, errors }
 */

// ── Elokano type constants ──────────────────────────────────────────────────

export const TYPE_INT = 'Bilang';
export const TYPE_FLOAT = 'Gudua';
export const TYPE_STRING = 'Sarsarita';
export const TYPE_BOOL = 'Pudno';

// ── Type weights (sizes in bytes, matching C++ target) ──────────────────────

export const TYPE_WEIGHTS = {
  [TYPE_INT]: 4,
  [TYPE_FLOAT]: 8,
  [TYPE_STRING]: 32,
  [TYPE_BOOL]: 1,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function isNumeric(type) {
  return type === TYPE_INT || type === TYPE_FLOAT;
}

function isAssignable(targetType, valueType) {
  if (targetType === valueType) return true;
  // Gudua (float) can accept Bilang (int) values
  return targetType === TYPE_FLOAT && valueType === TYPE_INT;
}

function isZeroNumericLiteral(expr) {
  if (expr.nodeType !== 'Literal') return false;
  if (expr.kind === 'INT_LIT') return parseInt(expr.value, 10) === 0;
  if (expr.kind === 'FLOAT_LIT') return parseFloat(expr.value) === 0.0;
  return false;
}

function isZeroIntLiteral(expr) {
  return expr.nodeType === 'Literal' && expr.kind === 'INT_LIT' && parseInt(expr.value, 10) === 0;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze an AST for semantic correctness.
 * @param {Array} ast - list of statement nodes from the parser
 * @returns {{ symbols: Object, symbolTable: Array, errors: Array<string> }}
 *   symbols: { name → elokanoType }
 *   symbolTable: [{ name, varType, line, column }]
 *   errors: list of human-readable error strings (empty = pass)
 */
export function analyze(ast) {
  const scopeStack = [{}];     // stack of scope maps; scopeStack[0] is global
  const symbolTable = [];      // ordered list of declarations
  const errors = [];           // collected error messages
  const offsetStack = [0];     // independent offset counter per scope level

  function currentScope() {
    return scopeStack[scopeStack.length - 1];
  }

  function pushScope() {
    scopeStack.push({});
    offsetStack.push(0);  // Reset Rule: new scope starts at offset 0
  }

  function popScope() {
    scopeStack.pop();
    offsetStack.pop();    // discard inner offset; parent resumes automatically
  }

  function lookupSymbol(name) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i][name] !== undefined) return scopeStack[i][name];
    }
    return undefined;
  }

  function addError(token, message) {
    errors.push(`${message} at line ${token.line}, column ${token.column}`);
  }

  // ── Statement analysis ────────────────────────────────────────────────

  function analyzeStatements(statements) {
    for (const stmt of statements) {
      switch (stmt.nodeType) {
        case 'Declaration':
          analyzeDeclaration(stmt);
          break;
        case 'Assignment':
          analyzeAssignment(stmt);
          break;
        case 'Output':
          analyzeOutput(stmt);
          break;
        case 'IfStatement':
          analyzeIfStatement(stmt);
          break;
      }
    }
  }

  function analyzeDeclaration(stmt) {
    if (currentScope()[stmt.name] !== undefined) {
      addError(stmt.token, `Variable ${JSON.stringify(stmt.name)} already declared`);
      return;
    }

    if (stmt.expr !== null) {
      const exprType = inferExprType(stmt.expr);
      // InputExpr (Ikabil) returns Sarsarita but is coerced to the target type at runtime
      if (exprType && stmt.expr.nodeType !== 'InputExpr' && !isAssignable(stmt.varType, exprType)) {
        addError(
          stmt.token,
          `Type mismatch in declaration of ${JSON.stringify(stmt.name)}: expected ${stmt.varType}, got ${exprType}`
        );
      }
    }

    currentScope()[stmt.name] = stmt.varType;
    const level = scopeStack.length - 1;
    const scope = level === 0 ? 'Level 0 (Global)' : `Level ${level} (Local)`;
    const weight = TYPE_WEIGHTS[stmt.varType] || 0;
    const offset = offsetStack[offsetStack.length - 1];
    offsetStack[offsetStack.length - 1] += weight;
    symbolTable.push({
      name: stmt.name,
      varType: stmt.varType,
      scope,
      offset,
      weight,
      line: stmt.token.line,
      column: stmt.token.column,
    });
  }

  function analyzeAssignment(stmt) {
    if (lookupSymbol(stmt.name) === undefined) {
      addError(stmt.token, `Variable ${JSON.stringify(stmt.name)} is not declared`);
      return;
    }

    const varType = lookupSymbol(stmt.name);
    const exprType = inferExprType(stmt.expr);

    // InputExpr (Ikabil) returns Sarsarita but is coerced to the target type at runtime
    if (exprType && stmt.expr.nodeType !== 'InputExpr' && !isAssignable(varType, exprType)) {
      addError(
        stmt.token,
        `Type mismatch in assignment to ${JSON.stringify(stmt.name)}: expected ${varType}, got ${exprType}`
      );
    }
  }

  function analyzeOutput(stmt) {
    if (stmt.expr !== null) {
      inferExprType(stmt.expr);
    }
    if (stmt.endExpr !== null) {
      const endType = inferExprType(stmt.endExpr);
      if (endType && endType !== TYPE_STRING) {
        addError(stmt.token, `Ibaga end argument must be ${TYPE_STRING}, got ${endType}`);
      }
    }
  }

  function analyzeIfStatement(stmt) {
    const condType = inferExprType(stmt.condition);
    if (condType && condType !== TYPE_BOOL) {
      addError(stmt.token, `If condition must be ${TYPE_BOOL}, got ${condType}`);
    }
    pushScope();
    analyzeStatements(stmt.body);
    popScope();

    for (const branch of stmt.elifBranches) {
      const branchCondType = inferExprType(branch.condition);
      if (branchCondType && branchCondType !== TYPE_BOOL) {
        addError(branch.token, `Else-if condition must be ${TYPE_BOOL}, got ${branchCondType}`);
      }
      pushScope();
      analyzeStatements(branch.body);
      popScope();
    }

    if (stmt.elseBody !== null) {
      pushScope();
      analyzeStatements(stmt.elseBody);
      popScope();
    }
  }

  // ── Expression type inference ─────────────────────────────────────────

  function inferExprType(expr) {
    if (expr.nodeType === 'Literal') {
      if (expr.kind === 'INT_LIT') return TYPE_INT;
      if (expr.kind === 'FLOAT_LIT') return TYPE_FLOAT;
      if (expr.kind === 'STRING_LIT') return TYPE_STRING;
      return TYPE_BOOL; // BOOL_LIT
    }

    if (expr.nodeType === 'Identifier') {
      if (lookupSymbol(expr.name) === undefined) {
        addError(expr.token, `Variable ${JSON.stringify(expr.name)} is not declared`);
        return null;
      }
      return lookupSymbol(expr.name);
    }

    if (expr.nodeType === 'InputExpr') {
      if (expr.prompt !== null) {
        const promptType = inferExprType(expr.prompt);
        if (promptType && promptType !== TYPE_STRING) {
          addError(expr.token, `Ikabil prompt must be ${TYPE_STRING}, got ${promptType}`);
        }
      }
      return TYPE_STRING; // Ikabil always returns Sarsarita
    }

    if (expr.nodeType === 'BinaryOp') {
      const leftType = inferExprType(expr.left);
      const rightType = inferExprType(expr.right);
      if (!leftType || !rightType) return null; // prior error
      const op = expr.op;

      // Addition: string concat or numeric add
      if (op === '+') {
        if (leftType === TYPE_STRING && rightType === TYPE_STRING) return TYPE_STRING;
        if (isNumeric(leftType) && isNumeric(rightType)) {
          return (leftType === TYPE_FLOAT || rightType === TYPE_FLOAT) ? TYPE_FLOAT : TYPE_INT;
        }
        addError(
          expr.token,
          `Operator '+' requires both operands numeric or both ${TYPE_STRING} (got ${leftType} and ${rightType})`
        );
        return null;
      }

      // Subtraction, multiplication, division
      if (op === '-' || op === '*' || op === '/') {
        if (!(isNumeric(leftType) && isNumeric(rightType))) {
          addError(expr.token, `Operator '${op}' requires numeric operands (got ${leftType} and ${rightType})`);
          return null;
        }
        if (op === '/' && isZeroNumericLiteral(expr.right)) {
          addError(expr.token, 'Division by zero is not allowed');
          return null;
        }
        if (op === '/') return TYPE_FLOAT;
        return (leftType === TYPE_FLOAT || rightType === TYPE_FLOAT) ? TYPE_FLOAT : TYPE_INT;
      }

      // Floor division, modulo — require Bilang
      if (op === '//' || op === '%') {
        if (leftType !== TYPE_INT || rightType !== TYPE_INT) {
          addError(expr.token, `Operator '${op}' requires ${TYPE_INT} operands (got ${leftType} and ${rightType})`);
          return null;
        }
        if (isZeroIntLiteral(expr.right)) {
          addError(expr.token, `Operator '${op}' with zero divisor is not allowed`);
          return null;
        }
        return TYPE_INT;
      }

      // Comparison operators — require numeric, return Pudno
      if (op === '>' || op === '<' || op === '>=' || op === '<=') {
        if (!(isNumeric(leftType) && isNumeric(rightType))) {
          addError(expr.token, `Operator '${op}' requires numeric operands (got ${leftType} and ${rightType})`);
          return null;
        }
        return TYPE_BOOL;
      }

      // Equality operators — require matching types (or both numeric), return Pudno
      if (op === '==' || op === '!=') {
        if (!(leftType === rightType || (isNumeric(leftType) && isNumeric(rightType)))) {
          addError(expr.token, `Operator '${op}' requires matching types (got ${leftType} and ${rightType})`);
          return null;
        }
        return TYPE_BOOL;
      }

      addError(expr.token, `Unknown operator ${JSON.stringify(op)}`);
      return null;
    }

    return null; // unknown node type
  }

  // ── Run analysis ──────────────────────────────────────────────────────

  analyzeStatements(ast);

  // Build flat symbols map from global scope for backward compatibility
  const symbols = scopeStack[0];
  return { symbols, symbolTable, errors };
}
