<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import type { ProjectMissionPayload } from '@flashlearn/shared';
  import ChipBadge from '../ui/ChipBadge.svelte';

  interface Props {
    title: string;
    payload: ProjectMissionPayload;
  }

  let { title, payload }: Props = $props();

  function renderSafeMd(raw: string): string {
    const html = marked.parse(raw || '', { async: false }) as string;
    return DOMPurify.sanitize(html);
  }

  const briefHtml = $derived(renderSafeMd(payload.realWorldBrief));
  const starterHtml = $derived(payload.starterContext ? renderSafeMd(payload.starterContext) : '');
  const isCapstone = $derived(payload.missionLevel === 'capstone');
</script>

<section
  class="fl-step-enter"
  style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid var(--ws-accent, #0f766e); border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 18px;"
>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <ChipBadge variant="project" label={isCapstone ? 'Proyek Karya Akhir' : 'Mini-Praktek Unit'} />
      <ChipBadge variant="neutral" label={payload.domainCategory} />
      <ChipBadge variant="neutral" label="~{payload.estimatedMinutes} menit" />
    </div>
    <h1 style="margin: 0; font-size: clamp(1.25rem, 3vw, 1.55rem); color: #0f172a; font-weight: 800; line-height: 1.3;">
      {title}
    </h1>
  </div>

  <!-- Authentic Deliverable Highlight -->
  <div style="background: var(--ws-accent-soft, #f0fdfa); border: 1.5px solid var(--ws-accent-border, #99f6e4); border-radius: 12px; padding: 14px 16px;">
    <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ws-accent, #0f766e); margin-bottom: 4px;">
      Wujud Karya Nyata (Target Output)
    </div>
    <p style="margin: 0; font-size: 0.94rem; font-weight: 700; color: var(--ws-accent-ink, #115e59); line-height: 1.5;">
      {payload.authenticDeliverable}
    </p>
  </div>

  <!-- Real-World Scenario Brief -->
  <div>
    <h2 style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;">
      Skenario &amp; Brief Dunia Nyata
    </h2>
    <div class="markdown-body" style="font-size: 0.93rem; line-height: 1.65; color: #334155;">
      {@html briefHtml}
    </div>
  </div>

  {#if starterHtml}
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
      <div style="font-size: 0.78rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">
        Titik Awal (Starter Context)
      </div>
      <div class="markdown-body" style="font-size: 0.88rem; line-height: 1.6; color: #334155;">
        {@html starterHtml}
      </div>
    </div>
  {/if}

  <!-- Constraints & Edge Cases Side-by-Side Grid -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 0.85rem; font-weight: 800; color: #92400e;">
        Batasan Realistis
      </h3>
      <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 0.86rem; color: #78350f; line-height: 1.5;">
        {#each payload.constraints as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 0.85rem; font-weight: 800; color: #991b1b;">
        Edge Cases Wajib Diuji Sendiri
      </h3>
      <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 0.86rem; color: #7f1d1d; line-height: 1.5;">
        {#each payload.edgeCasesToTest as edge}
          <li>{edge}</li>
        {/each}
      </ul>
    </div>
  </div>

  {#if payload.relatedConcepts && payload.relatedConcepts.length > 0}
    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding-top: 4px; border-top: 1px solid #f1f5f9;">
      <span style="font-size: 0.78rem; font-weight: 700; color: #64748b;">Konsep yang Diterapkan:</span>
      {#each payload.relatedConcepts as concept}
        <ChipBadge variant="neutral" label={concept} />
      {/each}
    </div>
  {/if}
</section>
