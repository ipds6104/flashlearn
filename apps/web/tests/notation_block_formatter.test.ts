import { describe, expect, it } from 'bun:test';
import {
  detectNotationMode,
  parseCliNotationLines,
  tokenizeCliCommand,
} from '../src/lib/notationBlockFormatter';

describe('notationBlockFormatter', () => {
  it('detects latex, cli, diagram, and plain rules modes accurately', () => {
    expect(detectNotationMode('$$S = P_{ask} - P_{bid}$$')).toBe('latex');
    expect(detectNotationMode('# 1. Fetch\ngit fetch origin')).toBe('cli');
    expect(detectNotationMode('A <--- B <--- C')).toBe('diagram');
    expect(detectNotationMode('Real Revenue = Total Revenue - Materials')).toBe('rules');
  });

  it('separates headings, comments, and syntax-highlighted CLI commands cleanly', () => {
    const sample = `Siklus Hidup Topic Branch Bersih:

# 1. Perbarui referensi remote
git switch -c fix/ext4-journal-race origin/main
git switch main && git pull --ff-only`;

    const parsed = parseCliNotationLines(sample);
    expect(parsed[0]).toEqual({ kind: 'heading', text: 'Siklus Hidup Topic Branch Bersih' });
    expect(parsed[1]).toEqual({ kind: 'blank' });
    expect(parsed[2]).toEqual({ kind: 'comment', text: '# 1. Perbarui referensi remote' });
    expect(parsed[3].kind).toBe('command');
    expect(parsed[4].kind).toBe('command');

    const tokens = tokenizeCliCommand('git switch main && git pull --ff-only');
    expect(tokens.some((t) => t.kind === 'cmd' && t.text === 'git')).toBe(true);
    expect(tokens.some((t) => t.kind === 'operator' && t.text === '&&')).toBe(true);
    expect(tokens.some((t) => t.kind === 'flag' && t.text === '--ff-only')).toBe(true);
  });
});
