import type { Content, Domain, Workspace } from '../types';
import { validateInteractiveModulePayload } from './interactive-module-validator';
import { validateProjectMissionPayload } from './project-mission-validator';
import { validateWorkspaceOrientationPayload } from './workspace-orientation-validator';

export interface WorkspaceAuditGap {
  severity: 'error' | 'warning';
  code: string;
  target?: string;
  message: string;
  recommendedSkill: 'flashlearn-curriculum-pipeline';
  suggestedCommand?: string;
}

export interface WorkspaceAuditSummary {
  totalActiveModules: number;
  interactiveCount: number;
  materiCount: number;
  quizCount: number;
  combinedCount: number;
  projectMissionCount: number;
  miniPracticeCount: number;
  capstoneCount: number;
  unitCount: number;
  modulesWithSummary: number;
  interactiveWithGlossary: number;
  hasMasteryOrientation: boolean;
}

export interface WorkspaceCompletenessReport {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  status: 'COMPLETE' | 'NEEDS_REMEDIATION' | 'INCOMPLETE';
  score: number;
  summary: WorkspaceAuditSummary;
  gaps: WorkspaceAuditGap[];
  skillDirective: string;
}

export interface WorkspaceAuditInput {
  workspace: Pick<Workspace, 'id' | 'slug' | 'name' | 'description' | 'orientationPayload'>;
  contents: Content[];
  domains?: Domain[];
}

const PASSIVE_ESSAY_PATTERN =
  /\b(tulis esai|menulis esai|esai definisi|rangkuman teori|meringkas bab|jelaskan pengertian|jawab pertanyaan teori)\b/i;
const CONCRETE_ARTIFACT_PATTERN =
  /\b(aplikasi|web|repo|github|demo|kode|code|api|adr|diagram|spreadsheet|lembar|template|dokumen|prototipe|prototype|simulasi|script|notebook|dashboard|desain|figma|studi kasus|audit|sop|tabel|analisis)\b/i;

