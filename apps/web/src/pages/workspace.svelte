<script lang="ts">
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace, Content, ContentType } from '@flashlearn/shared';

  interface Props {
    f7route?: any;
    f7router?: any;
    workspaceId?: string;
  }

  let { f7route, f7router, workspaceId }: Props = $props();

  const id = $derived(workspaceId || f7route?.params?.id || '');

  let workspace = $state<Workspace | null>(null);
  let contents = $state<Content[]>([]);
  let isLoading = $state(true);
  let activeFilter = $state<string>('all');

  // Creator Content Creation Modal state
  let showCreateModal = $state(false);
  let newTitle = $state('');
  let newType = $state<ContentType>('materi');
  let newSummary = $state('');
  let newReadingTime = $state(5);
  let newBody = $state('');
  let isSavingContent = $state(false);

  $effect(() => {
    if (id) {
      loadWorkspaceData();
    }
  });

  async function loadWorkspaceData() {
    isLoading = true;
    try {
      workspace = await api.workspaces.get(id);
      contents = await api.contents.listByWorkspace(id);
    } catch (err: any) {
      alert(`Gagal memuat workspace: ${err.message}`);
    } finally {
      isLoading = false;
    }
  }

  let isOwner = $derived(
    auth.isSuperadmin || (auth.isLoggedIn && workspace?.creatorId === auth.user?.id)
  );

  let filteredContents = $derived(
    activeFilter === 'all'
      ? contents
      : contents.filter((c) => c.type === activeFilter)
  );

  function navigateToContent(c: Content) {
    if (f7router) {
      f7router.navigate(`/content/${c.id}`);
    } else {
      window.location.hash = `/content/${c.id}`;
    }
  }

  async function handleCreateContent(e: Event) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    isSavingContent = true;
    try {
      await api.contents.create({
        workspaceId: id,
        title: newTitle.trim(),
        type: newType,
        summary: newSummary.trim() || undefined,
        readingTimeMinutes: newReadingTime,
        body: newType !== 'quiz' ? newBody : undefined,
        questions: newType !== 'materi' ? [
          {
            id: `q_${Date.now()}`,
            question: `Soal uji untuk materi ${newTitle}?`,
            options: [
              { id: 'opt_1', text: 'Pilihan A (Benar)', isCorrect: true },
              { id: 'opt_2', text: 'Pilihan B (Salah)' },
              { id: 'opt_3', text: 'Pilihan C (Salah)' },
            ],
            explanation: 'Ini adalah pembahasan jawaban yang benar.',
            difficulty: 'medium',
          }
        ] : undefined,
      });

      showCreateModal = false;
      newTitle = '';
      newSummary = '';
      newBody = '';
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal membuat konten: ${err.message}`);
    } finally {
      isSavingContent = false;
    }
  }
</script>

<div class="workspace-page" style="max-width: 900px; margin: 0 auto; padding: 20px 16px;">
  {#if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8;">
      Memuat detail workspace...
    </div>
  {:else if workspace}
    <!-- Workspace Header -->
    <div
      style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px 24px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="font-size: 2.8rem; line-height: 1;">{workspace.icon || '📚'}</div>
          <div>
            <h1 style="margin: 0 0 4px 0; font-size: 1.7rem; color: #0f172a; font-weight: 800;">
              {workspace.name}
            </h1>
            <div style="font-size: 0.85rem; color: #64748b;">
              Dikelola oleh <strong>{workspace.creatorName || 'Creator'}</strong>
            </div>
          </div>
        </div>

        {#if isOwner}
          <button
            onclick={() => (showCreateModal = true)}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 6px;"
          >
            + Tambah Konten
          </button>
        {/if}
      </div>

      {#if workspace.description}
        <p style="margin: 0; font-size: 0.975rem; line-height: 1.6; color: #475569;">
          {workspace.description}
        </p>
      {/if}
    </div>

    <!-- Filters Bar -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
      <button
        onclick={() => (activeFilter = 'all')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; background: {activeFilter === 'all' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'all' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        Semua Konten ({contents.length})
      </button>
      <button
        onclick={() => (activeFilter = 'materi')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; background: {activeFilter === 'materi' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'materi' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        📖 Materi Saja
      </button>
      <button
        onclick={() => (activeFilter = 'quiz')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; background: {activeFilter === 'quiz' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'quiz' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        📝 Quiz Saja
      </button>
      <button
        onclick={() => (activeFilter = 'combined')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; background: {activeFilter === 'combined' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'combined' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        📚⚡ Materi & Quiz Digabung
      </button>
    </div>

    <!-- Contents List -->
    {#if filteredContents.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 48px 24px; text-align: center;">
        <p style="color: #64748b; margin: 0 0 12px 0;">Belum ada konten pada kategori ini.</p>
        {#if isOwner}
          <button
            onclick={() => (showCreateModal = true)}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer;"
          >
            Buat Konten Sekarang
          </button>
        {/if}
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 14px;">
        {#each filteredContents as c}
          <div
            class="content-card"
            onclick={() => navigateToContent(c)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && navigateToContent(c)}
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s ease; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03);"
          >
            <div style="flex: 1; padding-right: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                {#if c.type === 'materi'}
                  <span class="badge-materi">📖 Materi Saja</span>
                {:else if c.type === 'quiz'}
                  <span class="badge-quiz">📝 Quiz Saja</span>
                {:else}
                  <span class="badge-combined">📚⚡ Materi + Quiz</span>
                {/if}

                {#if c.readingTimeMinutes}
                  <span style="font-size: 0.75rem; color: #94a3b8;">
                    ⏱️ ~{c.readingTimeMinutes} Menit
                  </span>
                {/if}
              </div>

              <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; color: #0f172a; font-weight: 700;">
                {c.title}
              </h3>

              {#if c.summary}
                <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.4;">
                  {c.summary}
                </p>
              {/if}
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: #0f766e; font-weight: 700; font-size: 0.9rem;">
                Mulai Belajar →
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Create Content for Creator/Admin -->
{#if showCreateModal}
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;"
    onclick={() => (showCreateModal = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && (showCreateModal = false)}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 600px; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a;">
          ✍️ Tambah Konten Baru
        </h2>
        <button
          onclick={() => (showCreateModal = false)}
          style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;"
        >
          ✕
        </button>
      </div>

      <form onsubmit={handleCreateContent} style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Tipe Konten Pembelajaran
          </label>
          <select
            bind:value={newType}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;"
          >
            <option value="materi">📖 Materi Saja</option>
            <option value="quiz">📝 Quiz Saja</option>
            <option value="combined">📚⚡ Materi & Quiz Digabung</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Judul Modul
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Pengenalan Clean Architecture..."
            bind:value={newTitle}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;"
          />
        </div>

        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Ringkasan Inti
          </label>
          <input
            type="text"
            placeholder="Rangkuman 1-2 kalimat untuk preview..."
            bind:value={newSummary}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;"
          />
        </div>

        {#if newType !== 'quiz'}
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
              Isi Materi (Markdown)
            </label>
            <textarea
              rows="6"
              placeholder="Tuliskan isi modul pembelajaran di sini..."
              bind:value={newBody}
              style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; font-family: inherit; box-sizing: border-box;"
            ></textarea>
          </div>
        {/if}

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 10px;">
          <button
            type="button"
            onclick={() => (showCreateModal = false)}
            style="background: #f1f5f9; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSavingContent}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer;"
          >
            {isSavingContent ? 'Menyimpan...' : 'Simpan Konten'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
