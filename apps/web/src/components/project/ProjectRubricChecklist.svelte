<script lang="ts">
  import type { ProjectMissionMilestone, ProjectRubricCriterion } from '@flashlearn/shared';

  interface Props {
    milestones: ProjectMissionMilestone[];
    rubric: ProjectRubricCriterion[];
    stretchGoals?: string[];
    checkedMilestoneIds: string[];
    checkedRubricIds: string[];
    onToggleMilestone: (id: string) => void;
    onToggleRubric: (id: string) => void;
  }

  let {
    milestones,
    rubric,
    stretchGoals = [],
    checkedMilestoneIds,
    checkedRubricIds,
    onToggleMilestone,
    onToggleRubric,
  }: Props = $props();

  let revealedHints = $state<Record<string, boolean>>({});

  const rubricRatio = $derived(
    rubric.length > 0 ? Math.min(1, checkedRubricIds.length / rubric.length) : 0
  );

  function toggleHint(id: string) {
    revealedHints = { ...revealedHints, [id]: !revealedHints[id] };
  }
</script>

<section
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 20px;"
>
  {#if milestones.length > 0}
    <div>
      <h2 style="margin: 0 0 10px 0; font-size: 0.96rem; font-weight: 800; color: #0f172a;">
        Tonggak Progres ({checkedMilestoneIds.length}/{milestones.length})
      </h2>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        {#each milestones as m (m.id)}
          {@const checked = checkedMilestoneIds.includes(m.id)}
          <div style="border: 1px solid {checked ? 'var(--ws-accent-border, #99f6e4)' : '#e2e8f0'}; background: {checked ? 'var(--ws-accent-soft, #f0fdfa)' : '#f8fafc'}; border-radius: 12px; padding: 12px 14px;">
            <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
              <input
                type="checkbox"
                {checked}
                onchange={() => onToggleMilestone(m.id)}
                style="margin-top: 3px; width: 17px; height: 17px; accent-color: var(--ws-accent, #0f766e); flex-shrink: 0;"
              />
              <span style="font-size: 0.9rem; font-weight: 700; color: #0f172a; text-decoration: {checked ? 'line-through' : 'none'}; opacity: {checked ? 0.78 : 1}; line-height: 1.45;">
                {m.title}
              </span>
            </label>
            {#if m.hint}
              <div style="margin-top: 6px; padding-left: 27px;">
                <button
                  type="button"
                  onclick={() => toggleHint(m.id)}
                  style="background: none; border: none; padding: 0; font-size: 0.78rem; font-weight: 700; color: var(--ws-accent, #0f766e); cursor: pointer;"
                >
                  {revealedHints[m.id] ? 'Sembunyikan Petunjuk' : 'Butuh Petunjuk Ringan?'}
                </button>
                {#if revealedHints[m.id]}
                  <p style="margin: 6px 0 0 0; font-size: 0.83rem; color: #475569; line-height: 1.5;">
                    {m.hint}
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Single-Point Self-Audit Rubric -->
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
      <h2 style="margin: 0; font-size: 0.98rem; font-weight: 800; color: #0f172a;">
        Rubrik Audit Mandiri (Wajib Teruji Sebelum Selesai)
      </h2>
      <span style="font-size: 0.82rem; font-weight: 800; color: {rubricRatio >= 1 ? '#15803d' : 'var(--ws-accent, #0f766e)'};">
        {checkedRubricIds.length}/{rubric.length} terverifikasi
      </span>
    </div>

    <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 14px;">
      <div
        class="fl-progress-bar-fill"
        style="background: {rubricRatio >= 1 ? '#16a34a' : 'var(--ws-accent, #0f766e)'}; transform: scaleX({rubricRatio});"
      ></div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      {#each rubric as item (item.id)}
        {@const checked = checkedRubricIds.includes(item.id)}
        <label
          style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid {checked ? '#86efac' : '#e2e8f0'}; background: {checked ? '#f0fdf4' : '#ffffff'}; cursor: pointer;"
        >
          <input
            type="checkbox"
            {checked}
            onchange={() => onToggleRubric(item.id)}
            style="margin-top: 3px; width: 18px; height: 18px; accent-color: #16a34a; flex-shrink: 0;"
          />
          <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
            <span style="font-size: 0.92rem; font-weight: 800; color: #0f172a; line-height: 1.4;">
              {item.criterion}
            </span>
            <span style="font-size: 0.84rem; color: #334155; line-height: 1.5;">
              <strong>Cara uji mandiri:</strong> {item.verificationMethod}
            </span>
            {#if item.redFlag}
              <span style="font-size: 0.8rem; color: #b91c1c; line-height: 1.45;">
                <strong>Red flag:</strong> {item.redFlag}
              </span>
            {/if}
          </div>
        </label>
      {/each}
    </div>
  </div>

  {#if stretchGoals.length > 0}
    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px 16px;">
      <div style="font-size: 0.8rem; font-weight: 800; color: #334155; margin-bottom: 6px;">
        Tantangan Ekstra (Opsional)
      </div>
      <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 5px; font-size: 0.85rem; color: #475569;">
        {#each stretchGoals as goal}
          <li>{goal}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>