export function auditWorkspaceCompleteness(
  input: WorkspaceAuditInput
): WorkspaceCompletenessReport {
  const { workspace, contents, domains = [] } = input;
  const active = contents.filter((c) => !c.deletedAt && c.isPublished !== false);
  const gaps: WorkspaceAuditGap[] = [];
  const wsRef = workspace.slug || workspace.id;

  const interactive = active.filter((c) => c.type === 'interactive_module');
  const materi = active.filter((c) => c.type === 'materi');
  const quiz = active.filter((c) => c.type === 'quiz');
  const combined = active.filter((c) => c.type === 'combined');
  const projects = active.filter((c) => c.type === 'project_mission');

  const miniPracticeCount = projects.filter(
    (c) => c.projectPayload?.missionLevel === 'mini_practice'
  ).length;
  const capstoneCount = projects.filter(
    (c) => c.projectPayload?.missionLevel === 'capstone'
  ).length;

  const unitKeys = new Set<string>();
  for (const d of domains) {
    if (d.code || d.id) unitKeys.add(d.code || d.id);
  }
  for (const c of active) {
    const code = c.interactivePayload?.unitMeta?.unitCode || c.projectPayload?.unitMeta?.unitCode;
    if (code) unitKeys.add(code);
  }

  let interactiveWithGlossary = 0;
  let interactiveWithStressTest = 0;
  let modulesWithSummary = 0;

  // 1. Workspace identity & Mastery Orientation (Phase 28 Advance Organizer)
  if (!workspace.description || workspace.description.trim().length < 20) {
    gaps.push({
      severity: 'warning',
      code: 'WORKSPACE_DESCRIPTION_WEAK',
      target: wsRef,
      message: 'Deskripsi workspace terlalu singkat (< 20 karakter); pembelajar perlu tahu tujuan akhir dan karya yang akan dihasilkan.',
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn workspace update ${workspace.id} --description "<deskripsi tujuan & target karya>"`,
    });
  }

  let hasMasteryOrientation = false;
  if (!workspace.orientationPayload) {
    if (active.length > 0) {
      gaps.push({
        severity: active.length >= 3 ? 'error' : 'warning',
        code: 'MISSING_MASTERY_ORIENTATION',
        target: wsRef,
        message:
          'Workspace belum memiliki Orientasi Keunggulan & Peta Realitas (workspace-orientation-v1: ciri keunggulan, magnum opus, capaian workspace, serta batas jujur & rekomendasi).',
        recommendedSkill: 'flashlearn-curriculum-pipeline',
        suggestedCommand: `flashlearn workspace update ${workspace.id} --orientation ./orientation.json`,
      });
    }
  } else {
    const orientReport = validateWorkspaceOrientationPayload(workspace.orientationPayload);
    if (!orientReport.valid) {
      const firstErr = orientReport.issues.find((i) => i.severity === 'error');
      gaps.push({
        severity: 'error',
        code: 'INVALID_MASTERY_ORIENTATION',
        target: wsRef,
        message: `orientationPayload gagal validasi workspace-orientation-v1: ${firstErr?.code || 'INVALID'} — ${firstErr?.message || ''}`,
        recommendedSkill: 'flashlearn-curriculum-pipeline',
        suggestedCommand: `flashlearn workspace update ${workspace.id} --orientation ./orientation.json`,
      });
    } else {
      hasMasteryOrientation = true;
    }
  }

  // 2. Learning modules existence & structural validity
  const learningModulesCount = interactive.length + materi.length + combined.length;
  if (active.length === 0) {
    gaps.push({
      severity: 'error',
      code: 'WORKSPACE_EMPTY',
      target: wsRef,
      message: 'Workspace belum memiliki modul aktif yang dipublikasikan.',
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn plan push --dir ./work/${wsRef} --upload-media`,
    });
  } else if (learningModulesCount === 0 && quiz.length === 0) {
    gaps.push({
      severity: 'error',
      code: 'NO_LEARNING_OR_DRILL_MODULES',
      target: wsRef,
      message: 'Workspace hanya berisi misi proyek tanpa modul konsep atau latihan aktif pendamping.',
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn plan push --dir ./work/${wsRef} --upload-media`,
    });
  }

  for (const mod of active) {
    if (mod.summary && mod.summary.trim().length >= 10) {
      modulesWithSummary += 1;
    }

    if (mod.type === 'interactive_module') {
      const report = validateInteractiveModulePayload(mod.interactivePayload);
      if (!report.valid) {
        const firstErr = report.issues.find((i) => i.severity === 'error');
        gaps.push({
          severity: 'error',
          code: 'INVALID_INTERACTIVE_PAYLOAD',
          target: mod.slug,
          message: `Modul interaktif '${mod.slug}' gagal validasi UILA v2: ${firstErr?.code || 'INVALID'} — ${firstErr?.message || ''}`,
          recommendedSkill: 'flashlearn-curriculum-pipeline',
          suggestedCommand: `flashlearn content update ${mod.id} --manifest ./modules/${mod.slug}.uila-v2.json`,
        });
      }
      if ((mod.interactivePayload?.glossary?.length || 0) > 0) {
        interactiveWithGlossary += 1;
      }
      if (
        mod.interactivePayload?.uila?.block5_stressTest ||
        (mod.interactivePayload?.additionalStressTests?.length || 0) > 0 ||
        mod.interactivePayload?.hingeCheck ||
        mod.interactivePayload?.explainBack
      ) {
        interactiveWithStressTest += 1;
      }
    }

    if (mod.type === 'project_mission') {
      const report = validateProjectMissionPayload(mod.projectPayload);
      if (!report.valid) {
        const firstErr = report.issues.find((i) => i.severity === 'error');
        gaps.push({
          severity: 'error',
          code: 'INVALID_PROJECT_MISSION_PAYLOAD',
          target: mod.slug,
          message: `Misi praktek '${mod.slug}' gagal validasi project-mission-v1: ${firstErr?.code || 'INVALID'} — ${firstErr?.message || ''}`,
          recommendedSkill: 'flashlearn-curriculum-pipeline',
          suggestedCommand: `flashlearn content import-project --workspace-id ${wsRef} --manifest ./modules/${mod.slug}.project-mission.json`,
        });
      } else if (mod.projectPayload) {
        const deliv = mod.projectPayload.authenticDeliverable || '';
        if (PASSIVE_ESSAY_PATTERN.test(deliv) && !CONCRETE_ARTIFACT_PATTERN.test(deliv)) {
          gaps.push({
            severity: 'warning',
            code: 'PASSIVE_ESSAY_DELIVERABLE',
            target: mod.slug,
            message: `Deliverable pada '${mod.slug}' terdeteksi menyerupai esai teori pasif; ubah menjadi artefak karya nyata yang dapat diuji/dijalankan.`,
            recommendedSkill: 'flashlearn-curriculum-pipeline',
            suggestedCommand: `flashlearn content import-project --workspace-id ${wsRef} --manifest ./modules/${mod.slug}.project-mission.json`,
          });
        }
      }
    }
  }

  // 3. Active recall coverage
  const hasActiveRecall =
    quiz.length > 0 || combined.length > 0 || interactiveWithStressTest > 0;
  if (active.length > 0 && !hasActiveRecall) {
    gaps.push({
      severity: 'warning',
      code: 'MISSING_ACTIVE_RECALL',
      target: wsRef,
      message: 'Belum ditemukan latihan active recall (kuis, flashcard 3D, atau stress-test kausal) pada workspace ini.',
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn plan push --dir ./work/${wsRef}`,
    });
  }

  // 4. Independent Practice & Authentic Deliverable coverage (Anti-Tutorial Hell)
  const totalNonProject = active.length - projects.length;
  if (totalNonProject >= 5 && projects.length === 0) {
    gaps.push({
      severity: 'error',
      code: 'MISSING_CAPSTONE_PROJECT',
      target: wsRef,
      message: `Workspace memiliki ${totalNonProject} modul konsep/kuis tetapi belum memiliki Misi Praktek Mandiri / Proyek Karya Akhir (project_mission). Pembelajar berisiko terjebak tutorial hell & imposter syndrome.`,
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn content import-project --workspace-id ${wsRef} --manifest ./modules/capstone-${wsRef}.project-mission.json`,
    });
  } else if (totalNonProject >= 3 && projects.length === 0) {
    gaps.push({
      severity: 'warning',
      code: 'RECOMMENDED_PRACTICE_PROJECT',
      target: wsRef,
      message: `Workspace memiliki ${totalNonProject} modul tanpa Misi Praktek Mandiri. Tambahkan minimal 1 mini_practice atau capstone agar ilmu menetas menjadi karya nyata.`,
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn content import-project --workspace-id ${wsRef} --manifest ./modules/capstone-${wsRef}.project-mission.json`,
    });
  } else if (totalNonProject >= 8 && capstoneCount === 0) {
    gaps.push({
      severity: 'warning',
      code: 'MISSING_CAPSTONE_LEVEL_MISSION',
      target: wsRef,
      message: 'Workspace skala besar (>= 8 modul) memiliki mini_practice namun belum memiliki 1 proyek capstone akhir menyeluruh.',
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn content import-project --workspace-id ${wsRef} --manifest ./modules/capstone-${wsRef}.project-mission.json`,
    });
  }

  if (totalNonProject >= 8 && miniPracticeCount === 0 && projects.length > 0) {
    gaps.push({
      severity: 'warning',
      code: 'MISSING_SCAFFOLDED_MINI_PRACTICE',
      target: wsRef,
      message: 'Workspace skala besar (>= 8 modul) sebaiknya menyisipkan minimal 1 mini_practice per unit inti (Scaffolded Fade) sebelum capstone akhir.',
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn content import-project --workspace-id ${wsRef} --manifest ./modules/mini-practice-u01.project-mission.json`,
    });
  }

  // 5. Unit grouping for larger workspaces
  if (active.length > 6 && unitKeys.size === 0) {
    gaps.push({
      severity: 'warning',
      code: 'MISSING_UNIT_GROUPING',
      target: wsRef,
      message: `Workspace memiliki ${active.length} modul tanpa pengelompokan Unit Kuliah (domain/unitMeta).`,
      recommendedSkill: 'flashlearn-curriculum-pipeline',
      suggestedCommand: `flashlearn plan diff --dir ./work/${wsRef}`,
    });
  }

  // 6. Glossary & summary hygiene
  if (interactive.length >= 2 && interactiveWithGlossary < Math.ceil(interactive.length * 0.5)) {
    gaps.push({
      severity: 'warning',
      code: 'LOW_GLOSSARY_COVERAGE',
      target: wsRef,
      message: `Hanya ${interactiveWithGlossary}/${interactive.length} modul interaktif yang memiliki glosarium istilah kunci.`,
      recommendedSkill: 'flashlearn-curriculum-pipeline',
    });
  }

  if (active.length > 0 && modulesWithSummary < active.length) {
    gaps.push({
      severity: 'warning',
      code: 'MISSING_MODULE_SUMMARIES',
      target: wsRef,
      message: `${active.length - modulesWithSummary} modul belum memiliki ringkasan (summary) yang memadai di daftar workspace.`,
      recommendedSkill: 'flashlearn-curriculum-pipeline',
    });
  }

  const errorCount = gaps.filter((g) => g.severity === 'error').length;
  const warningCount = gaps.filter((g) => g.severity === 'warning').length;
  const rawScore = 100 - errorCount * 25 - warningCount * 8;
  const score = Math.max(0, Math.min(100, rawScore));

  const status: WorkspaceCompletenessReport['status'] =
    errorCount > 0 ? 'INCOMPLETE' : warningCount > 0 ? 'NEEDS_REMEDIATION' : 'COMPLETE';

  const skillDirective =
    status === 'COMPLETE'
      ? 'Workspace lengkap dan selaras dengan tujuan utama FlashLearn (Paham Konsep -> Active Recall -> Praktek Karya Nyata).'
      : `Ditemukan ${errorCount} error dan ${warningCount} warning. Gunakan skill 'flashlearn-curriculum-pipeline' (.agents/skills/flashlearn-curriculum-pipeline/SKILL.md) untuk memperbaiki celah di atas, lalu jalankan ulang 'flashlearn workspace audit ${wsRef} --strict'.`;

  return {
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
    status,
    score,
    summary: {
      totalActiveModules: active.length,
      interactiveCount: interactive.length,
      materiCount: materi.length,
      quizCount: quiz.length,
      combinedCount: combined.length,
      projectMissionCount: projects.length,
      miniPracticeCount,
      capstoneCount,
      unitCount: unitKeys.size,
      modulesWithSummary,
      interactiveWithGlossary,
      hasMasteryOrientation,
    },
    gaps,
    skillDirective,
  };
}
