import React from 'react';

/**
 * Semantic Analysis panel — shows symbol table, scope info, and type errors.
 */

export default function SemanticPanel({ symbolTable, errors }) {
  const hasErrors = errors && errors.length > 0;
  const hasSymbols = symbolTable && symbolTable.length > 0;

  if (!hasErrors && !hasSymbols) {
    return (
      <div className="p-4 text-sm text-[var(--color-stone)] italic">
        Write some Elokano code and press Run to see semantic analysis.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Status */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        {hasErrors ? (
          <>
            <span className="status-fail font-bold text-sm">&#10007;</span>
            <span className="text-sm text-[#C0392B]">
              {errors.length} error{errors.length !== 1 ? 's' : ''} found
            </span>
          </>
        ) : (
          <>
            <span className="status-pass font-bold text-sm">&#10003;</span>
            <span className="text-sm text-[var(--color-terraces)]">Semantic analysis passed</span>
          </>
        )}
      </div>

      {/* Error list */}
      {hasErrors && (
        <div className="px-4 py-2">
          <h4 className="font-heading text-xs font-bold text-[var(--color-basi)] mb-1.5">Type Errors</h4>
          <ul className="space-y-1" role="list" aria-label="Semantic errors">
            {errors.map((err, i) => (
              <li
                key={i}
                className="mono text-xs text-[#C0392B] bg-[rgba(192,57,43,0.06)] p-2 rounded-sm border-l-2 border-[#C0392B]"
              >
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Symbol Table */}
      {hasSymbols && (
        <div className="px-4 py-2">
          <h4 className="font-heading text-xs font-bold text-[var(--color-soil)] mb-1.5">Symbol Table</h4>
          <table className="w-full text-xs mono" role="table" aria-label="Symbol table">
            <thead>
              <tr className="text-left text-[var(--color-stone)] border-b border-[var(--color-stone)]">
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2">Type</th>
                <th className="py-1 pr-2">Scope</th>
                <th className="py-1 pr-2">Offset</th>
                <th className="py-1 pr-2">Weight(Size)</th>
                <th className="py-1 pr-2">Line</th>
                <th className="py-1">Col</th>
              </tr>
            </thead>
            <tbody>
              {symbolTable.map((entry, i) => (
                <tr key={i} className="border-b border-[rgba(139,115,85,0.15)] hover:bg-[rgba(139,115,85,0.06)]">
                  <td className="py-0.5 pr-2 text-[var(--color-terraces)] font-semibold">{entry.name}</td>
                  <td className="py-0.5 pr-2 tok-keyword">{entry.varType}</td>
                  <td className="py-0.5 pr-2 text-[var(--color-stone)]">{entry.scope || 'Level 0 (Global)'}</td>
                  <td className="py-0.5 pr-2 text-[var(--color-stone)]">{entry.offset ?? 0}</td>
                  <td className="py-0.5 pr-2 text-[var(--color-stone)]">{entry.weight ?? 0}</td>
                  <td className="py-0.5 pr-2 text-[var(--color-stone)]">{entry.line}</td>
                  <td className="py-0.5 text-[var(--color-stone)]">{entry.column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="divider-wave mt-auto" aria-hidden="true"></div>
    </div>
  );
}
