import { describe, expect, test } from 'bun:test';
import { auditWorkspaceCompleteness, type Content, type ProjectMissionPayload } from '../src';

const VALID_PROJECT: ProjectMissionPayload = {
  schemaVersion: 'project-mission-v1',
  missionLevel: 'capstone',
  domainCategory: 'Web Development',
  estimatedMinutes: 90,
  realWorldBrief: 'Bangun halaman katalog web responsif dengan filter kategori dan persistensi localStorage.',
  authenticDeliverable: 'Aplikasi web responsif pada repo GitHub atau demo live yang lulus seluruh edge case.',
  constraints: ['Responsif 360px-1280px'],
  edgeCasesToTest: ['Pencarian kosong menampilkan empty state'],
  milestones: [{ id: 'm1', title: 'Setup grid & filter' }],
  selfAuditRubric: [
    { id: 'r1', criterion: 'Filter akurat', verificationMethod: 'Uji pencarian kata kunci.' },
    { id: 'r2', criterion: 'Persistensi reload', verificationMethod: 'Tekan F5 dan cek state.' },
  ],
};

function makeMateri(idx: number): Content {
  return {
    id: `m-${idx}`,
    workspaceId: 'ws-1',
    title: `Modul ${idx}`,
    slug: `modul-${idx}`,
    type: 'combined',
    summary: `Ringkasan konsep inti modul ke-${idx} untuk pembelajar.`,
    readingTimeMinutes: 10,
    body: '# Materi',
    questions: [
      {
        id: `q-${idx}`,
        question: 'Pertanyaan uji?',
        options: [
          { id: 'a', text: 'Benar', isCorrect: true },
          { id: 'b', text: 'Salah', isCorrect: false },
        ],
        explanation: 'Penjelasan kausal.',
      },
    ],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Deterministic Workspace Completeness Auditor', () => {
  test('flags MISSING_CAPSTONE_PROJECT and directs to flashlearn-curriculum-pipeline when >= 5 modules lack project_mission', () => {
    const report = auditWorkspaceCompleteness({
      workspace: {
        id: 'ws-1',
        slug: 'web-fundamentals',
        name: 'Web Fundamentals',
        description: 'Belajar membangun aplikasi web modern dari dasar hingga siap produksi.',
      },
      contents: [1, 2, 3, 4, 5].map(makeMateri),
    });

    expect(report.status).toBe('INCOMPLETE');
    expect(report.gaps.some((g) => g.code === 'MISSING_CAPSTONE_PROJECT')).toBe(true);
    expect(report.gaps[0].recommendedSkill).toBe('flashlearn-curriculum-pipeline');
    expect(report.skillDirective).toContain('flashlearn-curriculum-pipeline');
    expect(report.score).toBeLessThan(100);
  });

  test('reports COMPLETE (100) when workspace has learning modules, active recall, and valid capstone project_mission', () => {
    const projectContent: Content = {
      id: 'proj-1',
      workspaceId: 'ws-1',
      title: 'Capstone: Aplikasi Katalog Web',
      slug: 'capstone-katalog-web',
      type: 'project_mission',
      summary: 'Proyek karya akhir membangun aplikasi web responsif nyata.',
      readingTimeMinutes: 90,
      body: null,
      questions: null,
      projectPayload: VALID_PROJECT,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const report = auditWorkspaceCompleteness({
      workspace: {
        id: 'ws-1',
        slug: 'web-fundamentals',
        name: 'Web Fundamentals',
        description: 'Belajar membangun aplikasi web modern dari dasar hingga menghasilkan aplikasi nyata.',
      },
      contents: [...[1, 2, 3, 4, 5].map(makeMateri), projectContent],
    });

    expect(report.status).toBe('COMPLETE');
    expect(report.score).toBe(100);
    expect(report.gaps).toHaveLength(0);
    expect(report.summary.capstoneCount).toBe(1);
  });

  test('warns on passive essay deliverables instead of authentic artifacts', () => {
    const essayProject: Content = {
      id: 'proj-essay',
      workspaceId: 'ws-1',
      title: 'Tugas Esai',
      slug: 'tugas-esai',
      type: 'project_mission',
      summary: 'Ringkasan misi praktek akhir untuk evaluasi modul.',
      readingTimeMinutes: 30,
      body: null,
      questions: null,
      projectPayload: {
        ...VALID_PROJECT,
        authenticDeliverable: 'Tulis esai definisi 500 kata mengenai konsep utama di buku ini.',
      },
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const report = auditWorkspaceCompleteness({
      workspace: {
        id: 'ws-1',
        slug: 'web-fundamentals',
        name: 'Web Fundamentals',
        description: 'Belajar membangun aplikasi web modern dari dasar hingga siap produksi.',
      },
      contents: [...[1, 2, 3, 4, 5].map(makeMateri), essayProject],
    });

    expect(report.status).toBe('NEEDS_REMEDIATION');
    expect(report.gaps.some((g) => g.code === 'PASSIVE_ESSAY_DELIVERABLE')).toBe(true);
  });
});
