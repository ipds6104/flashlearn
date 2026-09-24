<script lang="ts">
  import { Page } from 'framework7-svelte';
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

  // Submissions Modal State
  let showSubmissionsModal = $state(false);
  let activeSubmissions = $state<any[]>([]);
  let selectedContentForSubmissions = $state<Content | null>(null);
  let isLoadingSubmissions = $state(false);
  let isExporting = $state(false);

  // Toast / Feedback state
  let copiedLinkId = $state<string | null>(null);

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

  function copyShareLink(c: Content, e: Event) {
    e.stopPropagation();
    const url = `${window.location.origin}/c/${c.id}`;
    navigator.clipboard.writeText(url);
    copiedLinkId = c.id;
    setTimeout(() => (copiedLinkId = null), 2000);
  }

  async function openSubmissions(c: Content, e: Event) {
    e.stopPropagation();
    selectedContentForSubmissions = c;
    showSubmissionsModal = true;
    isLoadingSubmissions = true;
    try {
      activeSubmissions = await api.contents.getSubmissions(c.id);
    } catch (err: any) {
      alert(`Gagal memuat hasil kuis: ${err.message}`);
    } finally {
      isLoadingSubmissions = false;
    }
  }

  async function handleExport(format: 'xlsx' | 'csv') {
    if (!selectedContentForSubmissions) return;
    isExporting = true;
    try {
      await api.contents.downloadExport(selectedContentForSubmissions.id, format);
    } catch (err: any) {
      alert(`Gagal mengekspor: ${err.message}`);
    } finally {
      isExporting = false;
    }
  }

  async function handleRollback(c: Content, e: Event) {
    e.stopPropagation();
    if (!confirm(`Kembalikan (rollback) "${c.title}" ke versi sebelumnya?`)) {
      return;
    }
    try {
      await api.contents.rollback(c.id);
      alert('✓ Konten berhasil di-rollback ke versi sebelumnya!');
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal rollback: ${err.message}`);
    }
  }

  async function handleDeleteContent(c: Content, e: Event) {
    e.stopPropagation();
    if (!confirm(`Hapus konten "${c.title}"? Konten ini dapat dipulihkan kapan saja.`)) {
      return;
    }
    try {
      await api.contents.delete(c.id);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal menghapus konten: ${err.message}`);
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

<Page name="workspace">
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
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);"
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
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

              <div>
                <span style="color: #0f766e; font-weight: 700; font-size: 0.9rem;">
                  Buka Modul →
                </span>
              </div>
            </div>

            <!-- Creator Action Bar -->
            {#if isOwner}
              <div
                style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #f1f5f9; gap: 8px; flex-wrap: wrap;"
                onclick={(e) => e.stopPropagation()}
                role="toolbar"
              >
                <div style="display: flex; gap: 8px; align-items: center;">
                  <!-- Share link -->
                  <button
                    onclick={(e) => copyShareLink(c, e)}
                    style="background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                  >
                    🔗 {copiedLinkId === c.id ? 'Link Tersalin! ✓' : 'Salin Link'}
                  </button>

                  <!-- View Submissions & Analytics (Quiz / Combined) -->
                  {#if c.type !== 'materi'}
                    <button
                      onclick={(e) => openSubmissions(c, e)}
                      style="background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                    >
                      📊 Hasil & Export Excel
                    </button>
                  {/if}
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                  <!-- Rollback to previous version -->
                  <button
                    onclick={(e) => handleRollback(c, e)}
                    title="Kembalikan ke snapshot versi sebelumnya"
                    style="background: #fefce8; border: 1px solid #fef08a; color: #854d0e; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
                  >
                    ↩️ Rollback Versi
                  </button>

                  <!-- Delete (Soft Delete) -->
                  <button
                    onclick={(e) => handleDeleteContent(c, e)}
                    title="Hapus konten ini"
                    style="background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Submissions & Excel Export -->
{#if showSubmissionsModal && selectedContentForSubmissions}
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px;"
    onclick={() => (showSubmissionsModal = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && (showSubmissionsModal = false)}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 780px; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-height: 90vh; display: flex; flex-direction: column;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0 0 4px 0; font-size: 1.35rem; font-weight: 800; color: #0f172a;">
            📊 Rekap Hasil Peserta
          </h2>
          <div style="font-size: 0.9rem; color: #64748b;">
            Modul: <strong>{selectedContentForSubmissions.title}</strong> • Total Percobaan: {activeSubmissions.length}
          </div>
        </div>
        <button
          onclick={() => (showSubmissionsModal = false)}
          style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;"
        >
          ✕
        </button>
      </div>

      <!-- Export Actions Banner -->
      <div
        style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: gap;"
      >
        <span style="font-size: 0.85rem; color: #475569; font-weight: 600;">
          Unduh rekapan tabel (1 baris per peserta/percobaan lengkap dengan timestamp):
        </span>
        <div style="display: flex; gap: 8px;">
          <button
            onclick={() => handleExport('xlsx')}
            disabled={isExporting}
            style="background: #16a34a; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;"
          >
            📥 {isExporting ? 'Mengekspor...' : 'Export Excel (.xlsx)'}
          </button>
          <button
            onclick={() => handleExport('csv')}
            disabled={isExporting}
            style="background: #334155; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer;"
          >
            Export CSV
          </button>
        </div>
      </div>

      <!-- Submissions Table -->
      <div style="flex: 1; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        {#if isLoadingSubmissions}
          <div style="text-align: center; padding: 48px; color: #94a3b8;">
            Memuat data peserta...
          </div>
        {:else if activeSubmissions.length === 0}
          <div style="text-align: center; padding: 48px; color: #64748b;">
            Belum ada peserta yang mengerjakan kuis ini.
          </div>
        {:else}
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                <th style="padding: 12px 14px;">No</th>
                <th style="padding: 12px 14px;">Nama Peserta</th>
                <th style="padding: 12px 14px;">Nilai (%)</th>
                <th style="padding: 12px 14px;">Skor Benar</th>
                <th style="padding: 12px 14px;">Status</th>
                <th style="padding: 12px 14px;">Waktu Pengerjaan</th>
              </tr>
            </thead>
            <tbody>
              {#each activeSubmissions as sub, idx}
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 14px; color: #94a3b8;">{idx + 1}</td>
                  <td style="padding: 12px 14px; font-weight: 700; color: #0f172a;">
                    {sub.guestName || sub.userName || 'Anonim'}
                  </td>
                  <td style="padding: 12px 14px; font-weight: 800; color: {sub.percentage >= 70 ? '#16a34a' : '#dc2626'};">
                    {sub.percentage}%
                  </td>
                  <td style="padding: 12px 14px; color: #475569;">
                    {sub.score} / {sub.totalQuestions}
                  </td>
                  <td style="padding: 12px 14px;">
                    <span
                      style="padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: {sub.percentage >= 70 ? '#dcfce7' : '#fee2e2'}; color: {sub.percentage >= 70 ? '#15803d' : '#b91c1c'};"
                    >
                      {sub.percentage >= 70 ? 'Lulus' : 'Belum Lulus'}
                    </span>
                  </td>
                  <td style="padding: 12px 14px; color: #64748b; font-size: 0.8rem;">
                    {new Date(sub.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </div>
{/if}

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
</Page>
