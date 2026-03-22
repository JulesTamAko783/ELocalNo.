import React, { useState, useMemo, useCallback } from 'react';
import { tokenize } from '../lib/lexer';
import { parse } from '../lib/parser';
import { analyze } from '../lib/semantic';
import SCENARIOS from '../data/scenarios';

function runScenario(scenario) {
  const { code, expectedPhase } = scenario;
  const result = { passed: false, actualPhase: null, actualResult: null, tokens: null, symbolTable: null };

  const lexResult = tokenize(code);
  if (lexResult.error) {
    result.actualPhase = 'lexer';
    result.actualResult = lexResult.error;
    result.passed = expectedPhase === 'lexer';
    return result;
  }
  result.tokens = lexResult.tokens;

  const parseResult = parse(lexResult.tokens);
  if (parseResult.error) {
    result.actualPhase = 'parser';
    result.actualResult = parseResult.error;
    result.passed = expectedPhase === 'parser';
    return result;
  }

  const semResult = analyze(parseResult.ast);
  if (semResult.errors && semResult.errors.length > 0) {
    result.actualPhase = 'semantic';
    result.actualResult = semResult.errors.map(e => typeof e === 'string' ? e : e.message || JSON.stringify(e)).join('; ');
    result.passed = expectedPhase === 'semantic';
    return result;
  }

  result.actualPhase = 'valid';
  result.actualResult = 'All phases passed successfully';
  result.symbolTable = semResult.symbolTable;
  result.passed = expectedPhase === 'valid';
  return result;
}

const PHASE_CONFIG = {
  valid:    { label: 'VALID',    bg: 'bg-terraces',  border: 'border-terraces' },
  lexer:   { label: 'LEXER',    bg: 'bg-[#C0392B]', border: 'border-[#C0392B]' },
  parser:  { label: 'PARSER',   bg: 'bg-clay',       border: 'border-clay' },
  semantic:{ label: 'SEMANTIC', bg: 'bg-basi',       border: 'border-basi' },
};

