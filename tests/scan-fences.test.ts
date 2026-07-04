import { describe, it, expect } from 'vitest';
import { scanFences } from '../src/scan-fences.js';

describe('scanFences', () => {
  it('finds a dgmo fence and splits lang/meta/content', () => {
    const md = ['# Title', '', '```dgmo', 'graph', 'A -> B', '```', ''].join(
      '\n'
    );
    const fences = scanFences(md);
    const dgmo = fences.filter((f) => f.lang === 'dgmo');
    expect(dgmo).toHaveLength(1);
    expect(dgmo[0].content).toBe('graph\nA -> B');
    expect(dgmo[0].meta).toBe('');
  });

  it('parses fence meta after the language', () => {
    const md = [
      '```dgmo showcase palette=slate title="Login flow"',
      'graph',
      '```',
    ].join('\n');
    const [f] = scanFences(md);
    expect(f.lang).toBe('dgmo');
    expect(f.meta).toBe('showcase palette=slate title="Login flow"');
  });

  it('captures non-dgmo fences too (so callers can filter)', () => {
    const md = [
      '```js',
      'const x = 1',
      '```',
      '',
      '```dgmo',
      'graph',
      '```',
    ].join('\n');
    const langs = scanFences(md).map((f) => f.lang);
    expect(langs).toEqual(['js', 'dgmo']);
  });

  it('strips opening-fence indentation from content lines', () => {
    const md = ['  ```dgmo', '  graph', '    A -> B', '  ```'].join('\n');
    const [f] = scanFences(md);
    // 2-space opening indent removed; deeper indentation preserved.
    expect(f.content).toBe('graph\n  A -> B');
  });

  it('supports tilde fences', () => {
    const md = ['~~~dgmo', 'graph', '~~~'].join('\n');
    const [f] = scanFences(md);
    expect(f.lang).toBe('dgmo');
    expect(f.content).toBe('graph');
  });

  it('does not treat ~~~ as a close for a ``` fence', () => {
    const md = ['```dgmo', 'graph', '~~~', 'A -> B', '```'].join('\n');
    const [f] = scanFences(md);
    expect(f.content).toBe('graph\n~~~\nA -> B');
  });

  it('runs an unterminated fence to end of document', () => {
    const md = ['```dgmo', 'graph', 'A -> B'].join('\n');
    const [f] = scanFences(md);
    expect(f.content).toBe('graph\nA -> B');
  });

  it('rejects backtick fences whose info line contains a backtick', () => {
    // CommonMark: a backtick in a ``` info string disqualifies it as a fence,
    // so no *dgmo* block is captured from this input.
    const md = ['```dgmo `nope`', 'graph', '```'].join('\n');
    expect(scanFences(md).filter((f) => f.lang === 'dgmo')).toHaveLength(0);
  });

  it('requires the close marker to be at least as long as the open', () => {
    const md = ['````dgmo', 'graph', '```', 'still inside', '````'].join('\n');
    const [f] = scanFences(md);
    expect(f.content).toBe('graph\n```\nstill inside');
  });
});
