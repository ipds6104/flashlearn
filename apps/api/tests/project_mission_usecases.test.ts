import { describe, expect, test } from 'bun:test';
import type { ProjectMissionCritique, ProjectMissionPayload, ProjectMissionSubmission } from '@flashlearn/shared';
import { ContentEntity } from '../src/domain/entities/Content';
import type { IAiGateway } from '../src/domain/ports/IAiGateway';
import type { IContentRepository } from '../src/domain/ports/IContentRepository';
import type { IInteractiveRepository, LearnerIdentity } from '../src/domain/ports/IInteractiveRepository';
import type {
  IProjectSubmissionRepository,
  UpsertProjectSubmissionData,
} from '../src/domain/ports/IProjectSubmissionRepository';
import { CritiqueProjectSubmissionUseCase } from '../src/application/use-cases/project/CritiqueProjectSubmissionUseCase';
import { GetProjectSubmissionUseCase } from '../src/application/use-cases/project/GetProjectSubmissionUseCase';
import { SaveProjectSubmissionUseCase } from '../src/application/use-cases/project/SaveProjectSubmissionUseCase';

const SAMPLE_PAYLOAD: ProjectMissionPayload = {
  schemaVersion: 'project-mission-v1',
  missionLevel: 'mini_practice',
  domainCategory: 'Web Development',
  estimatedMinutes: 30,
  realWorldBrief: 'Bangun form registrasi event dengan validasi real-time dan state loading tanpa reload.',
  authenticDeliverable: 'Halaman web interaktif lokal/repo GitHub dengan validasi form lengkap.',
  constraints: ['Tanpa library form eksternal', 'Aksesibel dengan keyboard'],
  edgeCasesToTest: ['Email invalid', 'Submit ganda saat loading'],
  milestones: [{ id: 'm1', title: 'Buat markup & validasi field' }],
  selfAuditRubric: [
    { id: 'r1', criterion: 'Validasi email & field kosong akurat', verificationMethod: 'Submit form kosong & cek pesan error.' },
    { id: 'r2', criterion: 'Tombol submit terkunci saat proses kirim', verificationMethod: 'Klik submit 2x cepat.' },
  ],
};

