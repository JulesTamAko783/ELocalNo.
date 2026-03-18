import React, { useRef, useCallback } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import { EXAMPLES, DEFAULT_CODE } from '../examples';

/**
 * Code Editor panel with Monaco Editor.
 * Registers custom Elokano language tokenizer for syntax highlighting.
 */

// Register the Elokano language with Monaco (once)
let languageRegistered = false;

function registerElokanoLanguage(monaco) {
  if (languageRegistered) return;
  languageRegistered = true;

  monaco.languages.register({ id: 'elokano' });

  monaco.languages.setMonarchTokensProvider('elokano', {
    keywords: ['Bilang', 'Gudua', 'Sarsarita', 'Pudno', 'Ibaga', 'Ikabil', 'nu', 'sabali'],
    booleans: ['true', 'false'],
    operators: ['+', '-', '*', '/', '//', '%', '>', '<', '>=', '<=', '==', '!='],

    tokenizer: {
      root: [
        // Assignment operator (must come before identifier matching)
        [/dutokan->/, 'keyword.operator.assignment'],

        // Identifiers and keywords
        [/[A-Za-z_][A-Za-z0-9_]*/, {
          cases: {
            '@keywords': 'keyword',
            '@booleans': 'constant.language',
            '@default': 'identifier',
          },
        }],

        // Numbers
        [/\d+\.\d+/, 'number.float'],
        [/\d+/, 'number'],

        // Strings
        [/"[^"\\]*(?:\\.[^"\\]*)*"/, 'string'],

        // Operators
        [/\/\//, 'operator'],
        [/[+\-*/%]/, 'operator'],
        [/[><=!]=?/, 'operator'],

        // Delimiters
        [/[;,()]/, 'delimiter'],
        [/[{}]/, 'delimiter.bracket'],

        // Whitespace
        [/\s+/, 'white'],
      ],
    },
  });

  // Define a theme matching the Rural Northern Philippines palette
  monaco.editor.defineTheme('elokano-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'C4734A', fontStyle: 'bold' },
      { token: 'keyword.operator.assignment', foreground: 'D4B483' },
      { token: 'constant.language', foreground: '7BA7BC' },
      { token: 'identifier', foreground: 'E8DCC8' },
      { token: 'number', foreground: 'D4B483' },
      { token: 'number.float', foreground: 'D4B483' },
      { token: 'string', foreground: '4A7C59' },
      { token: 'operator', foreground: '8B7355' },
      { token: 'delimiter', foreground: 'A67C52' },
      { token: 'delimiter.bracket', foreground: 'A67C52' },
    ],
    colors: {
      'editor.background': '#1A0F0A',
      'editor.foreground': '#E8DCC8',
      'editor.lineHighlightBackground': '#2C181044',
      'editor.selectionBackground': '#8B735533',
      'editorCursor.foreground': '#C4734A',
      'editorLineNumber.foreground': '#5C4033',
      'editorLineNumber.activeForeground': '#8B7355',
      'editor.selectionHighlightBackground': '#8B735522',
    },
  });
}

export default function EditorPanel({ code, onCodeChange, onRun }) {
  const editorRef = useRef(null);

  const handleEditorMount = useCallback((editor, monaco) => {
    registerElokanoLanguage(monaco);
    editorRef.current = editor;
    // Apply theme after registration
    monaco.editor.setTheme('elokano-dark');
  }, []);

  const handleExampleChange = useCallback((e) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && EXAMPLES[idx]) {
      onCodeChange(EXAMPLES[idx].code);
    }
  }, [onCodeChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="panel-header flex items-center justify-between px-3 py-1.5 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-bold text-[var(--color-soil)]">
            Source Code
          </span>
          <select
            onChange={handleExampleChange}
            defaultValue=""
            className="text-xs px-2 py-0.5 bg-[var(--color-parchment)] border border-[var(--color-stone)] rounded-sm font-body text-[var(--color-soil)] cursor-pointer"
            aria-label="Load example program"
          >
            <option value="" disabled>Examples...</option>
            {EXAMPLES.map((ex, i) => (
              <option key={i} value={i}>{ex.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onRun}
          className="btn-run px-4 py-1 text-sm flex items-center gap-1.5"
          aria-label="Run program"
        >
          <span aria-hidden="true">&#9654;</span> Run
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="elokano"
          theme="elokano-dark"
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily: '"Fira Code", monospace',
            fontLigatures: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}
