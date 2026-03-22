import React, { useState, useMemo, useCallback } from 'react';
import { tokenize } from '../lib/lexer';
import { parse } from '../lib/parser';
import { analyze } from '../lib/semantic';
import SCENARIOS from '../data/scenarios';

/**
 * Runs a single scenario through lexer → parser → semantic.
 * Returns { passed, actualPhase, actualResult, tokens, symbolTable }.
 */
function runScenario(scenario) {
  const { code, expectedPhase } = scenario;
  const result = { passed: false, actualPhase: null, actualResult: null, tokens: null, symbolTable: null };

  // Phase 1: Lexer
  const lexResult = tokenize(code);
  if (lexResult.error) {
    result.actualPhase = 'lexer';
    result.actualResult = lexResult.error;
    result.passed = expectedPhase === 'lexer';
    return result;
  }
  result.tokens = lexResult.tokens;

  // Phase 2: Parser
  const parseResult = parse(lexResult.tokens);
  if (parseResult.error) {
    result.actualPhase = 'parser';
    result.actualResult = parseResult.error;
    result.passed = expectedPhase === 'parser';
    return result;
  }

  // Phase 3: Semantic
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

const PHASE_STYLES = {
  valid:    { bg: 'var(--color-terraces)', text: '#fff' },
  lexer:   { bg: '#C0392B', text: '#fff' },
  parser:  { bg: 'var(--color-clay)', text: '#fff' },
  semantic:{ bg: 'var(--color-basi)', text: '#fff' },
};

function PhaseBadge({ phase }) {
  const s = PHASE_STYLES[phase] || { bg: 'var(--color-stone)', text: '#fff' };
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '2px 8px', borderRadius: '3px',
      fontSize: '0.65rem', fontWeight: 700,
      letterSpacing: '0.5px', textTransform: 'uppercase',
      fontFamily: "'Fira Code', monospace",
    }}>
      {phase}
    </span>
  );
}

