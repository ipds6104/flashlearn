<script lang="ts">
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';

  interface Props {
    f7router?: any;
  }

  let { f7router }: Props = $props();

  let workspaces = $state<Workspace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');

  $effect(() => {
    loadWorkspaces();
  });

  async function loadWorkspaces() {
    isLoading = true;
    try {
      workspaces = await api.workspaces.list('public');
    } catch (err: any) {
      console.error('Failed to load workspaces:', err);
    } finally {
      isLoading = false;
    }
  }

  let filteredWorkspaces = $derived(
    workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  function navigateToWorkspace(ws: Workspace) {
    if (f7router) {
      f7router.navigate(`/workspace/${ws.id}`);
    } else {
      window.location.hash = `/workspace/${ws.id}`;
    }
  }
</script>

<div class="home-page" style="max-width: 960px; margin: 0 auto; padding: 24px 16px;">
  <!-- Hero Section -->
  <div
    style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); border-radius: 24px; padding: 36px 28px; color: #ffffff; margin-bottom: 32px; box-shadow: 0 12px 30px -6px rgba(15, 118, 110, 0.3);"
  >
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
      <span style="background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">
        ⚡ Active Recall Learning
      </span>
      <span style="font-size: 0.85rem; color: #ccfbf1;">Tanpa Login untuk Guest</span>
    </div>

    <h1 style="font-size: 2.2rem; font-weight: 800; margin: 0 0 12px 0; line-height: 1.2;">
      Kuasai Materi Lebih Cepat dengan Kuis & 3D Flashcards
    </h1>
    <p style="font-size: 1.05rem; line-height: 1.6; color: #e6fffa; margin: 0 0 24px 0; max-width: 680px;">
      Pilih materi atau kuis dari workspace publik di bawah ini. Selesaikan kuis dan nikmati fitur konversi instan soal menjadi flashcard flip 3D untuk memperkuat ingatanmu.
    </p>

    <!-- Search input -->
    <div style="position: relative; max-width: 520px;">
      <input
        type="text"
        placeholder="Cari workspace, materi, atau topik kuis..."
        bind:value={searchQuery}
        style="width: 100%; padding: 14px 20px 14px 44px; border-radius: 12px; border: none; font-size: 0.95rem; color: #0f172a; box-sizing: border-box; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"
      />
      <span style="position: absolute; left: 16px; top: 14px; font-size: 1.1rem; color: #64748b;">🔍</span>
    </div>
  </div>

  <!-- Content Modes Banner -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px;">
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
      <div style="font-size: 1.5rem; margin-bottom: 8px;">📖</div>
      <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; color: #0f172a;">Tipe Materi Saja</h3>
      <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.5;">
        Bahan bacaan terstruktur dengan estimasi waktu baca dan rangkuman inti pembelajaran.
      </p>
    </div>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
      <div style="font-size: 1.5rem; margin-bottom: 8px;">📝</div>
      <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; color: #0f172a;">Tipe Quiz Saja</h3>
      <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.5;">
        Asesmen interaktif langsung dengan evaluasi skor dan penjelasan pembahasan komprehensif.
      </p>
    </div>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
      <div style="font-size: 1.5rem; margin-bottom: 8px;">📚⚡</div>
      <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; color: #0f172a;">Materi & Quiz Digabung</h3>
      <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.5;">
        Pelajari teori terlebih dahulu, lalu langsung uji daya tangkap dengan checkpoint quiz & 3D flashcard!
      </p>
    </div>
  </div>

  <!-- Workspace List Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
    <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: #0f172a;">
      🏛️ Workspace Pembelajaran Publik
    </h2>
    <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">
      {filteredWorkspaces.length} Workspace Tersedia
    </span>
  </div>

  <!-- Workspaces Grid -->
  {#if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8;">
      Sedang memuat workspace publik...
    </div>
  {:else if filteredWorkspaces.length === 0}
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center;">
      <p style="color: #64748b; margin: 0;">Tidak ada workspace yang cocok dengan pencarianmu.</p>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
      {#each filteredWorkspaces as ws}
        <div
          class="workspace-card"
          onclick={() => navigateToWorkspace(ws)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && navigateToWorkspace(ws)}
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.04);"
        >
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div style="font-size: 2.2rem; line-height: 1;">
                {ws.icon || '📚'}
              </div>
              <span style="background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                Publik
              </span>
            </div>

            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; line-height: 1.35;">
              {ws.name}
            </h3>

            {#if ws.description}
              <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0 0 16px 0;">
                {ws.description}
              </p>
            {/if}
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #94a3b8;">
              Kreator: <strong>{ws.creatorName || 'Instructor'}</strong>
            </span>
            <span style="color: #0f766e; font-weight: 700; font-size: 0.85rem;">
              Buka Workspace →
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
