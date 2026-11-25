<script lang="ts">
  import type { ProjectMissionCritique, ProjectSubmissionStatus } from '@flashlearn/shared';
  import ChipBadge from '../ui/ChipBadge.svelte';

  interface Props {
    status: ProjectSubmissionStatus;
    artifactUrl: string;
    artifactNotes: string;
    selfReflection: string;
    aiCritique: ProjectMissionCritique | null;
    allRubricChecked: boolean;
    rubricProgressText: string;
    isSaving: boolean;
    isCritiquing: boolean;
    feedbackMessage: string | null;
    errorMessage: string | null;
    onUpdateFields: (patch: { artifactUrl?: string; artifactNotes?: string; selfReflection?: string }) => void;
    onSaveDraft: () => void;
    onMarkComplete: () => void;
    onRequestCritique: () => void;
  }

  let {
    status,
    artifactUrl,
    artifactNotes,
    selfReflection,
    aiCritique,
    allRubricChecked,
    rubricProgressText,
    isSaving,
    isCritiquing,
    feedbackMessage,
    errorMessage,
    onUpdateFields,
    onSaveDraft,
    onMarkComplete,
    onRequestCritique,
  }: Props = $props();

  const hasProof = $derived(Boolean(artifactUrl.trim() || artifactNotes.trim().length >= 20));
  const canComplete = $derived(allRubricChecked && hasProof && !isSaving);

  const verdictMeta = $derived.by(() => {
    if (!aiCritique) return null;
    if (aiCritique.overallReadiness === 'production_ready') {
      return { variant: 'success' as const, label: 'Siap Pakai (Production Ready)' };
    }
    if (aiCritique.overallReadiness === 'solid_mvp') {
      return { variant: 'combined' as const, label: 'MVP Solid' };
    }
    return { variant: 'warning' as const, label: 'Perlu Iterasi Lagi' };
  });
</script>

