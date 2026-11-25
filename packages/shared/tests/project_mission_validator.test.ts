import { describe, expect, test } from 'bun:test';
import {
  exportContentToMarkdown,
  validateProjectMissionPayload,
  validateSafeArtifactUrl,
  type Content,
  type ProjectMissionPayload,
} from '../src';

const VALID_MISSION: ProjectMissionPayload = {
  schemaVersion: 'project-mission-v1',
  missionLevel: 'capstone',
  domainCategory: 'Web Development',
  estimatedMinutes: 90,
  realWorldBrief:
    'Sebuah kedai kopi lokal membutuhkan halaman katalog menu web responsif dengan filter kategori dan estimasi total pesanan.',
  authenticDeliverable:
    'Aplikasi web berjalan lokal atau live (repo GitHub / URL demo) dengan filter kategori dan validasi keranjang.',
  constraints: [
    'Wajib responsif dari lebar layar 360px hingga 1280px',
    'Tidak boleh kehilangan isi keranjang saat halaman di-refresh (gunakan localStorage)',
  ],
  edgeCasesToTest: [
    'Pencarian menu yang tidak ditemukan menampilkan empty-state yang ramah',
    'Menekan tombol kurangi jumlah saat qty = 1 tidak menghasilkan angka negatif',
  ],
  milestones: [
    { id: 'm1', title: 'Rancang struktur data menu & tampilan grid responsif' },
    { id: 'm2', title: 'Implementasikan filter kategori, keranjang, dan persistensi localStorage' },
  ],
  selfAuditRubric: [
    {
      id: 'r1',
      criterion: 'Filter & pencarian bekerja akurat tanpa reload halaman',
      verificationMethod: 'Ketik kata kunci acak lalu kosongkan kembali; daftar menu kembali utuh.',
      redFlag: 'Pencarian sensitif huruf besar/kecil atau memicu full page refresh.',
    },
    {
      id: 'r2',
      criterion: 'State keranjang tetap bertahan setelah browser refresh',
      verificationMethod: 'Tambahkan 2 item, tekan F5, pastikan total dan item tetap identik.',
      redFlag: 'Keranjang kosong kembali setiap kali tab dimuat ulang.',
    },
  ],
};

describe('Project Mission Validator & Formatter (Phase 25)', () => {
  test('accepts a valid project-mission-v1 payload', () => {
    const report = validateProjectMissionPayload(VALID_MISSION);
    expect(report.valid).toBe(true);
    expect(report.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  test('rejects invalid schemaVersion, missing rubric, and duplicate rubric IDs', () => {
    const bad = {
      ...VALID_MISSION,
      schemaVersion: 'wrong-v0',
      constraints: [],
      selfAuditRubric: [
        { id: 'dup', criterion: 'Valid criterion 1', verificationMethod: 'Test step 1' },
        { id: 'dup', criterion: 'Valid criterion 2', verificationMethod: 'Test step 2' },
      ],
    };
    const report = validateProjectMissionPayload(bad);
    expect(report.valid).toBe(false);
    const codes = report.issues.map((i) => i.code);
    expect(codes).toContain('INVALID_SCHEMA_VERSION');
    expect(codes).toContain('CONSTRAINTS_REQUIRED');
    expect(codes).toContain('RUBRIC_ID_DUPLICATE');
  });

  test('validateSafeArtifactUrl permits https/http and blocks XSS protocols', () => {
    expect(validateSafeArtifactUrl('https://github.com/user/web-app')).toBe('https://github.com/user/web-app');
    expect(validateSafeArtifactUrl('  ')).toBeNull();
    expect(validateSafeArtifactUrl(null)).toBeNull();
    expect(() => validateSafeArtifactUrl('javascript:alert(1)')).toThrow(/tidak diizinkan/i);
    expect(() => validateSafeArtifactUrl('data:text/html,<script>alert(1)</script>')).toThrow(/tidak diizinkan/i);
    expect(() => validateSafeArtifactUrl('not a url')).toThrow(/tidak valid/i);
  });

  test('exportContentToMarkdown renders project_mission brief, constraints, and rubric', () => {
    const content: Content = {
      id: 'c-1',
      workspaceId: 'ws-1',
      title: 'Capstone: Aplikasi Katalog Kedai Kopi',
      slug: 'capstone-kedai-kopi',
      type: 'project_mission',
      summary: 'Bangun web responsif nyata dari nol.',
      readingTimeMinutes: 90,
      body: null,
      questions: null,
      projectPayload: VALID_MISSION,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const md = exportContentToMarkdown(content);
    expect(md).toContain('# Capstone: Aplikasi Katalog Kedai Kopi');
    expect(md).toContain('Proyek Karya Akhir (Capstone)');
    expect(md).toContain('Wujud Karya Nyata');
    expect(md).toContain('Rubrik Audit Mandiri');
    expect(md).toContain('Edge Cases yang Wajib Diuji Sendiri');
  });
});
