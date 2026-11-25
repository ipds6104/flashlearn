import { describe, expect, test } from 'bun:test';
import { handleWorkspaceCommand } from '../src/commands/workspace';
import type { ApiClient } from '../src/core/client';

describe('CLI workspace audit command (Deterministic Completeness Gate)', () => {
  test('returns structured gaps with flashlearn-curriculum-pipeline remediation and fails in --strict mode when incomplete', async () => {
    const client = {
      async request(path: string) {
        if (path === '/api/v1/workspaces/demo-book') {
          return {
            id: 'ws-demo-1',
            slug: 'demo-book',
            name: 'Demo Book Course',
            description: 'Belajar konsep pemrograman web modern secara terstruktur dan aktif.',
          };
        }
        if (path === '/api/v1/contents/workspace/ws-demo-1') {
          return [1, 2, 3, 4, 5].map((i) => ({
            id: `c-${i}`,
            workspaceId: 'ws-demo-1',
            title: `Bab ${i}`,
            slug: `bab-${i}`,
            type: 'combined',
            summary: `Ringkasan materi bab ${i} untuk pemahaman aktif.`,
            readingTimeMinutes: 10,
            body: '# Bab',
            questions: [
              {
                id: `q-${i}`,
                question: 'Uji?',
                options: [
                  { id: 'a', text: 'Ya', isCorrect: true },
                  { id: 'b', text: 'Tidak', isCorrect: false },
                ],
                explanation: 'Alasan.',
              },
            ],
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
        if (path === '/api/v1/domains/workspace/ws-demo-1') {
          return { domains: [] };
        }
        throw new Error(`Unexpected path: ${path}`);
      },
    } as unknown as ApiClient;

    const res = await handleWorkspaceCommand('audit', ['demo-book'], {}, client);
    expect(res.data.status).toBe('INCOMPLETE');
    expect(res.data.gaps.some((g: any) => g.code === 'MISSING_CAPSTONE_PROJECT')).toBe(true);
    expect(res.data.skillDirective).toContain('flashlearn-curriculum-pipeline');
    expect(res.nextActions?.some((a) => a.command.includes('import-project'))).toBe(true);

    await expect(
      handleWorkspaceCommand('audit', ['demo-book'], { strict: true }, client)
    ).rejects.toThrow(/WORKSPACE_AUDIT_FAILED|flashlearn-curriculum-pipeline/i);
  });
});
