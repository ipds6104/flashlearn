<script lang="ts">
  import type {
    OrientationExemplarKind,
    WorkspaceOrientationPayload,
  } from '@flashlearn/shared';

  interface Props {
    orientation: WorkspaceOrientationPayload;
  }

  let { orientation }: Props = $props();
  let expanded = $state(false);

  const KIND_LABEL: Record<OrientationExemplarKind, string> = {
    system: 'Sistem',
    organization: 'Organisasi',
    team: 'Tim',
    protocol: 'Protokol',
    practitioner: 'Praktisi',
    work: 'Karya',
  };
</script>

<section
  aria-label="Orientasi Keunggulan & Peta Realitas"
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 18px; overflow: hidden;"
>
  <button
    type="button"
    onclick={() => (expanded = !expanded)}
    aria-expanded={expanded}
    style="width: 100%; text-align: left; background: var(--ws-accent-soft, #f0fdfa); border: none; padding: 15px 18px; cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;"
  >
    <div style="min-width: 0; flex: 1;">
      <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ws-accent, #0f766e); margin-bottom: 4px;">
        Orientasi Keunggulan &amp; Peta Realitas
      </div>
      <div style="font-size: 0.94rem; font-weight: 700; color: #0f172a; line-height: 1.45; overflow-wrap: break-word;">
        {orientation.headline}
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; font-size: 0.72rem; font-weight: 700; color: var(--ws-accent-ink, #115e59);">
        <span style="background: #ffffff; border: 1px solid var(--ws-accent-border, #99f6e4); padding: 2px 8px; border-radius: 999px;">
          {orientation.hallmarksOfExcellence.length} Ciri Keunggulan
        </span>
        <span style="background: #ffffff; border: 1px solid var(--ws-accent-border, #99f6e4); padding: 2px 8px; border-radius: 999px;">
          {orientation.magnumOpusExamples.length} Magnum Opus
        </span>
        <span style="background: #ffffff; border: 1px solid var(--ws-accent-border, #99f6e4); padding: 2px 8px; border-radius: 999px;">
          {orientation.achievableHere.length} Capaian Workspace
        </span>
        <span style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 2px 8px; border-radius: 999px;">
          {orientation.honestLimits.length} Batas Jujur &amp; Rekomendasi
        </span>
      </div>
    </div>
    <span style="flex-shrink: 0; font-size: 0.78rem; font-weight: 800; color: var(--ws-accent, #0f766e); background: #ffffff; border: 1px solid var(--ws-accent-border, #99f6e4); border-radius: 999px; padding: 5px 12px;">
      {expanded ? 'Tutup' : 'Baca Peta'}
    </span>
  </button>

  {#if expanded}
    <div style="padding: 18px; display: flex; flex-direction: column; gap: 18px; border-top: 1px solid #e2e8f0;">
      <!-- 1. Hallmarks of Excellence -->
      <div>
        <h2 style="margin: 0 0 8px 0; font-size: 0.88rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
          1. Ciri-Ciri Keunggulan di Bidang Ini
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px;">
          {#each orientation.hallmarksOfExcellence as h}
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
              <div style="font-size: 0.88rem; font-weight: 800; color: var(--ws-accent, #0f766e); margin-bottom: 4px;">
                {h.trait}
              </div>
              <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">
                {h.indicator}
              </p>
              {#if h.contrastWithNovice}
                <p style="margin: 6px 0 0 0; font-size: 0.78rem; color: #64748b; line-height: 1.45;">
                  <strong>Kontras pemula:</strong> {h.contrastWithNovice}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- 2. Magnum Opus & Benchmark Exemplars -->
      <div>
        <h2 style="margin: 0 0 8px 0; font-size: 0.88rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
          2. Magnum Opus &amp; Karya Nyata (Sistem, Tim, Organisasi, atau Praktisi)
        </h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          {#each orientation.magnumOpusExamples as m}
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid var(--ws-accent, #0f766e); border-radius: 10px; padding: 12px 14px;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                <span style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">{m.exemplarName}</span>
                <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: var(--ws-accent-soft, #f0fdfa); color: var(--ws-accent-ink, #115e59); border: 1px solid var(--ws-accent-border, #99f6e4); padding: 1px 7px; border-radius: 999px;">
                  {KIND_LABEL[m.exemplarKind] || m.exemplarKind}
                </span>
              </div>
              <p style="margin: 0 0 4px 0; font-size: 0.84rem; color: #1e293b; line-height: 1.5;">
                {m.achievement}
              </p>
              <p style="margin: 0; font-size: 0.8rem; color: #475569; line-height: 1.45;">
                <strong>Ilmu yang diterapkan:</strong> {m.knowledgeApplied}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <!-- 3. Achievable Here vs 4. Honest Limits -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px;">
          <h2 style="margin: 0 0 8px 0; font-size: 0.84rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.04em;">
            3. Yang Bisa Dicapai di Workspace Ini
          </h2>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            {#each orientation.achievableHere as a}
              <div style="font-size: 0.83rem; color: #14532d; line-height: 1.5;">
                <strong>{a.capability}:</strong> {a.evidenceInWorkspace}
              </div>
            {/each}
          </div>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px;">
          <h2 style="margin: 0 0 8px 0; font-size: 0.84rem; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.04em;">
            4. Batas Jujur &amp; Rekomendasi Lanjutan
          </h2>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            {#each orientation.honestLimits as l}
              <div style="font-size: 0.83rem; color: #78350f; line-height: 1.5;">
                <div><strong>{l.limit}</strong> — {l.whyBeyondWorkspace}</div>
                <div style="margin-top: 3px; color: #92400e;">
                  <strong>Rekomendasi:</strong> {l.recommendation}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>
