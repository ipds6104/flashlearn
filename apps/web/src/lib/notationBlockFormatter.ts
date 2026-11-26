export type NotationBlockMode = 'latex' | 'cli' | 'diagram' | 'rules';

export type CodeTokenKind = 'prompt' | 'cmd' | 'flag' | 'string' | 'operator' | 'plain';

export interface CodeToken {
  kind: CodeTokenKind;
  text: string;
}

export type ParsedNotationLine =
  | { kind: 'blank' }
  | { kind: 'heading'; text: string }
  | { kind: 'comment'; text: string }
  | { kind: 'command'; raw: string; tokens: CodeToken[] }
  | { kind: 'text'; text: string };

const CLI_COMMAND_RE =
  /^(?:\$\s*)?(?:git|bun|npm|npx|curl|irm|python3?|docker|kubectl|flashlearn|ssh|chmod|mkdir|cd|ls|cat|grep|awk|sed|export|rm|cp|mv)\b/;

const ASCII_DIAGRAM_RE = /[┌┐└┘├┤┬┴┼│─═║╔╗╚╝]|<---|--->|\+--|\|\s+\|/;

export function detectNotationMode(raw: string): NotationBlockMode {
  if (!raw) return 'rules';
  if (/\$\$[\s\S]+?\$\$|\$[^$\n]+\$/.test(raw)) return 'latex';
  const lines = raw.split(/\r?\n/).map((l) => l.trim());
  if (lines.some((l) => CLI_COMMAND_RE.test(l))) return 'cli';
  if (ASCII_DIAGRAM_RE.test(raw)) return 'diagram';
  return 'rules';
}

export function tokenizeCliCommand(line: string): CodeToken[] {
  const trimmed = line.trim();
  const withoutPrompt = trimmed.replace(/^\$\s+/, '');
  const tokens: CodeToken[] = [{ kind: 'prompt', text: '$ ' }];

  // Match quoted strings, shell operators, flags, or regular words/whitespace
  const regex = /('[^']*'|"[^"]*"|\s+|&&|\|\||[|;]|--?[a-zA-Z0-9][a-zA-Z0-9_-]*|[^\s'"]+)/g;
  let match: RegExpExecArray | null;
  let expectCommand = true;

  while ((match = regex.exec(withoutPrompt)) !== null) {
    const part = match[0];
    if (/^\s+$/.test(part)) {
      tokens.push({ kind: 'plain', text: part });
      continue;
    }
    if (part === '&&' || part === '||' || part === '|' || part === ';') {
      tokens.push({ kind: 'operator', text: part });
      expectCommand = true;
      continue;
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      tokens.push({ kind: 'string', text: part });
      expectCommand = false;
      continue;
    }
    if (part.startsWith('-') && part.length > 1) {
      tokens.push({ kind: 'flag', text: part });
      expectCommand = false;
      continue;
    }
    if (expectCommand) {
      tokens.push({ kind: 'cmd', text: part });
      expectCommand = false;
      continue;
    }
    tokens.push({ kind: 'plain', text: part });
  }

  return tokens;
}

export function parseCliNotationLines(raw: string): ParsedNotationLine[] {
  const lines = raw.split(/\r?\n/);
  return lines.map((line, idx): ParsedNotationLine => {
    const trimmed = line.trim();
    if (!trimmed) return { kind: 'blank' };
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return { kind: 'comment', text: trimmed };
    }
    if (CLI_COMMAND_RE.test(trimmed)) {
      return { kind: 'command', raw: trimmed, tokens: tokenizeCliCommand(trimmed) };
    }
    if (idx === 0 && trimmed.endsWith(':')) {
      return { kind: 'heading', text: trimmed.slice(0, -1) };
    }
    return { kind: 'text', text: line };
  });
}
