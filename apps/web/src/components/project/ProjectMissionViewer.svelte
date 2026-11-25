<script lang="ts">
  import type {
    Content,
    ProjectMissionCritique,
    ProjectSubmissionStatus,
  } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import { buildProgressSnapshot, progressSync } from '../../stores/progressSync.svelte';
  import { getLearnerSessionKey } from '../../lib/learnerSession';
  import { learningFeedback } from '../../lib/learningFeedback.svelte';
  import ProjectBriefCard from './ProjectBriefCard.svelte';
  import ProjectRubricChecklist from './ProjectRubricChecklist.svelte';
  import ProjectProofOfWorkCard from './ProjectProofOfWorkCard.svelte';

  interface Props {
    content: Content;
    onFinished?: () => void;
  }

  let { content, onFinished }: Props = $props();

  const payload = $derived(content.projectPayload);

  let status = $state<ProjectSubmissionStatus>('in_progress');
  let checkedMilestoneIds = $state<string[]>([]);
  let checkedRubricIds = $state<string[]>([]);
  let artifactUrl = $state('');
  let artifactNotes = $state('');
  let selfReflection = $state('');
  let aiCritique = $state<ProjectMissionCritique | null>(null);

  let isSaving = $state(false);
  let isCritiquing = $state(false);
  let feedbackMessage = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    if (content.id) {
      loadSubmission(content.id);
    }
  });

  async function loadSubmission(contentId: string) {
    try {
      const res = await api.contents.getProjectSubmission(contentId);
      if (!('notStarted' in res)) {
        status = res.status;
        checkedMilestoneIds = res.checkedMilestoneIds || [];
        checkedRubricIds = res.checkedRubricIds || [];
        artifactUrl = res.artifactUrl || '';
        artifactNotes = res.artifactNotes || '';
        selfReflection = res.selfReflection || '';
        aiCritique = res.aiCritique || null;
      }
    } catch {
      // Non-blocking: learner starts fresh if submission cannot be loaded
    }
  }

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function syncWorkspaceProgress(nextStatus: ProjectSubmissionStatus) {
    const rubricCount = payload?.selfAuditRubric.length || 1;
    const totalSteps = rubricCount + 1;
    const doneSteps = checkedRubricIds.length + (nextStatus === 'completed' ? 1 : 0);
    progressSync.notifySaved(
      buildProgressSnapshot({
        contentId: content.id,
        sessionKey: getLearnerSessionKey(),
        currentStepIndex: Math.min(totalSteps - 1, Math.max(0, doneSteps - 1)),
        totalSteps,
        currentSlideIndex: 0,
        completedStepIds: [...checkedMilestoneIds, ...checkedRubricIds],
        anchoringCompleted: nextStatus === 'completed',
        diagnosticAttempts: 0,
        lastLossScore: null,
        lossVector: null,
        thetaMastery: nextStatus === 'completed' ? 1 : Number((doneSteps / totalSteps).toFixed(3)),
        isCompleted: nextStatus === 'completed',
      })
    );
  }

  async function persist(nextStatus: ProjectSubmissionStatus, silent = false) {
    isSaving = true;
    errorMessage = null;
    if (!silent) feedbackMessage = null;
    try {
      const saved = await api.contents.saveProjectSubmission(content.id, {
        sessionKey: getLearnerSessionKey(),
        status: nextStatus,
        checkedMilestoneIds,
        checkedRubricIds,
        artifactUrl: artifactUrl.trim() || null,
        artifactNotes: artifactNotes.trim() || null,
        selfReflection: selfReflection.trim() || null,
      });
      status = saved.status;
      syncWorkspaceProgress(saved.status);
      if (!silent) {
        if (saved.status === 'completed') {
          learningFeedback.onCelebration(
            'Karya Mandiri Tercatat!',
            'Bukti karyamu tersimpan — selangkah lebih jauh dari tutorial hell.'
          );
          feedbackMessage = 'Selamat! Bukti karyamu berhasil disimpan dan progres workspace telah diperbarui.';
        } else {
          feedbackMessage = 'Draf progres proyek berhasil disimpan.';
        }
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Gagal menyimpan progres karya.';
    } finally {
      isSaving = false;
    }
  }

  async function handleRequestCritique() {
    isCritiquing = true;
    errorMessage = null;
    feedbackMessage = null;
    try {
      const critique = await api.contents.requestProjectCritique(content.id, {
        sessionKey: getLearnerSessionKey(),
        artifactUrl: artifactUrl.trim() || null,
        artifactNotes: artifactNotes.trim() || null,
        selfReflection: selfReflection.trim() || null,
      });
      aiCritique = critique;
      feedbackMessage = 'Tinjauan Mentor AI telah diterima.';
    } catch (err: any) {
      errorMessage = err?.message || 'Mentor AI sedang tidak tersedia.';
    } finally {
      isCritiquing = false;
    }
  }
</script>

{#if payload}
  <div style="max-width: 900px; margin: 20px auto 0; padding: 0 16px; display: flex; flex-direction: column; gap: 18px;">
    <ProjectBriefCard title={content.title} {payload} />

    <ProjectRubricChecklist
      milestones={payload.milestones || []}
      rubric={payload.selfAuditRubric}
      stretchGoals={payload.stretchGoals || []}
      {checkedMilestoneIds}
      {checkedRubricIds}
      onToggleMilestone={(id) => {
        checkedMilestoneIds = toggleId(checkedMilestoneIds, id);
      }}
      onToggleRubric={(id) => {
        checkedRubricIds = toggleId(checkedRubricIds, id);
      }}
    />

    <ProjectProofOfWorkCard
      {status}
      {artifactUrl}
      {artifactNotes}
      {selfReflection}
      {aiCritique}
      allRubricChecked={payload.selfAuditRubric.length > 0 && checkedRubricIds.length >= payload.selfAuditRubric.length}
      rubricProgressText="{checkedRubricIds.length}/{payload.selfAuditRubric.length}"
      {isSaving}
      {isCritiquing}
      {feedbackMessage}
      {errorMessage}
      onUpdateFields={(patch) => {
        if (patch.artifactUrl !== undefined) artifactUrl = patch.artifactUrl;
        if (patch.artifactNotes !== undefined) artifactNotes = patch.artifactNotes;
        if (patch.selfReflection !== undefined) selfReflection = patch.selfReflection;
      }}
      onSaveDraft={() => persist('in_progress')}
      onMarkComplete={() => persist('completed')}
      onRequestCritique={handleRequestCritique}
    />

    {#if status === 'completed' && onFinished}
      <div style="display: flex; justify-content: flex-end;">
        <button
          type="button"
          onclick={onFinished}
          class="fl-btn fl-btn-md"
          style="background: #0f172a; color: #ffffff; border: none; font-weight: 700;"
        >
          Kembali ke Workspace
        </button>
      </div>
    {/if}
  </div>
{:else}
  <div style="max-width: 720px; margin: 32px auto; padding: 24px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; color: #9a3412;">
    Data misi praktek mandiri belum lengkap pada modul ini.
  </div>
{/if}