function StatusBadge({ passed }) {
  return (
    <span style={{
      background: passed ? 'var(--color-terraces)' : '#C0392B',
      color: '#fff',
      padding: '2px 10px', borderRadius: '3px',
      fontSize: '0.65rem', fontWeight: 700,
      letterSpacing: '0.5px',
      fontFamily: "'Fira Code', monospace",
    }}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}

function ScenarioCard({ scenario, result, onLoadInEditor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--color-parchment)',
      border: `1.5px solid var(--color-stone)`,
      borderLeft: `4px solid ${result.passed ? 'var(--color-terraces)' : '#C0392B'}`,
      borderRadius: '4px',
      marginBottom: '8px',
      boxShadow: 'inset 0 1px 3px rgba(44,24,16,0.06)',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px',
          background: 'var(--color-limestone)',
          cursor: 'pointer',
          flexWrap: 'wrap', gap: '6px',
          borderBottom: expanded ? '1px solid var(--color-stone)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{
            color: 'var(--color-clay)', fontFamily: "'Fira Code', monospace",
            fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
          }}>
            #{scenario.id}
          </span>
          <span style={{
            fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {scenario.title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <PhaseBadge phase={result.actualPhase || '?'} />
          <StatusBadge passed={result.passed} />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-stone)', marginLeft: '4px' }}>
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '12px 14px' }}>
          {/* Code */}
          <pre style={{
            background: 'var(--bg-editor)',
            color: 'var(--color-terraces)',
            padding: '10px 14px',
            borderRadius: '3px',
            fontSize: '0.78rem',
            fontFamily: "'Fira Code', monospace",
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: '10px',
            border: '1px solid var(--color-stone)',
          }}>
            {scenario.code}
          </pre>

          <div style={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-stone)', minWidth: '70px' }}>Expected:</span>
              <span style={{ color: 'var(--color-soil)' }}>{scenario.expectedOutcome}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-stone)', minWidth: '70px' }}>Actual:</span>
              <span style={{
                color: result.actualPhase === 'valid' ? 'var(--color-terraces)' : 'var(--color-clay)',
                fontFamily: result.actualPhase !== 'valid' ? "'Fira Code', monospace" : 'inherit',
                fontSize: result.actualPhase !== 'valid' ? '0.78rem' : 'inherit',
              }}>
                {result.actualResult}
              </span>
            </div>
          </div>

          {/* Token count */}
          {result.tokens && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-harvest)' }}>
              Tokens: {result.tokens.length}
            </div>
          )}

          {/* Symbol table */}
          {result.symbolTable && result.symbolTable.length > 0 && (
            <details style={{ marginTop: '8px' }}>
              <summary style={{
                cursor: 'pointer', color: 'var(--color-basi)',
                fontSize: '0.78rem', fontWeight: 600,
              }}>
                Symbol Table ({result.symbolTable.length} entries)
              </summary>
              <div style={{ overflow: 'auto', marginTop: '4px' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: '0.72rem', fontFamily: "'Fira Code', monospace",
                }}>
                  <thead>
                    <tr style={{ background: 'var(--color-limestone)' }}>
                      {['Name', 'Type', 'Scope', 'Offset', 'Weight'].map(h => (
                        <th key={h} style={{
                          padding: '4px 8px', textAlign: 'left',
                          borderBottom: '1px solid var(--color-stone)',
                          color: 'var(--color-basi)', fontWeight: 700,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.symbolTable.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(139,115,85,0.2)' }}>
                        <td style={{ padding: '3px 8px', color: 'var(--color-terraces)' }}>{s.name}</td>
                        <td style={{ padding: '3px 8px' }}>{s.varType || s.type}</td>
                        <td style={{ padding: '3px 8px' }}>{s.scope}</td>
                        <td style={{ padding: '3px 8px' }}>{s.offset}</td>
                        <td style={{ padding: '3px 8px' }}>{s.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Load in editor button */}
          <button
            onClick={() => onLoadInEditor(scenario.code)}
            style={{
              marginTop: '10px',
              padding: '5px 14px',
              fontSize: '0.75rem',
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 700,
              background: 'var(--color-clay)',
              color: 'var(--color-parchment)',
              border: '1px solid var(--color-soil)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
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

  // Run all scenarios once
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
    <div style={{
      padding: '24px',
      maxWidth: '960px',
      margin: '0 auto',
      fontFamily: "'Lora', serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: "'Libre Baskerville', serif",
          fontSize: '1.6rem',
          color: 'var(--color-basi)',
          marginBottom: '6px',
        }}>
          Test Scenarios
        </h1>
        <p style={{ color: 'var(--color-stone)', fontSize: '0.85rem' }}>
          140 automated tests for Lexer, Parser, and Semantic Analyzer
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '12px', justifyContent: 'center',
        marginBottom: '20px', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Total', value: total, color: 'var(--color-sky)' },
          { label: 'Passed', value: passed, color: 'var(--color-terraces)' },
          { label: 'Failed', value: failed, color: '#C0392B' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-limestone)',
            border: '1px solid var(--color-stone)',
            borderRadius: '6px',
            padding: '12px 24px',
            textAlign: 'center',
            minWidth: '100px',
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: "'Fira Code', monospace" }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', height: '6px', background: 'var(--color-limestone)',
        borderRadius: '3px', marginBottom: '20px', overflow: 'hidden',
        border: '1px solid var(--color-stone)',
      }}>
        <div style={{
          width: `${(passed / total) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--color-terraces), var(--color-sky))',
          borderRadius: '3px',
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Search */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search scenarios by title, code, or ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontFamily: "'Fira Code', monospace",
            border: '1.5px solid var(--color-stone)',
            borderRadius: '4px',
            background: 'var(--color-parchment)',
            color: 'var(--color-ink)',
            outline: 'none',
          }}
        />
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '6px', flexWrap: 'wrap',
        marginBottom: '20px', justifyContent: 'center',
      }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: filter === f.id ? 700 : 400,
              background: filter === f.id ? 'var(--color-clay)' : 'var(--color-limestone)',
              color: filter === f.id ? 'var(--color-parchment)' : 'var(--color-soil)',
              border: `1px solid ${filter === f.id ? 'var(--color-soil)' : 'var(--color-stone)'}`,
              borderRadius: '3px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{
        fontSize: '0.78rem', color: 'var(--color-stone)',
        marginBottom: '12px', fontStyle: 'italic',
      }}>
        Showing {filtered.length} of {total} scenarios
      </div>

      {/* Scenario cards */}
      {filtered.map(({ scenario, result }) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          result={result}
          onLoadInEditor={handleLoad}
        />
      ))}

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px',
          color: 'var(--color-stone)', fontStyle: 'italic',
        }}>
          No scenarios match the current filter.
        </div>
      )}
    </div>
  );
}