function PhaseBadge({ phase }) {
  const cfg = PHASE_CONFIG[phase] || { label: '?', bg: 'bg-stone_wall', border: 'border-stone_wall' };
  return (
    <span className={`${cfg.bg} text-parchment px-2 py-0.5 rounded-sm text-[0.6rem] font-bold tracking-wider uppercase mono`}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ passed }) {
  return (
    <span className={`${passed ? 'bg-terraces' : 'bg-[#C0392B]'} text-parchment px-2.5 py-0.5 rounded-sm text-[0.6rem] font-bold tracking-wider mono`}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}

function ScenarioCard({ scenario, result, onLoadInEditor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`
      bg-parchment border border-stone_wall rounded-sm mb-2 overflow-hidden
      border-l-4 ${result.passed ? 'border-l-terraces' : 'border-l-[#C0392B]'}
      shadow-[inset_0_1px_3px_rgba(44,24,16,0.06)]
    `}>
      {/* Header — clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`
          flex justify-between items-center px-3.5 py-2.5
          bg-limestone cursor-pointer flex-wrap gap-1.5
          ${expanded ? 'border-b border-stone_wall' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="mono text-clay text-xs font-bold shrink-0">
            #{scenario.id}
          </span>
          <span className="text-sm font-semibold text-ink truncate font-['Lora',serif]">
            {scenario.title}
          </span>
        </div>
        <div className="flex gap-1.5 items-center shrink-0">
          <PhaseBadge phase={result.actualPhase || '?'} />
          <StatusBadge passed={result.passed} />
          <span className="text-[0.65rem] text-stone_wall ml-1">
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3.5 py-3 inabel-bg">
          {/* Code block */}
          <pre className="bg-[#1A0F0A] text-terraces p-3 rounded-sm text-[0.78rem] mono overflow-auto whitespace-pre-wrap break-words mb-3 border border-stone_wall">
            {scenario.code}
          </pre>

          {/* Expected / Actual */}
          <div className="text-sm leading-7 font-['Lora',serif]">
            <div className="flex gap-2">
              <span className="font-bold text-stone_wall min-w-[70px] font-['Libre_Baskerville',serif]">Expected:</span>
              <span className="text-soil">{scenario.expectedOutcome}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-stone_wall min-w-[70px] font-['Libre_Baskerville',serif]">Actual:</span>
              <span className={
                result.actualPhase === 'valid'
                  ? 'text-terraces'
                  : 'text-clay mono text-[0.78rem]'
              }>
                {result.actualResult}
              </span>
            </div>
          </div>

          {/* Token count */}
          {result.tokens && (
            <div className="mt-2 text-xs text-harvest font-['Lora',serif]">
              Tokens: {result.tokens.length}
            </div>
          )}

          {/* Symbol table */}
          {result.symbolTable && result.symbolTable.length > 0 && (
            <details className="mt-2 border-t border-stone_wall pt-2">
              <summary className="cursor-pointer text-basi text-xs font-bold font-['Libre_Baskerville',serif]">
                Symbol Table ({result.symbolTable.length} entries)
              </summary>
              <div className="overflow-auto mt-1">
                <table className="w-full border-collapse text-[0.7rem] mono">
                  <thead>
                    <tr className="bg-limestone">
                      {['Name', 'Type', 'Scope', 'Offset', 'Weight'].map(h => (
                        <th key={h} className="px-2 py-1 text-left border-b border-stone_wall text-basi font-bold font-['Libre_Baskerville',serif]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.symbolTable.map((s, i) => (
                      <tr key={i} className="border-b border-stone_wall/20 hover:bg-limestone/50">
                        <td className="px-2 py-1 text-terraces">{s.name}</td>
                        <td className="px-2 py-1 text-clay">{s.varType || s.type}</td>
                        <td className="px-2 py-1">{s.scope}</td>
                        <td className="px-2 py-1">{s.offset}</td>
                        <td className="px-2 py-1">{s.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Load in editor */}
          <button
            onClick={() => onLoadInEditor(scenario.code)}
            className="btn-run mt-3 px-4 py-1.5 text-xs"
          >
            Load in Editor
          </button>
        </div>
      )}
    </div>
  );
}

export default function TestScenariosPanel({ onLoadInEditor }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const results = useMemo(() => {
    return SCENARIOS.map(s => ({ scenario: s, result: runScenario(s) }));
  }, []);

  const total = results.length;
  const passed = results.filter(r => r.result.passed).length;
  const failed = total - passed;
  const validCount = results.filter(r => r.scenario.expectedPhase === 'valid').length;
  const lexerCount = results.filter(r => r.scenario.expectedPhase === 'lexer').length;
  const parserCount = results.filter(r => r.scenario.expectedPhase === 'parser').length;
  const semanticCount = results.filter(r => r.scenario.expectedPhase === 'semantic').length;

  const filtered = useMemo(() => {
    let list = results;
    if (filter === 'valid') list = list.filter(r => r.scenario.expectedPhase === 'valid');
    else if (filter === 'lexer') list = list.filter(r => r.scenario.expectedPhase === 'lexer');
    else if (filter === 'parser') list = list.filter(r => r.scenario.expectedPhase === 'parser');
    else if (filter === 'semantic') list = list.filter(r => r.scenario.expectedPhase === 'semantic');
    else if (filter === 'pass') list = list.filter(r => r.result.passed);
    else if (filter === 'fail') list = list.filter(r => !r.result.passed);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.scenario.title.toLowerCase().includes(q) ||
        r.scenario.code.toLowerCase().includes(q) ||
        String(r.scenario.id).includes(q)
      );
    }
    return list;
  }, [results, filter, searchQuery]);

  const handleLoad = useCallback((code) => {
    if (onLoadInEditor) onLoadInEditor(code);
  }, [onLoadInEditor]);

  const filters = [
    { id: 'all', label: `All (${total})` },
    { id: 'valid', label: `Valid (${validCount})` },
    { id: 'lexer', label: `Lexer Errors (${lexerCount})` },
    { id: 'parser', label: `Parser Errors (${parserCount})` },
    { id: 'semantic', label: `Semantic Errors (${semanticCount})` },
    { id: 'pass', label: `Passed (${passed})` },
    { id: 'fail', label: `Failed (${failed})` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 font-['Lora',serif]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="text-center mb-6">
        <h1 className="logo text-2xl text-basi mb-1">
          Test Scenarios
        </h1>
        <p className="text-stone_wall text-sm font-['Lora',serif]">
          {total} automated tests for the Elokano compiler pipeline
        </p>

        {/* Inabel divider */}
        <div className="divider-wave mt-3" aria-hidden="true"></div>
      </div>

      {/* ── Stats boxes ────────────────────────────────────────── */}
      <div className="flex gap-3 justify-center mb-5 flex-wrap">
        {[
          { label: 'Total',          value: total,         color: 'text-sky' },
          { label: 'Nakapasa',       value: validCount,    color: 'text-terraces' },
          { label: 'Napaay',         value: lexerCount + parserCount + semanticCount, color: 'text-[#C0392B]' },
          { label: 'Lexer',          value: lexerCount,    color: 'text-[#C0392B]' },
          { label: 'Parser',         value: parserCount,   color: 'text-clay' },
          { label: 'Semantic',       value: semanticCount, color: 'text-basi' },
        ].map(s => (
          <div key={s.label} className="bg-limestone border border-stone_wall rounded-sm px-5 py-3 text-center min-w-[90px] shadow-[inset_0_1px_3px_rgba(44,24,16,0.08)]">
            <div className={`text-2xl font-bold ${s.color} mono`}>
              {s.value}
            </div>
            <div className="text-[0.6rem] text-stone_wall uppercase tracking-widest font-['Libre_Baskerville',serif]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress bar (inabel colors) ───────────────────────── */}
      <div className="w-full h-1.5 bg-limestone rounded-sm mb-5 overflow-hidden border border-stone_wall">
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{
            width: `${(validCount / total) * 100}%`,
            background: 'repeating-linear-gradient(90deg, var(--color-terraces) 0px, var(--color-terraces) 8px, var(--color-clay) 8px, var(--color-clay) 16px, var(--color-palay) 16px, var(--color-palay) 24px)',
          }}
        />
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Agsapul... (Search scenarios)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3.5 py-2 text-sm mono border-2 border-stone_wall rounded-sm bg-parchment text-ink outline-none focus:border-clay transition-colors placeholder:text-stone_wall/60"
        />
      </div>

      {/* ── Filter buttons ─────────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap mb-5 justify-center">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              tab-btn px-3 py-2 text-[0.7rem] rounded-sm border transition-all
              ${filter === f.id
                ? 'bg-clay text-parchment border-soil font-bold shadow-[0_1px_2px_rgba(44,24,16,0.3)]'
                : 'bg-limestone text-soil border-stone_wall hover:text-clay hover:border-clay'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Results count ──────────────────────────────────────── */}
      <div className="text-xs text-stone_wall mb-3 italic font-['Lora',serif]">
        Showing {filtered.length} of {total} scenarios
      </div>

      {/* ── Scenario cards ─────────────────────────────────────── */}
      {filtered.map(({ scenario, result }) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          result={result}
          onLoadInEditor={handleLoad}
        />
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-10 text-stone_wall italic font-['Lora',serif]">
          Awan ti scenario a maipakita. (No scenarios match.)
        </div>
      )}

      {/* Footer divider */}
      <div className="divider-wave mt-6" aria-hidden="true"></div>
      <p className="text-center text-[0.7rem] text-stone_wall mt-3 font-['Lora',serif]">
        Elokano &mdash; Pagsasao ti Ilocos
      </p>
    </div>
  );
}
