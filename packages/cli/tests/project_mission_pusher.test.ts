import { describe, expect, test } from 'bun:test';
import type { PlanModuleEntry } from '@flashlearn/shared';
import type { ApiClient } from '../src/core/client';
import {
  isProjectMissionModule,
  pushProjectMissionModule,
} from '../src/core/plan/project-mission-pusher';

const SAMPLE_MOD: PlanModuleEntry = {
  slug: 'capstone-web-app',
  title: 'Capstone: Bangun Aplikasi Web Katalog',
  unitCode: 'U05',
  moduleOrder: 99,
  contentType: 'project_mission',
  knowledgeProfile: 'procedural_do',
  estimatedMinutes: 90,
  needsSlideDeck: false,
  sourceSliceIds: [],
  prerequisites: [],
  state: 'audited',
};

const VALID_MANIFEST = {
  schemaVersion: 'project-mission-v1',
  missionLevel: 'capstone',
  domainCategory: 'Web Development',
  estimatedMinutes: 90,
  realWorldBrief:
    'Bangun halaman katalog web interaktif responsif dengan filter pencarian dan persistensi keranjang.',
  authenticDeliverable: 'Repo GitHub atau URL live aplikasi web responsif.',
  constraints: ['Responsif 360px - 1280px'],
  edgeCasesToTest: ['Pencarian kosong menampilkan empty state'],
  milestones: [{ id: 'm1', title: 'Setup layout & state filter' }],
  selfAuditRubric: [
    { id: 'r1', criterion: 'Filter akurat', verificationMethod: 'Ketik keyword lalu reset.' },
    { id: 'r2', criterion: 'Persistensi reload', verificationMethod: 'Refresh halaman dan cek state.' },
  ],
};

describe('CLI Project Mission Pusher (Phase 25)', () => {
  test('detects project_mission by contentType or schemaVersion', () => {
    expect(isProjectMissionModule(SAMPLE_MOD, {})).toBe(true);
    expect(
      isProjectMissionModule({ ...SAMPLE_MOD, contentType: undefined }, VALID_MANIFEST)
    ).toBe(true);
    expect(
      isProjectMissionModule({ ...SAMPLE_MOD, contentType: 'interactive_module' }, { schemaVersion: 'uila-v2' })
    ).toBe(false);
  });

  test('validates and returns dry-run summary without calling API', async () => {
    const client = {
      async request() {
        throw new Error('Should not call API during dry-run');
      },
    } as unknown as ApiClient;

    const res = await pushProjectMissionModule(client, {
      workspaceId: 'ws-1',
      domainId: 'dom-1',
      mod: SAMPLE_MOD,
      parsed: VALID_MANIFEST,
      dryRun: true,
    });

    expect('dryRun' in res && res.dryRun).toBe(true);
    expect(res.contentType).toBe('project_mission');
    expect(res.missionLevel).toBe('capstone');
    expect(res.rubricCount).toBe(2);
  });

  test('fails fast on invalid manifest during push', async () => {
    const client = {} as ApiClient;
    await expect(
      pushProjectMissionModule(client, {
        workspaceId: 'ws-1',
        mod: SAMPLE_MOD,
        parsed: { schemaVersion: 'project-mission-v1', missionLevel: 'capstone' },
        dryRun: true,
      })
    ).rejects.toThrow(/Invalid project_mission manifest/i);
  });
});
