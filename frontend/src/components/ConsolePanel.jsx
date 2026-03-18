import React, { useState, useRef, useEffect, useCallback } from 'react';
import { tokenize } from '../lib/lexer';
import { parse } from '../lib/parser';
import { analyze } from '../lib/semantic';
import { interpretAsync } from '../lib/interpreterAsync';

/**
 * Interactive console panel — terminal-like execution with live Ikabil input.
 */

export default function ConsolePanel({ code }) {
  const [consoleText, setConsoleText] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const resolveRef = useRef(null);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when console text changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [consoleText, error, waitingForInput]);

  // Auto-focus input when waiting
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput]);

  const handleRun = useCallback(async () => {
    if (running) return;

    setConsoleText('');
    setError(null);
    setRunning(true);
    setWaitingForInput(false);

    // Compile
    const lexResult = tokenize(code);
    if (lexResult.error) {
      setError(lexResult.error);
      setRunning(false);
      return;
    }

    const parseResult = parse(lexResult.tokens);
    if (parseResult.error) {
      setError(parseResult.error);
      setRunning(false);
      return;
    }

    const semResult = analyze(parseResult.ast);
    if (semResult.errors.length > 0) {
      setError(semResult.errors.join('\n'));
      setRunning(false);
      return;
    }

    // Run interactively
    const result = await interpretAsync(parseResult.ast, {
      onOutput: (text) => {
        setConsoleText((prev) => prev + text);
      },
      onInputRequest: () => {
        return new Promise((resolve) => {
          resolveRef.current = resolve;
          setWaitingForInput(true);
        });
      },
    });

    setRunning(false);
    setWaitingForInput(false);
    if (result.error) {
      setError(result.error);
    }
  }, [code, running]);

  const handleInputSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (resolveRef.current) {
        const value = inputValue;
        // Echo input in the console
        setConsoleText((prev) => prev + value + '\n');
        setInputValue('');
        setWaitingForInput(false);
        resolveRef.current(value);
        resolveRef.current = null;
      }
    },
    [inputValue]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header flex items-center justify-between px-3 py-1.5">
        <span className="font-heading text-sm font-bold text-[var(--color-soil)]">Console</span>
        <button
          onClick={handleRun}
          disabled={running}
          className="btn-run px-4 py-1.5 text-sm flex items-center gap-1.5"
          aria-label="Run program interactively"
          style={{ opacity: running ? 0.6 : 1 }}
        >
          <span aria-hidden="true">&#9654;</span> Run
        </button>
      </div>

      {/* Console output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-auto p-3"
        style={{ backgroundColor: 'var(--bg-editor)' }}
      >
        {consoleText || error ? (
          <>
            <pre
              className="mono text-xs whitespace-pre-wrap"
              style={{ color: 'var(--color-limestone)', margin: 0 }}
            >
              {consoleText}
            </pre>
            {error && (
              <pre
                className="mono text-xs whitespace-pre-wrap mt-1"
                style={{ color: '#C0392B', margin: 0 }}
              >
                {error}
              </pre>
            )}
            {!running && !error && consoleText && (
              <div
                className="mono text-xs mt-2 pt-2"
                style={{ color: 'var(--color-stone)', borderTop: '1px solid var(--color-stone)' }}
              >
                Program finished.
              </div>
            )}
          </>
        ) : (
          <span
            className="text-[var(--color-stone)] italic"
            style={{ fontFamily: 'Lora, serif' }}
          >
            Press Run to execute your program interactively...
          </span>
        )}
      </div>

      {/* Input field — visible when Ikabil is waiting */}
      {waitingForInput && (
        <form
          onSubmit={handleInputSubmit}
          className="flex items-center gap-0"
          style={{
            backgroundColor: 'var(--bg-editor)',
            borderTop: '1px solid var(--color-stone)',
          }}
        >
          <span
            className="mono text-xs px-3 py-2"
            style={{ color: 'var(--color-clay)' }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 mono text-xs py-2 pr-3 outline-none border-none"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-limestone)',
              caretColor: 'var(--color-clay)',
            }}
            placeholder="Type input and press Enter..."
            autoFocus
          />
        </form>
      )}
    </div>
  );
}
