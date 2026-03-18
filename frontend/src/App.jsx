import React, { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import EditorPanel from './components/Editor';
import LexerPanel from './components/LexerPanel';
import ParserPanel from './components/ParserPanel';
import SemanticPanel from './components/SemanticPanel';
import OutputPanel from './components/OutputPanel';
import ReadmeViewer from './components/ReadmeViewer';
import { tokenize } from './lib/lexer';
import { parse } from './lib/parser';
import { analyze } from './lib/semantic';
import { interpret } from './lib/interpreter';
import { DEFAULT_CODE } from './examples';

export default function App() {
  const [currentView, setCurrentView] = useState('editor');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState('lexer');
  const [inputLines, setInputLines] = useState('');

  // Analysis results
  const [tokens, setTokens] = useState(null);
  const [lexerError, setLexerError] = useState(null);
  const [ast, setAst] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [symbolTable, setSymbolTable] = useState(null);
  const [semanticErrors, setSemanticErrors] = useState(null);
  const [output, setOutput] = useState('');
  const [runtimeError, setRuntimeError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);

  // ── Resizable panel sizes ──────────────────────────────────────────────
  const [editorWidthPct, setEditorWidthPct] = useState(55);   // % of ide-layout
  const [outputHeight, setOutputHeight] = useState(250);       // px
  const ideLayoutRef = useRef(null);
  const ideScrollRef = useRef(null);

  // Vertical drag (editor ↔ analysis)
  const handleVerticalDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = editorWidthPct;
    const container = ideLayoutRef.current;
    if (!container) return;
    const containerWidth = container.getBoundingClientRect().width;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const newPct = startPct + (dx / containerWidth) * 100;
      setEditorWidthPct(Math.min(80, Math.max(20, newPct)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [editorWidthPct]);

  // Horizontal drag (top row ↔ output)
  const handleHorizontalDrag = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = outputHeight;
    const container = ideScrollRef.current;
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;

    const onMove = (ev) => {
      const dy = startY - ev.clientY; // dragging up = bigger output
      const newHeight = startHeight + dy;
      setOutputHeight(Math.min(containerHeight * 0.7, Math.max(120, newHeight)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [outputHeight]);

  // Debounced live lexer
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { tokens: toks, error } = tokenize(code);
      setTokens(toks);
      setLexerError(error);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [code]);

  // Run all phases
  const handleRun = useCallback(() => {
    const lexResult = tokenize(code);
    setTokens(lexResult.tokens);
    setLexerError(lexResult.error);
    if (lexResult.error) {
      setAst(null); setParseError(null); setSymbolTable(null);
      setSemanticErrors(null); setOutput(''); setRuntimeError(null);
      setAnalysisStatus('fail');
      return;
    }

    const parseResult = parse(lexResult.tokens);
    setAst(parseResult.ast);
    setParseError(parseResult.error);
    if (parseResult.error) {
      setSymbolTable(null); setSemanticErrors(null);
      setOutput(''); setRuntimeError(null); setAnalysisStatus('fail');
      return;
    }

    const semResult = analyze(parseResult.ast);
    setSymbolTable(semResult.symbolTable);
    setSemanticErrors(semResult.errors);
    if (semResult.errors.length > 0) {
      setOutput(''); setRuntimeError(null); setAnalysisStatus('fail');
      return;
    }

    setAnalysisStatus('pass');
    const lines = inputLines.split('\n').filter((l) => l.length > 0 || inputLines.includes('\n'));
    const interpResult = interpret(parseResult.ast, lines);
    setOutput(interpResult.output);
    setRuntimeError(interpResult.error);
  }, [code, inputLines]);

  const tabs = [
    { id: 'lexer', label: 'Lexer', icon: '\uD83E\uDEA8' },
    { id: 'parser', label: 'Parser', icon: '\uD83C\uDF3E' },
    { id: 'semantic', label: 'Semantic', icon: '\u26F0' },
  ];

  // About page
  if (currentView === 'about') {
    return (
      <div className="app-shell">
        <Navbar currentView={currentView} onViewChange={setCurrentView} />
        <ReadmeViewer />
      </div>
    );
  }

  // IDE view
  return (
    <div className="app-shell">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      <div className="ide-scroll-area" ref={ideScrollRef}>
        {/* Editor + Analysis: side-by-side on desktop, stacked on mobile/tablet */}
        <div className="ide-layout" ref={ideLayoutRef}>
          {/* Code Editor */}
          <div className="editor-pane" style={{ width: `${editorWidthPct}%` }}>
            <EditorPanel code={code} onCodeChange={setCode} onRun={handleRun} />
          </div>

          {/* Vertical resize handle */}
          <div className="resize-handle-v" onMouseDown={handleVerticalDrag} />

          {/* Analysis panels */}
          <div className="analysis-pane" style={{ width: `${100 - editorWidthPct}%` }}>
            {/* Tab bar */}
            <div className="panel-header flex items-center gap-0 px-2 py-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-btn px-3 py-2.5 text-xs font-bold ${activeTab === tab.id ? 'active' : ''}`}
                  aria-label={`${tab.label} panel`}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  <span className="mr-1" aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active panel */}
            <div className="analysis-content panel">
              {activeTab === 'lexer' && <LexerPanel tokens={tokens} error={lexerError} />}
              {activeTab === 'parser' && <ParserPanel ast={ast} error={parseError} />}
              {activeTab === 'semantic' && <SemanticPanel symbolTable={symbolTable} errors={semanticErrors} />}
            </div>
          </div>
        </div>

        {/* Horizontal resize handle */}
        <div className="resize-handle-h" onMouseDown={handleHorizontalDrag} />

        {/* Output panel */}
        <div className="output-pane panel" style={{ height: `${outputHeight}px` }}>
          <OutputPanel
            code={code}
            output={output}
            runtimeError={runtimeError}
            analysisStatus={analysisStatus}
            onRun={handleRun}
            inputLines={inputLines}
            onInputChange={setInputLines}
          />
        </div>
      </div>
    </div>
  );
}
