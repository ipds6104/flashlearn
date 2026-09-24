<script lang="ts">
  import { api } from '../stores/api';
  import type { Content } from '@flashlearn/shared';
  import MaterialViewer from '../components/MaterialViewer.svelte';
  import QuizRunner from '../components/QuizRunner.svelte';
  import CombinedModule from '../components/CombinedModule.svelte';

  interface Props {
    f7route?: any;
    f7router?: any;
    contentId?: string;
  }

  let { f7route, f7router, contentId }: Props = $props();

  const id = $derived(contentId || f7route?.params?.id || '');

  let content = $state<Content | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    if (id) {
      loadContent();
    }
  });

  async function loadContent() {
    isLoading = true;
    errorMessage = null;
    try {
      content = await api.contents.get(id);
    } catch (err: any) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    if (f7router) {
      f7router.back();
    } else {
      window.history.back();
    }
  }
</script>

<div class="content-detail-page" style="min-height: 100vh; padding-bottom: 40px;">
  <!-- Sub-navbar Back Bar -->
  <div style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 12px 16px;">
    <div style="max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
      <button
        onclick={goBack}
        style="background: none; border: none; font-size: 0.95rem; font-weight: 700; color: #0f766e; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0;"
      >
        ← Kembali ke Workspace
      </button>

      {#if content}
        <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">
          Tipe: <strong>{content.type.toUpperCase()}</strong>
        </span>
      {/if}
    </div>
  </div>

  {#if isLoading}
    <div style="text-align: center; padding: 60px 16px; color: #94a3b8;">
      Memuat modul pembelajaran...
    </div>
  {:else if errorMessage}
    <div style="max-width: 600px; margin: 40px auto; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 16px; padding: 24px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; color: #b91c1c;">Gagal Memuat Konten</h3>
      <p style="color: #7f1d1d; margin: 0 0 16px 0;">{errorMessage}</p>
      <button
        onclick={goBack}
        style="background: #0f766e; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;"
      >
        Kembali
      </button>
    </div>
  {:else if content}
    <!-- Dynamically Render Based on Triple Content Types -->
    {#if content.type === 'materi'}
      <MaterialViewer {content} onCompleted={() => {}} />
    {:else if content.type === 'quiz'}
      <QuizRunner {content} />
    {:else if content.type === 'combined'}
      <CombinedModule {content} />
    {/if}
  {/if}
</div>