<section
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 16px;"
>
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
    <div>
      <h2 style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">
        Bukti Karya &amp; Refleksi Mandiri (Proof of Work)
      </h2>
      <p style="margin: 4px 0 0 0; font-size: 0.84rem; color: #64748b;">
        Simpan tautan repo/demo/dokumen atau rangkuman keputusan karyamu sebagai bukti nyata kamu sudah berkarya.
      </p>
    </div>
    {#if status === 'completed'}
      <ChipBadge variant="success" size="md" label="Karya Selesai" />
    {/if}
  </div>

  <div style="display: flex; flex-direction: column; gap: 12px;">
    <label style="display: flex; flex-direction: column; gap: 5px;">
      <span style="font-size: 0.84rem; font-weight: 700; color: #334155;">Tautan Karya (Opsional — GitHub, Live Demo, Notion, Figma, Docs)</span>
      <input
        type="url"
        value={artifactUrl}
        oninput={(e) => onUpdateFields({ artifactUrl: (e.currentTarget as HTMLInputElement).value })}
        placeholder="https://github.com/username/proyek-kamu"
        style="padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 0.9rem; color: #0f172a; background: #ffffff;"
      />
    </label>

    <label style="display: flex; flex-direction: column; gap: 5px;">
      <span style="font-size: 0.84rem; font-weight: 700; color: #334155;">Ringkasan Karya &amp; Keputusan Utama</span>
      <textarea
        rows={5}
        value={artifactNotes}
        oninput={(e) => onUpdateFields({ artifactNotes: (e.currentTarget as HTMLTextAreaElement).value })}
        placeholder="Jelaskan apa yang kamu bangun, keputusan trade-off yang kamu ambil, dan hasil pengujian edge cases..."
        style="padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 0.9rem; color: #0f172a; resize: vertical; line-height: 1.55; font-family: inherit;"
      ></textarea>
    </label>

    <label style="display: flex; flex-direction: column; gap: 5px;">
      <span style="font-size: 0.84rem; font-weight: 700; color: #334155;">Refleksi Pribadi (Opsional — Bagian tersulit &amp; insight baru)</span>
      <textarea
        rows={3}
        value={selfReflection}
        oninput={(e) => onUpdateFields({ selfReflection: (e.currentTarget as HTMLTextAreaElement).value })}
        placeholder="Apa hal yang baru benar-benar kamu pahami setelah membangun karyanya sendiri?"
        style="padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 0.88rem; color: #0f172a; resize: vertical; line-height: 1.55; font-family: inherit;"
      ></textarea>
    </label>
  </div>

  {#if errorMessage}
    <div style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 10px; padding: 10px 14px; font-size: 0.85rem; font-weight: 600;">
      {errorMessage}
    </div>
  {/if}

  {#if feedbackMessage}
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; border-radius: 10px; padding: 10px 14px; font-size: 0.85rem; font-weight: 600;">
      {feedbackMessage}
    </div>
  {/if}

  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <button
      type="button"
      disabled={!canComplete}
      onclick={onMarkComplete}
      class="fl-btn fl-btn-md"
      style="background: {canComplete ? 'var(--ws-accent, #0f766e)' : '#cbd5e1'}; color: #ffffff; border: none; font-weight: 800; cursor: {canComplete ? 'pointer' : 'not-allowed'};"
    >
      {isSaving ? 'Menyimpan...' : status === 'completed' ? 'Perbarui Karya Selesai' : 'Tandai Karya Selesai'}
    </button>

    <button
      type="button"
      disabled={isSaving}
      onclick={onSaveDraft}
      class="fl-btn fl-btn-md"
      style="background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; font-weight: 700;"
    >
      Simpan Draf
    </button>

    <button
      type="button"
      disabled={isCritiquing || artifactNotes.trim().length < 20}
      onclick={onRequestCritique}
      class="fl-btn fl-btn-md"
      style="background: #ffffff; color: var(--ws-accent, #0f766e); border: 1.5px solid var(--ws-accent-border, #99f6e4); font-weight: 700; opacity: {artifactNotes.trim().length < 20 ? 0.55 : 1};"
    >
      {isCritiquing ? 'Mentor AI Meninjau...' : 'Minta Kritik Mentor AI (Opsional)'}
    </button>
  </div>

  {#if !allRubricChecked || !hasProof}
    <div style="font-size: 0.8rem; color: #64748b;">
      Syarat menandai selesai: centang semua Rubrik Audit Mandiri ({rubricProgressText}) dan isi tautan karya atau ringkasan minimal 20 karakter.
    </div>
  {/if}

  {#if aiCritique && verdictMeta}
    <div class="fl-step-enter" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 0.86rem; font-weight: 800; color: #0f172a;">Tinjauan Mentor AI</span>
        <ChipBadge variant={verdictMeta.variant} label={verdictMeta.label} />
      </div>
      <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.55;">{aiCritique.summary}</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
        <div>
          <div style="font-size: 0.8rem; font-weight: 800; color: #15803d; margin-bottom: 4px;">Kekuatan Nyata</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.84rem; color: #334155; line-height: 1.5;">
            {#each aiCritique.strengths as s}
              <li>{s}</li>
            {/each}
          </ul>
        </div>
        <div>
          <div style="font-size: 0.8rem; font-weight: 800; color: #b45309; margin-bottom: 4px;">Titik Buta / Perlu Cek Ulang</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.84rem; color: #334155; line-height: 1.5;">
            {#each aiCritique.blindSpots as b}
              <li>{b}</li>
            {/each}
          </ul>
        </div>
      </div>
      <div style="background: var(--ws-accent-soft, #f0fdfa); border-radius: 10px; padding: 10px 12px; font-size: 0.84rem; color: var(--ws-accent-ink, #115e59);">
        <strong>Langkah Upgrade Berikutnya:</strong> {aiCritique.nextUpgradeStep}
      </div>
    </div>
  {/if}
</section>