function makeProjectContent(): ContentEntity {
  return new ContentEntity({
    id: 'content-proj-1',
    workspaceId: 'ws-1',
    title: 'Mini-Praktek: Form Registrasi Anti-Bug',
    slug: 'mini-form-registrasi',
    type: 'project_mission',
    summary: 'Praktek mandiri validasi form.',
    readingTimeMinutes: 30,
    body: null,
    questions: null,
    projectPayload: SAMPLE_PAYLOAD,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeInMemorySubRepo(): IProjectSubmissionRepository {
  let stored: ProjectMissionSubmission | null = null;
  return {
    async findByLearner() {
      return stored;
    },
    async upsertByLearner(contentId: string, identity: LearnerIdentity, data: UpsertProjectSubmissionData) {
      const now = new Date().toISOString();
      stored = {
        id: stored?.id || 'sub-1',
        contentId,
        userId: identity.userId ?? null,
        sessionKey: identity.sessionKey ?? null,
        ...data,
        aiCritique: stored?.aiCritique ?? null,
        createdAt: stored?.createdAt || now,
        updatedAt: now,
      };
      return stored;
    },
    async saveCritique(_contentId: string, _identity: LearnerIdentity, critique: ProjectMissionCritique) {
      if (!stored) return null;
      stored = { ...stored, aiCritique: critique, updatedAt: new Date().toISOString() };
      return stored;
    },
  };
}

describe('Project Mission Use Cases (Phase 25 Hermetic)', () => {
  const contentRepo = {
    async findById(id: string) {
      return id === 'content-proj-1' ? makeProjectContent() : null;
    },
  } as unknown as IContentRepository;

  test('saves draft, enforces rubric & proof-of-work before completion, blocks XSS URL, and syncs progress', async () => {
    const subRepo = makeInMemorySubRepo();
    const synced: any[] = [];
    const interactiveRepo = {
      async saveProgress(contentId: string, identity: LearnerIdentity, input: any) {
        synced.push({ contentId, identity, input });
        return { contentId, ...input, dailyActivityLog: {}, updatedAt: new Date().toISOString() };
      },
    } as unknown as IInteractiveRepository;

    const getUC = new GetProjectSubmissionUseCase(contentRepo, subRepo);
    const saveUC = new SaveProjectSubmissionUseCase(contentRepo, subRepo, interactiveRepo);
    const guest: LearnerIdentity = { sessionKey: 'guest-session-1234567890' };

    const initial = await getUC.execute('content-proj-1', guest);
    expect('notStarted' in initial && initial.notStarted).toBe(true);

    // XSS protocol rejected
    await expect(
      saveUC.execute('content-proj-1', guest, { artifactUrl: 'javascript:alert(1)' })
    ).rejects.toThrow(/tidak diizinkan/i);

    // Completing without checking all rubric items fails
    await expect(
      saveUC.execute('content-proj-1', guest, {
        status: 'completed',
        checkedRubricIds: ['r1'],
        artifactUrl: 'https://github.com/example/form-app',
      })
    ).rejects.toThrow(/rubrik audit mandiri/i);

    // Completing with all rubric checked but no URL/notes fails
    await expect(
      saveUC.execute('content-proj-1', guest, {
        status: 'completed',
        checkedRubricIds: ['r1', 'r2'],
        artifactUrl: null,
        artifactNotes: 'terlalu pendek',
      })
    ).rejects.toThrow(/bukti kerja/i);

    // Valid completion succeeds and mirrors completion to learner_content_progress
    const completed = await saveUC.execute('content-proj-1', guest, {
      status: 'completed',
      checkedMilestoneIds: ['m1'],
      checkedRubricIds: ['r1', 'r2'],
      artifactUrl: 'https://github.com/example/form-app',
      artifactNotes: 'Sudah implementasi validasi email regex, disable button saat submitting, dan tes keyboard tab.',
      selfReflection: 'Ternyata pencegahan double-submit butuh flag state sebelum async request.',
    });

    expect(completed.status).toBe('completed');
    expect(completed.checkedRubricIds).toEqual(['r1', 'r2']);
    expect(synced.length).toBe(1);
    expect(synced[0].input.isCompleted).toBe(true);
  });

  test('CritiqueProjectSubmissionUseCase returns structured AI mentor review and fails fast when gateway offline', async () => {
    const subRepo = makeInMemorySubRepo();
    const guest: LearnerIdentity = { sessionKey: 'guest-session-1234567890' };

    const workingGateway: IAiGateway = {
      async chat() {
        return '';
      },
      async chatJson() {
        return {
          overallReadiness: 'solid_mvp',
          summary: 'Implementasi validasi dan penguncian tombol sudah tepat sasaran.',
          strengths: ['Sudah menangani double-submit secara eksplisit'],
          blindSpots: ['Belum terlihat cara menangani pesan error aksesibel dengan aria-live'],
          nextUpgradeStep: 'Tambahkan atribut aria-invalid dan aria-live="polite" pada pesan error form.',
        };
      },
    };

    const critiqueUC = new CritiqueProjectSubmissionUseCase(contentRepo, subRepo, workingGateway);
    const critique = await critiqueUC.execute('content-proj-1', guest, {
      artifactNotes: 'Sudah membuat form HTML + JS vanilla dengan validasi email dan state isSubmitting.',
    });

    expect(critique.overallReadiness).toBe('solid_mvp');
    expect(critique.strengths.length).toBeGreaterThan(0);
    expect(critique.blindSpots.length).toBeGreaterThan(0);

    const saved = await subRepo.findByLearner('content-proj-1', guest);
    expect(saved?.aiCritique?.overallReadiness).toBe('solid_mvp');

    // Offline gateway must fail fast (never fake dummy pass)
    const offlineGateway: IAiGateway = {
      async chat() {
        throw new Error('ECONNREFUSED');
      },
      async chatJson() {
        throw new Error('AI_GATEWAY_NOT_CONFIGURED');
      },
    };
    const offlineUC = new CritiqueProjectSubmissionUseCase(contentRepo, subRepo, offlineGateway);
    await expect(
      offlineUC.execute('content-proj-1', guest, {
        artifactNotes: 'Catatan lengkap karya form registrasi dengan validasi email dan keyboard.',
      })
    ).rejects.toThrow(/AI_CRITIQUE_UNAVAILABLE/);
  });
});
