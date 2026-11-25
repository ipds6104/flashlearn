import {
  validateSafeArtifactUrl,
  type ProjectMissionCritique,
  type ProjectReadinessVerdict,
  type RequestProjectCritiqueRequest,
  type UserRole,
} from '@flashlearn/shared';
import type { IAiGateway } from '../../../domain/ports/IAiGateway';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { LearnerIdentity } from '../../../domain/ports/IInteractiveRepository';
import type { IProjectSubmissionRepository } from '../../../domain/ports/IProjectSubmissionRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';

const VALID_VERDICTS = new Set<ProjectReadinessVerdict>([
  'needs_iteration',
  'solid_mvp',
  'production_ready',
]);

function normalizeStringArray(val: unknown, fallback: string[]): string[] {
  if (!Array.isArray(val)) return fallback;
  const cleaned = val
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, 5);
  return cleaned.length > 0 ? cleaned : fallback;
}

export class CritiqueProjectSubmissionUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly submissionRepository: IProjectSubmissionRepository,
    private readonly aiGateway: IAiGateway,
    private readonly workspaceRepository?: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    identity: LearnerIdentity,
    input: RequestProjectCritiqueRequest,
    role?: UserRole
  ): Promise<ProjectMissionCritique> {
    if (!identity.userId && !identity.sessionKey) {
      throw new Error('Either authenticated user or sessionKey is required');
    }

    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    if (content.type !== 'project_mission' || !content.projectPayload) {
      throw new Error('Content is not a valid project_mission module');
    }

    if (this.workspaceRepository) {
      const workspace = await this.workspaceRepository.findById(content.workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      const isOwnerOrAdmin =
        role === 'superadmin' || (!!identity.userId && workspace.creatorId === identity.userId);
      if (!workspace.isPublic && !isOwnerOrAdmin) {
        throw new Error('Forbidden: Private workspace');
      }
    }

    const existing = await this.submissionRepository.findByLearner(contentId, identity);
    const artifactUrl =
      input.artifactUrl !== undefined
        ? validateSafeArtifactUrl(input.artifactUrl)
        : existing?.artifactUrl ?? null;
    const artifactNotes = (input.artifactNotes ?? existing?.artifactNotes ?? '').trim();
    const selfReflection = (input.selfReflection ?? existing?.selfReflection ?? '').trim();

    if (artifactNotes.length < 20) {
      throw new Error(
        'Tuliskan ringkasan karya / keputusan teknis minimal 20 karakter agar Mentor AI dapat memberi kritik yang konkret.'
      );
    }

    const payload = content.projectPayload;
    const rubricText = payload.selfAuditRubric
      .map(
        (r, i) =>
          `${i + 1}. ${r.criterion} (Verifikasi: ${r.verificationMethod}${r.redFlag ? `; Red flag: ${r.redFlag}` : ''})`
      )
      .join('\n');

    const prompt = [
      `Misi Karya (${payload.missionLevel} · ${payload.domainCategory}): ${content.title}`,
      `Wujud Deliverable: ${payload.authenticDeliverable}`,
      `Brief Dunia Nyata:\n${payload.realWorldBrief}`,
      `Batasan:\n- ${payload.constraints.join('\n- ')}`,
      `Edge Cases Target:\n- ${payload.edgeCasesToTest.join('\n- ')}`,
      `Rubrik Audit Mandiri:\n${rubricText}`,
      '---',
      `Tautan Karya Pembelajar: ${artifactUrl || '(tidak dilampirkan)'}`,
      `Ringkasan Karya & Keputusan Pembelajar:\n${artifactNotes}`,
      `Refleksi Pembelajar:\n${selfReflection || '(tidak diisi)'}`,
    ].join('\n\n');

    const schemaPrompt = JSON.stringify({
      overallReadiness: 'needs_iteration | solid_mvp | production_ready',
      summary: 'Ringkasan evaluasi 2-3 kalimat dalam Bahasa Indonesia yang jujur, hangat, dan tajam.',
      strengths: ['Kekuatan nyata 1', 'Kekuatan nyata 2'],
      blindSpots: ['Titik buta / edge case yang belum dijawab 1'],
      nextUpgradeStep: 'Satu langkah iterasi paling berdampak tanpa membocorkan solusi lengkap jadi.',
    });

    let raw: any;
    try {
      raw = await this.aiGateway.chatJson(prompt, schemaPrompt, {
        systemPrompt:
          'Anda adalah Senior Practitioner Mentor yang meninjau karya mandiri pembelajar. Berikan kritik konstruktif, spesifik terhadap brief/batasan/edge-case, jujur bila ada celah, dan JANGAN menuliskan solusi lengkap siap salin. Jawab dalam Bahasa Indonesia.',
        temperature: 0.3,
        maxTokens: 900,
      });
    } catch (err: any) {
      throw new Error(
        `AI_CRITIQUE_UNAVAILABLE: Layanan Mentor AI sedang tidak tersedia (${err?.message || 'gateway error'}). Anda tetap dapat menyelesaikan proyek menggunakan Rubrik Audit Mandiri.`
      );
    }

    const verdict: ProjectReadinessVerdict = VALID_VERDICTS.has(raw?.overallReadiness)
      ? raw.overallReadiness
      : 'needs_iteration';

    const critique: ProjectMissionCritique = {
      overallReadiness: verdict,
      summary:
        typeof raw?.summary === 'string' && raw.summary.trim()
          ? raw.summary.trim()
          : 'Karya telah ditinjau terhadap brief dan rubrik misi.',
      strengths: normalizeStringArray(raw?.strengths, ['Sudah mengambil langkah konkret membangun karya mandiri.']),
      blindSpots: normalizeStringArray(raw?.blindSpots, ['Pastikan seluruh edge case pada brief sudah diuji ulang.']),
      nextUpgradeStep:
        typeof raw?.nextUpgradeStep === 'string' && raw.nextUpgradeStep.trim()
          ? raw.nextUpgradeStep.trim()
          : 'Uji ulang satu edge case tersulit dari daftar dan catat hasilnya di ringkasan karya.',
      evaluatedAt: new Date().toISOString(),
    };

    // Persist submission + critique cleanly
    if (!existing) {
      await this.submissionRepository.upsertByLearner(contentId, identity, {
        status: 'in_progress',
        checkedMilestoneIds: [],
        checkedRubricIds: [],
        artifactUrl,
        artifactNotes,
        selfReflection: selfReflection || null,
      });
    }
    await this.submissionRepository.saveCritique(contentId, identity, critique);

    return critique;
  }
}
