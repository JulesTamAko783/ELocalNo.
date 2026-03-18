import React, { useMemo } from 'react';

/**
 * Lexical Analysis panel — displays the token stream as a color-coded table.
 * Token types are classified into categories for styling.
 */

// Token category classification for color coding
function tokenCategory(type) {
  if (['TYPE_INT', 'TYPE_FLOAT', 'TYPE_STRING', 'TYPE_BOOL', 'OUTPUT', 'INPUT', 'IF', 'ELSE', 'ASSIGN'].includes(type)) {
    return 'keyword';
  }
  if (type === 'IDENT') return 'ident';
  if (['INT_LIT', 'FLOAT_LIT', 'STRING_LIT', 'BOOL_LIT'].includes(type)) return 'literal';
  if (['PLUS', 'MINUS', 'MUL', 'DIV', 'FLOOR_DIV', 'MOD', 'GT', 'LT', 'GE', 'LE', 'EQ', 'NE'].includes(type)) {
    return 'operator';
  }
  if (['SEMI', 'LPAREN', 'RPAREN', 'LBRACE', 'RBRACE', 'COMMA'].includes(type)) return 'delimiter';
  return 'error';
}

function categoryClass(cat) {
  switch (cat) {
    case 'keyword':   return 'tok-keyword';
    case 'ident':     return 'tok-ident';
    case 'literal':   return 'tok-literal';
    case 'operator':  return 'tok-operator';
    case 'delimiter': return 'tok-delimiter';
    default:          return 'tok-error';
  }
}

export default function LexerPanel({ tokens, error }) {
  // Filter out EOF for display
  const visibleTokens = useMemo(
    () => (tokens || []).filter((t) => t.type !== 'EOF'),
    [tokens]
  );

  // Token count by category
  const summary = useMemo(() => {
    const counts = {};
    for (const t of visibleTokens) {
      const cat = tokenCategory(t.type);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [visibleTokens]);

  if (error) {
    return (
      <div className="p-4">
        <div className="status-fail font-heading text-sm font-bold mb-2">Lexical Error</div>
        <pre className="mono text-xs text-[#C0392B] bg-[rgba(192,57,43,0.08)] p-3 rounded-sm border border-[rgba(192,57,43,0.2)] whitespace-pre-wrap">
          {error}
        </pre>
      </div>
    );
  }

  if (!tokens || visibleTokens.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--color-stone)] italic">
        Write some Elokano code and press Run to see tokens.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <span className="status-pass font-bold text-sm">&#10003;</span>
        <span className="text-sm text-[var(--color-soil)]">
          {visibleTokens.length} token{visibleTokens.length !== 1 ? 's' : ''} generated
        </span>
      </div>

      {/* Token table */}
      <div className="flex-1 overflow-auto px-4 pb-2">
        <table className="w-full text-xs mono" role="table" aria-label="Token stream">
          <thead>
            <tr className="text-left text-[var(--color-stone)] border-b border-[var(--color-stone)]">
              <th className="py-1 pr-2 w-8">#</th>
              <th className="py-1 pr-2">Type</th>
              <th className="py-1 pr-2">Lexeme</th>
              <th className="py-1 pr-2 w-12">Line</th>
              <th className="py-1 w-12">Col</th>
            </tr>
          </thead>
          <tbody>
            {visibleTokens.map((tok, i) => {
              const cat = tokenCategory(tok.type);
              const cls = categoryClass(cat);
              return (
                <tr key={i} className="border-b border-[rgba(139,115,85,0.15)] hover:bg-[rgba(139,115,85,0.06)]">
                  <td className="py-0.5 pr-2 text-[var(--color-stone)]">{i + 1}</td>
                  <td className={`py-0.5 pr-2 font-semibold ${cls}`}>{tok.type}</td>
                  <td className="py-0.5 pr-2 text-[var(--color-ink)]">{JSON.stringify(tok.value)}</td>
                  <td className="py-0.5 pr-2 text-[var(--color-stone)]">{tok.line}</td>
                  <td className="py-0.5 text-[var(--color-stone)]">{tok.column}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-4 py-2 border-t border-[var(--color-stone)] flex flex-wrap gap-3 text-xs">
        {Object.entries(summary).map(([cat, count]) => (
          <span key={cat} className={`${categoryClass(cat)} font-semibold`}>
            {cat}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}
