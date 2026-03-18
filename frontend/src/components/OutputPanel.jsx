import React, { useState, useCallback } from 'react';

/**
 * Output panel — shows program output, input buffer, and execution status.
 * Includes a text area for providing input lines (for Ikabil calls).
 */

export default function OutputPanel({ output, runtimeError, analysisStatus, onRun, inputLines, onInputChange }) {
  const [showInput, setShowInput] = useState(false);

  const handleInputChange = useCallback((e) => {
    onInputChange(e.target.value);
  }, [onInputChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header flex items-center justify-between px-3 py-1.5 flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-bold text-[var(--color-soil)]">Output</span>

          {analysisStatus === 'pass' && (
            <span className="text-xs status-pass font-semibold">&#10003; Passed</span>
          )}
          {analysisStatus === 'fail' && (
            <span className="text-xs status-fail font-semibold">&#10007; Errors</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInput(!showInput)}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
              showInput
                ? 'bg-[var(--color-clay)] text-[var(--color-parchment)] border-[var(--color-clay)]'
                : 'bg-transparent text-[var(--color-stone)] border-[var(--color-stone)] hover:border-[var(--color-clay)]'
            }`}
            aria-label={showInput ? 'Hide input panel' : 'Show input panel'}
            style={{ minHeight: 36 }}
          >
            Input
          </button>

          <button
            onClick={onRun}
            className="btn-run px-4 py-1.5 text-sm flex items-center gap-1.5"
            aria-label="Run program"
          >
            <span aria-hidden="true">&#9654;</span> Run
          </button>
        </div>
      </div>

      {/* Input area (collapsible) */}
      {showInput && (
        <div className="px-3 py-2 bg-[var(--color-limestone)] border-b border-[var(--color-stone)]">
          <label className="text-xs text-[var(--color-soil)] font-semibold block mb-1" htmlFor="input-buffer">
            Input Buffer (one value per line for Ikabil calls):
          </label>
          <textarea
            id="input-buffer"
            value={inputLines}
            onChange={handleInputChange}
            rows={3}
            className="w-full mono text-xs p-2 bg-[var(--bg-editor)] text-[var(--color-limestone)] border border-[var(--color-stone)] rounded-sm resize-y"
            placeholder="Enter input values here, one per line..."
            aria-label="Program input buffer"
          />
        </div>
      )}

      {/* Output content */}
      <div className="flex-1 overflow-auto">
        {runtimeError && (
          <div className="px-3 py-2 bg-[rgba(192,57,43,0.06)] border-b border-[rgba(192,57,43,0.2)]">
            <pre className="mono text-xs text-[#C0392B] whitespace-pre-wrap">{runtimeError}</pre>
          </div>
        )}

        <pre
          className="mono text-xs p-3 text-[var(--color-ink)] whitespace-pre-wrap min-h-[3rem]"
          role="log"
          aria-label="Program output"
          aria-live="polite"
        >
          {output || (
            <span className="text-[var(--color-stone)] italic" style={{ fontFamily: 'Lora, serif' }}>
              Press Run to execute your program...
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}
