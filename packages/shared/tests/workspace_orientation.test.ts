import { describe, expect, it } from 'bun:test';
import { validateWorkspaceOrientationPayload } from '../src/utils/workspace-orientation-validator';
import { auditWorkspaceCompleteness } from '../src/utils/workspace-completeness-auditor';

const validOrientation = {
  schemaVersion: 'workspace-orientation-v1' as const,
  headline: 'Membangun disiplin rilis dan sejarah Git yang tahan audit serta bisect.',
  hallmarksOfExcellence: [
    {
      trait: 'Disiplin Isolasi Branch',
      indicator: 'Memisahkan eksperimen, fitur, dan perbaikan regresi ke cabang berbeda.',
      contrastWithNovice: 'Pemula mendorong semua perubahan langsung ke main.',
    },
    {
      trait: 'Bisectability Total',
      indicator: 'Setiap commit dapat dikompilasi dan diuji secara independen.',
    },
    {
      trait: 'Kalibrasi Risiko Stabilisasi',
      indicator: 'Menolak churn besar di fase release candidate demi stabilitas.',
    },
  ],
  magnumOpusExamples: [
    {
      exemplarName: 'Komunitas Linux Kernel',
      exemplarKind: 'organization' as const,
      achievement: 'Mengintegrasikan 15.000+ commit per siklus rilis setiap 9–10 minggu.',
      knowledgeApplied: 'Merge window 2 minggu, -rc stabilization freeze, dan signed pull requests.',
    },
    {
      exemplarName: 'Sistem Git Itu Sendiri',
      exemplarKind: 'system' as const,
      achievement: 'Menjadi tulang punggung version control terdistribusi industri perangkat lunak.',
      knowledgeApplied: 'Model DAG terhash SHA, atomic commits, dan git bisect O(log N).',
    },
  ],
  achievableHere: [
    {
      capability: 'Model Mental Alur Cabang & Triage Rilis',
      evidenceInWorkspace: '12 modul panduan interaktif + simulasi pemilahan perubahan menjelang rilis.',
    },
    {
      capability: 'Pemulihan Darurat & Pelacakan Bug Otomatis',
      evidenceInWorkspace: 'Latihan praktik langsung melacak bug otomatis dan menyelamatkan riwayat kerja.',
    },
  ],
  honestLimits: [
    {
      limit: 'Dinamika Politik Review Lintas Tim Skala Besar',
      whyBeyondWorkspace: 'Membutuhkan negosiasi langsung dengan maintainer dan stakeholder nyata.',
      recommendation: 'Kirimkan patch nyata ke proyek open-source atau pimpin release freeze di tim kerja.',
    },
    {
      limit: 'Intuisi Krisis Insiden Produksi 24/7',
      whyBeyondWorkspace: 'Tekanan psikologis pemulihan di bawah SLA aktif tidak bisa ditiru 100% secara mandiri.',
      recommendation: 'Ikuti game-day disaster recovery dan rotasi on-call bersama senior engineer.',
    },
  ],
};

describe('Phase 28: Workspace Mastery Orientation Validator & Auditor', () => {
  it('validates a complete workspace-orientation-v1 payload', () => {
    const res = validateWorkspaceOrientationPayload(validOrientation);
    expect(res.valid).toBe(true);
    expect(res.issues).toHaveLength(0);
  });

  it('rejects incomplete orientation payloads missing required pillars', () => {
    const res = validateWorkspaceOrientationPayload({
      schemaVersion: 'workspace-orientation-v1',
      headline: 'Terlalu singkat',
      hallmarksOfExcellence: [],
      magnumOpusExamples: [],
      achievableHere: [],
      honestLimits: [],
    });
    expect(res.valid).toBe(false);
    expect(res.issues.some((i) => i.code === 'HALLMARKS_MINIMUM_THREE')).toBe(true);
    expect(res.issues.some((i) => i.code === 'MAGNUM_OPUS_MINIMUM_TWO')).toBe(true);
    expect(res.issues.some((i) => i.code === 'HONEST_LIMITS_MINIMUM_TWO')).toBe(true);
  });

  it('flags MISSING_MASTERY_ORIENTATION in workspace completeness audit and passes when present', () => {
    const baseContents: any[] = [
      { id: 'c1', slug: 'm1', type: 'materi', summary: 'Ringkasan modul 1 cukup panjang', isPublished: true },
      { id: 'c2', slug: 'q1', type: 'quiz', summary: 'Ringkasan kuis 1 cukup panjang', isPublished: true },
      {
        id: 'c3',
        slug: 'p1',
        type: 'project_mission',
        summary: 'Ringkasan proyek 1 cukup panjang',
        isPublished: true,
        projectPayload: {
          schemaVersion: 'project-mission-v1',
          missionLevel: 'capstone',
          domainCategory: 'Software Engineering',
          estimatedMinutes: 60,
          realWorldBrief: 'Bangun prototipe sistem nyata lengkap dengan pengujian otomatis.',
          authenticDeliverable: 'Repositori kode & skrip simulasi teruji.',
          constraints: ['Tanpa mock'],
          edgeCasesToTest: ['Konflik merge'],
          milestones: [{ id: 'm1', title: 'Setup' }],
          selfAuditRubric: [
            { id: 'r1', criterion: 'Valid', verificationMethod: 'Jalankan tes' },
            { id: 'r2', criterion: 'Bersih', verificationMethod: 'Cek git log' },
          ],
        },
      },
    ];

    const withoutOrient = auditWorkspaceCompleteness({
      workspace: {
        id: 'ws-1',
        slug: 'test-ws',
        name: 'Test Workspace',
        description: 'Deskripsi workspace cukup panjang untuk pengujian.',
      },
      contents: baseContents,
    });
    expect(withoutOrient.status).toBe('INCOMPLETE');
    expect(withoutOrient.gaps.some((g) => g.code === 'MISSING_MASTERY_ORIENTATION')).toBe(true);

    const withOrient = auditWorkspaceCompleteness({
      workspace: {
        id: 'ws-1',
        slug: 'test-ws',
        name: 'Test Workspace',
        description: 'Deskripsi workspace cukup panjang untuk pengujian.',
        orientationPayload: validOrientation,
      },
      contents: baseContents,
    });
    expect(withOrient.status).toBe('COMPLETE');
    expect(withOrient.score).toBe(100);
    expect(withOrient.summary.hasMasteryOrientation).toBe(true);
  });
});
