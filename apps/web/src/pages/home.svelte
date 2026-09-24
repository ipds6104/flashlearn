<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import type { Workspace } from '@flashlearn/shared';
  import Icon from '../components/ui/Icon.svelte';
  import ChipBadge from '../components/ui/ChipBadge.svelte';

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

<Page name="home">
  <div class="home-page" style="max-width: 960px; margin: 0 auto; padding: 24px 16px;">
  <!-- Hero Section -->
  <div
    style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); border-radius: 24px; padding: 36px 28px; color: #ffffff; margin-bottom: 32px; box-shadow: 0 12px 30px -6px rgba(15, 118, 110, 0.3);"
  >
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
      <span style="background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 0.775rem; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px;">
        <Icon name="bolt" size={13} strokeWidth={2.4} />
        <span>Active Recall Learning</span>
      </span>
      <span style="font-size: 0.825rem; color: #ccfbf1;">Tanpa Login untuk Guest</span>
    </div>

    <h1 style="font-size: 2.1rem; font-weight: 800; margin: 0 0 12px 0; line-height: 1.25; letter-spacing: -0.02em;">
      Kuasai Materi Lebih Cepat dengan Kuis & 3D Flashcards
    </h1>
    <p style="font-size: 1rem; line-height: 1.6; color: #e6fffa; margin: 0 0 24px 0; max-width: 680px;">
      Pilih materi atau kuis dari workspace publik di bawah ini. Selesaikan kuis dan nikmati fitur konversi instan soal menjadi flashcard flip 3D untuk memperkuat ingatanmu.
    </p>

    <!-- Search input -->
    <div style="position: relative; max-width: 520px;">
      <input
        type="text"
        placeholder="Cari workspace, materi, atau topik kuis..."
        bind:value={searchQuery}
        style="width: 100%; padding: 13px 20px 13px 42px; border-radius: 12px; border: none; font-size: 0.95rem; color: #0f172a; box-sizing: border-box; box-shadow: 0 4px 16px rgba(0,0,0,0.1); outline: none;"
      />
      <span style="position: absolute; left: 15px; top: 14px; color: #94a3b8; display: flex; align-items: center;">
        <Icon name="search" size={18} />
      </span>
    </div>
  </div>

  <!-- Content Modes Banner -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px;">
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
      <div style="width: 40px; height: 40px; border-radius: 10px; background: #eff6ff; color: #1d4ed8; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <Icon name="book-open" size={20} />
      </div>
      <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">Materi Saja</h3>
      <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
        Bahan bacaan terstruktur dengan estimasi waktu baca dan rangkuman inti pembelajaran.
      </p>
    </div>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
      <div style="width: 40px; height: 40px; border-radius: 10px; background: #fefce8; color: #854d0e; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <Icon name="check-circle" size={20} />
      </div>
      <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">Kuis Interaktif</h3>
      <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
        Asesmen interaktif langsung dengan evaluasi skor dan penjelasan pembahasan komprehensif.
      </p>
    </div>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
      <div style="width: 40px; height: 40px; border-radius: 10px; background: #f0fdfa; color: #0f766e; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <Icon name="layers" size={20} />
      </div>
      <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">Materi & Kuis Gabungan</h3>
      <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
        Pelajari teori terlebih dahulu, lalu langsung uji daya tangkap dengan checkpoint kuis & 3D flashcards!
      </p>
    </div>
  </div>

  <!-- Workspace List Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
      <Icon name="layers" size={18} style="color: #0f766e;" />
      <span>Workspace Pembelajaran Publik</span>
    </h2>
    <span style="font-size: 0.825rem; color: #64748b; font-weight: 600;">
      {filteredWorkspaces.length} Workspace Tersedia
    </span>
  </div>

  <!-- Workspaces Grid -->
  {#if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
      Sedang memuat workspace publik...
    </div>
  {:else if filteredWorkspaces.length === 0}
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center;">
      <p style="color: #64748b; margin: 0; font-weight: 500;">Tidak ada workspace yang cocok dengan pencarianmu.</p>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;">
      {#each filteredWorkspaces as ws}
        <div
          class="workspace-card"
          onclick={() => navigateToWorkspace(ws)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && navigateToWorkspace(ws)}
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.02);"
        >
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0;">
                {ws.icon || '📚'}
              </div>
              <ChipBadge variant="neutral" label="Publik" />
            </div>

            <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; color: #0f172a; font-weight: 700; overflow-wrap: break-word; line-height: 1.3;">
              {ws.name}
            </h3>

            {#if ws.description}
              <p style="margin: 0 0 16px 0; font-size: 0.85rem; color: #64748b; line-height: 1.45; overflow-wrap: break-word;">
                {ws.description}
              </p>
            {/if}
          </div>

          <div
            style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 0.8rem; color: #64748b;"
          >
            <span>Dikelola: <strong>{ws.creatorName || 'Creator'}</strong></span>
            <span style="color: #0f766e; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
              <span>Buka</span>
              <Icon name="chevron-right" size={13} />
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  </div>
</Page>
