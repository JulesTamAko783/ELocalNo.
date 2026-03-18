import React, { useState, useMemo, useCallback } from 'react';

/**
 * Syntax Analysis panel — displays the AST as an interactive collapsible tree
 * and optionally as raw JSON.
 */

// ── Expression to string (for display) ──────────────────────────────────────

function exprStr(expr) {
  if (!expr) return '(null)';
  switch (expr.nodeType) {
    case 'Literal':
      return expr.value;
    case 'Identifier':
      return expr.name;
    case 'BinaryOp':
      return `(${exprStr(expr.left)} ${expr.op} ${exprStr(expr.right)})`;
    case 'InputExpr':
      return expr.prompt ? `Ikabil(${exprStr(expr.prompt)})` : 'Ikabil()';
    default:
      return '?';
  }
}

// ── AST Node component (recursive, collapsible) ────────────────────────────

function ASTNode({ node, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 3);

  const { label, colorClass, children } = useMemo(() => {
    const result = { label: '', colorClass: '', children: [] };

    switch (node.nodeType) {
      case 'Declaration':
        result.label = node.expr
          ? `Declaration: ${node.varType} ${node.name} = ${exprStr(node.expr)}`
          : `Declaration: ${node.varType} ${node.name} (default)`;
        result.colorClass = 'ast-declaration';
        break;

      case 'Assignment':
        result.label = `Assignment: ${node.name} = ${exprStr(node.expr)}`;
        result.colorClass = 'ast-statement';
        break;

      case 'Output': {
        const parts = [];
        if (node.expr) parts.push(exprStr(node.expr));
        if (node.endExpr) parts.push(exprStr(node.endExpr));
        result.label = `Output: Ibaga(${parts.join(', ')})`;
        result.colorClass = 'ast-statement';
        break;
      }

      case 'IfStatement':
        result.label = 'IfStatement';
        result.colorClass = 'ast-statement';
        result.children.push({
          label: `If: ${exprStr(node.condition)}`,
          colorClass: 'ast-expression',
          body: node.body,
        });
        for (const branch of (node.elifBranches || [])) {
          result.children.push({
            label: `ElseIf: ${exprStr(branch.condition)}`,
            colorClass: 'ast-expression',
            body: branch.body,
          });
        }
        if (node.elseBody) {
          result.children.push({
            label: 'Else',
            colorClass: 'ast-expression',
            body: node.elseBody,
          });
        }
        break;

      default:
        result.label = `Unknown: ${node.nodeType}`;
        result.colorClass = '';
    }

    return result;
  }, [node]);

  const hasChildren = children.length > 0;
  const indent = depth > 0;

  return (
    <div className={indent ? 'ast-node' : ''}>
      <div
        className={`flex items-start gap-1 py-0.5 cursor-pointer hover:bg-[rgba(139,115,85,0.06)] rounded-sm ${colorClass}`}
        onClick={() => hasChildren && setCollapsed(!collapsed)}
        role={hasChildren ? 'button' : undefined}
        aria-expanded={hasChildren ? !collapsed : undefined}
        aria-label={label}
      >
        {hasChildren && (
          <span className="text-[var(--color-stone)] text-xs select-none w-4 text-center flex-shrink-0 mt-0.5">
            {collapsed ? '\u25B6' : '\u25BC'}
          </span>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}
        <span className="ast-label">{label}</span>
      </div>

      {!collapsed && children.map((child, i) => (
        <div key={i} className="ast-node">
          <div className={`ast-label py-0.5 ${child.colorClass}`}>{child.label}</div>
          {child.body && child.body.map((stmt, j) => (
            <ASTNode key={j} node={stmt} depth={depth + 2} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Strip tokens from AST for clean JSON display ────────────────────────────

function stripTokens(obj) {
  if (Array.isArray(obj)) return obj.map(stripTokens);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'token') continue;
      result[key] = stripTokens(value);
    }
    return result;
  }
  return obj;
}

// ── Main Panel ──────────────────────────────────────────────────────────────

export default function ParserPanel({ ast, error }) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'json'

  const jsonStr = useMemo(() => {
    if (!ast) return '';
    return JSON.stringify(stripTokens(ast), null, 2);
  }, [ast]);

  if (error) {
    return (
      <div className="p-4">
        <div className="status-fail font-heading text-sm font-bold mb-2">Parse Error</div>
        <pre className="mono text-xs text-[#C0392B] bg-[rgba(192,57,43,0.08)] p-3 rounded-sm border border-[rgba(192,57,43,0.2)] whitespace-pre-wrap">
          {error}
        </pre>
      </div>
    );
  }

  if (!ast || ast.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--color-stone)] italic">
        Write some Elokano code and press Run to see the AST.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toggle */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-3">
        <span className="status-pass font-bold text-sm">&#10003;</span>
        <span className="text-sm text-[var(--color-soil)]">{ast.length} statement{ast.length !== 1 ? 's' : ''}</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`text-xs px-2 py-0.5 rounded-sm border ${
              viewMode === 'tree'
                ? 'bg-[var(--color-clay)] text-[var(--color-parchment)] border-[var(--color-clay)]'
                : 'bg-transparent text-[var(--color-stone)] border-[var(--color-stone)]'
            }`}
            aria-label="Tree view"
          >
            Tree
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`text-xs px-2 py-0.5 rounded-sm border ${
              viewMode === 'json'
                ? 'bg-[var(--color-clay)] text-[var(--color-parchment)] border-[var(--color-clay)]'
                : 'bg-transparent text-[var(--color-stone)] border-[var(--color-stone)]'
            }`}
            aria-label="JSON view"
          >
            JSON
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-3">
        {viewMode === 'tree' ? (
          <div className="py-1">
            <div className="ast-label font-bold text-[var(--color-soil)] mb-1">Program</div>
            {ast.map((stmt, i) => (
              <ASTNode key={i} node={stmt} depth={0} />
            ))}
          </div>
        ) : (
          <pre className="mono text-xs text-[var(--color-ink)] whitespace-pre overflow-x-auto">
            {jsonStr}
          </pre>
        )}
      </div>
    </div>
  );
}
