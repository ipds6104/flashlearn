<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace, Content } from '@flashlearn/shared';
  import ContentEditorModal from '../components/ContentEditorModal.svelte';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.svelte';

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

  // Creator Content Editor Modal state (Create & Edit)
  let showEditorModal = $state(false);
  let contentToEdit = $state<Content | null>(null);

  // Soft Delete confirmation modal state
  let showDeleteModal = $state(false);
  let contentToDelete = $state<Content | null>(null);
  let isDeleting = $state(false);
  let isRestoring = $state(false);

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

  let activeContents = $derived(contents.filter((c) => !c.deletedAt));
  let deletedContents = $derived(contents.filter((c) => !!c.deletedAt));

  let filteredContents = $derived(
    activeFilter === 'trash'
      ? deletedContents
      : activeFilter === 'all'
      ? activeContents
      : activeContents.filter((c) => c.type === activeFilter)
  );

  function navigateToContent(c: Content) {
    if (c.deletedAt) return; // Cannot view soft-deleted content directly
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

  function openCreateModal() {
    contentToEdit = null;
    showEditorModal = true;
  }

  function openEditModal(c: Content, e: Event) {
    e.stopPropagation();
    contentToEdit = c;
    showEditorModal = true;
  }

  async function handleContentSaved(savedContent: Content) {
    showEditorModal = false;
    contentToEdit = null;
    await loadWorkspaceData();
  }

  function openDeleteModal(c: Content, e: Event) {
    e.stopPropagation();
    contentToDelete = c;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!contentToDelete) return;
    isDeleting = true;
    try {
      await api.contents.delete(contentToDelete.id);
      showDeleteModal = false;
      contentToDelete = null;
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal menghapus modul: ${err.message}`);
    } finally {
      isDeleting = false;
    }
  }

  async function handleRestoreContent(c: Content, e: Event) {
    e.stopPropagation();
    isRestoring = true;
    try {
      await api.contents.restore(c.id);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal memulihkan modul: ${err.message}`);
    } finally {
      isRestoring = false;
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
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; flex-wrap: wrap;">
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
            onclick={openCreateModal}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);"
          >
            <span>+</span> Buat Modul / Kuis
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
    <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; align-items: center;">
      <button
        onclick={() => (activeFilter = 'all')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; background: {activeFilter === 'all' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'all' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        Semua Modul ({activeContents.length})
      </button>
      <button
        onclick={() => (activeFilter = 'materi')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; background: {activeFilter === 'materi' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'materi' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        📖 Materi Saja ({activeContents.filter(c => c.type === 'materi').length})
      </button>
      <button
        onclick={() => (activeFilter = 'quiz')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; background: {activeFilter === 'quiz' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'quiz' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        📝 Quiz Saja ({activeContents.filter(c => c.type === 'quiz').length})
      </button>
      <button
        onclick={() => (activeFilter = 'combined')}
        style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; background: {activeFilter === 'combined' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'combined' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        📚⚡ Materi & Quiz ({activeContents.filter(c => c.type === 'combined').length})
      </button>

      {#if isOwner && deletedContents.length > 0}
        <button
          onclick={() => (activeFilter = 'trash')}
          style="padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; background: {activeFilter === 'trash' ? '#e11d48' : '#fef2f2'}; color: {activeFilter === 'trash' ? '#ffffff' : '#be123c'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-left: auto;"
        >
          🗑️ Arsip / Terhapus ({deletedContents.length})
        </button>
      {/if}
    </div>

    <!-- Contents List -->
    {#if filteredContents.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 48px 24px; text-align: center;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">
          {activeFilter === 'trash' ? '✨' : '📝'}
        </div>
        <p style="color: #64748b; margin: 0 0 12px 0; font-weight: 600;">
          {activeFilter === 'trash'
            ? 'Tidak ada modul di arsip terhapus.'
            : 'Belum ada konten pada kategori ini.'}
        </p>
        {#if isOwner && activeFilter !== 'trash'}
          <button
            onclick={openCreateModal}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer;"
          >
            Buat Modul Sekarang
          </button>
        {/if}
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 14px;">
        {#each filteredContents as c}
          {#if activeFilter === 'trash'}
            <!-- Soft Deleted Item Card in Trash Tab -->
            <div
              style="background: #fff7ed; border: 1.5px dashed #fdba74; border-radius: 16px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;"
            >
              <div style="flex: 1; min-width: 240px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="background: #fed7aa; color: #9a3412; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                    🗑️ Terhapus (Arsip)
                  </span>
                  <span style="font-size: 0.75rem; color: #9a3412;">
                    Tipe: {c.type.toUpperCase()}
                  </span>
                </div>
                <h3 style="margin: 0 0 4px 0; font-size: 1.1rem; color: #7c2d12; font-weight: 700;">
                  {c.title}
                </h3>
                <div style="font-size: 0.8rem; color: #9a3412;">
                  Dihapus pada: {c.deletedAt ? new Date(c.deletedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </div>
              </div>

              <div>
                <button
                  onclick={(e) => handleRestoreContent(c, e)}
                  disabled={isRestoring}
                  style="background: #0f766e; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(15,118,110,0.25);"
                >
                  ♻️ {isRestoring ? 'Memulihkan...' : 'Pulihkan Modul'}
                </button>
              </div>
            </div>
          {:else}
            <!-- Active Content Card -->
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
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                    {#if c.type === 'materi'}
                      <span class="badge-materi">📖 Materi Saja</span>
                    {:else if c.type === 'quiz'}
                      <span class="badge-quiz">📝 Quiz Saja</span>
                    {:else}
                      <span class="badge-combined">📚⚡ Materi + Quiz</span>
                    {/if}

                    {#if c.questions && c.questions.length > 0}
                      <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                        {c.questions.length} Butir Soal
                      </span>
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
                  <span style="color: #0f766e; font-weight: 700; font-size: 0.9rem; white-space: nowrap;">
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
                  <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
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
                    <!-- Edit Module Button -->
                    <button
                      onclick={(e) => openEditModal(c, e)}
                      title="Edit judul, materi, atau butir kuis"
                      style="background: #0f766e; border: none; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(15, 118, 110, 0.2);"
                    >
                      ✏️ Edit Modul
                    </button>

                    <!-- Rollback to previous version -->
                    <button
                      onclick={(e) => handleRollback(c, e)}
                      title="Kembalikan ke snapshot versi sebelumnya"
                      style="background: #fefce8; border: 1px solid #fef08a; color: #854d0e; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
                    >
                      ↩️ Rollback
                    </button>

                    <!-- Delete (Soft Delete) -->
                    <button
                      onclick={(e) => openDeleteModal(c, e)}
                      title="Hapus modul ini (dapat dipulihkan kapan saja)"
                      style="background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
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

<!-- Content Editor Modal (Create & Edit) -->
<ContentEditorModal
  isOpen={showEditorModal}
  workspaceId={id}
  contentToEdit={contentToEdit}
  onClose={() => (showEditorModal = false)}
  onSaved={handleContentSaved}
/>

<!-- Soft Delete Confirmation Modal -->
<ConfirmDeleteModal
  isOpen={showDeleteModal}
  title={contentToDelete?.title || ''}
  itemType={contentToDelete?.type === 'quiz' ? 'Kuis' : contentToDelete?.type === 'materi' ? 'Materi' : 'Modul'}
  isProcessing={isDeleting}
  onClose={() => (showDeleteModal = false)}
  onConfirm={confirmDelete}
/>
</Page>
