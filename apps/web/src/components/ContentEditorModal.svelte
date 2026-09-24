<script lang="ts">
  import { api } from '../stores/api';
  import type { Content, ContentType, QuizQuestion, QuizOption } from '@flashlearn/shared';
  import Icon from './ui/Icon.svelte';
  import ChipBadge from './ui/ChipBadge.svelte';

  interface Props {
    isOpen: boolean;
    workspaceId: string;
    contentToEdit?: Content | null;
    onClose: () => void;
    onSaved: (content: Content) => void;
  }

  let {
    isOpen,
    workspaceId,
    contentToEdit = null,
    onClose,
    onSaved,
  }: Props = $props();

  let isEditMode = $derived(!!contentToEdit);

  // Form Fields
  let title = $state('');
  let type = $state<ContentType>('quiz');
  let summary = $state('');
  let readingTimeMinutes = $state(5);
  let body = $state('');
  let isPublished = $state(true);
  let questions = $state<QuizQuestion[]>([]);

  // UI state
  let activeTab = $state<'info' | 'questions' | 'preview'>('info');
  let isSaving = $state(false);
  let validationError = $state<string | null>(null);

  // Synchronize form whenever modal opens or contentToEdit changes
  $effect(() => {
    if (isOpen) {
      validationError = null;
      if (contentToEdit) {
        title = contentToEdit.title;
        type = contentToEdit.type;
        summary = contentToEdit.summary || '';
        readingTimeMinutes = contentToEdit.readingTimeMinutes || 5;
        body = contentToEdit.body || '';
        isPublished = contentToEdit.isPublished ?? true;

        if (contentToEdit.questions && contentToEdit.questions.length > 0) {
          questions = JSON.parse(JSON.stringify(contentToEdit.questions));
        } else if (contentToEdit.type !== 'materi') {
          questions = [createBlankQuestion(1)];
        } else {
          questions = [];
        }
        activeTab = contentToEdit.type === 'materi' ? 'info' : 'questions';
      } else {
        title = '';
        type = 'quiz';
        summary = '';
        readingTimeMinutes = 5;
        body = '';
        isPublished = true;
        questions = [createBlankQuestion(1)];
        activeTab = 'info';
      }
    }
  });

  function createBlankQuestion(index: number): QuizQuestion {
    return {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question: '',
      difficulty: 'medium',
      explanation: '',
      hint: '',
      options: [
        { id: `opt_1_${Date.now()}`, text: '', isCorrect: true },
        { id: `opt_2_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt_3_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt_4_${Date.now()}`, text: '', isCorrect: false },
      ],
    };
  }

  function addQuestion() {
    questions = [...questions, createBlankQuestion(questions.length + 1)];
    validationError = null;
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) {
      alert('Kuis harus memiliki minimal 1 butir soal.');
      return;
    }
    questions = questions.filter((_, i) => i !== index);
    validationError = null;
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;
    questions = [...questions];
  }

  function addOption(qIndex: number) {
    const q = questions[qIndex];
    if (q.options.length >= 6) {
      alert('Maksimal 6 pilihan jawaban per soal.');
      return;
    }
    const newOpt: QuizOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      text: '',
      isCorrect: false,
    };
    q.options = [...q.options, newOpt];
    questions = [...questions];
  }

  function removeOption(qIndex: number, optIndex: number) {
    const q = questions[qIndex];
    if (q.options.length <= 2) {
      alert('Setiap soal harus memiliki minimal 2 pilihan jawaban.');
      return;
    }
    const wasCorrect = q.options[optIndex].isCorrect;
    q.options = q.options.filter((_, i) => i !== optIndex);
    if (wasCorrect && q.options.length > 0) {
      q.options[0].isCorrect = true;
    }
    questions = [...questions];
  }

  function setCorrectOption(qIndex: number, optIndex: number) {
    const q = questions[qIndex];
    q.options = q.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex,
    }));
    questions = [...questions];
    validationError = null;
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  function validate(): boolean {
    if (!title.trim()) {
      validationError = 'Judul modul tidak boleh kosong.';
      activeTab = 'info';
      return false;
    }

    if (type !== 'quiz' && !body.trim()) {
      validationError = 'Isi materi tidak boleh kosong untuk tipe Materi atau Gabungan.';
      activeTab = 'info';
      return false;
    }

    if (type !== 'materi') {
      if (questions.length === 0) {
        validationError = 'Kuis harus memiliki minimal 1 butir soal.';
        activeTab = 'questions';
        return false;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) {
          validationError = `Teks pertanyaan pada Soal #${i + 1} belum diisi.`;
          activeTab = 'questions';
          return false;
        }

        if (q.options.length < 2) {
          validationError = `Soal #${i + 1} harus memiliki minimal 2 pilihan jawaban.`;
          activeTab = 'questions';
          return false;
        }

        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          validationError = `Soal #${i + 1} belum memiliki kunci jawaban benar.`;
          activeTab = 'questions';
          return false;
        }

        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            validationError = `Pilihan ${optionLetters[j]} pada Soal #${i + 1} belum memiliki teks jawaban.`;
            activeTab = 'questions';
            return false;
          }
        }
      }
    }

    validationError = null;
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    isSaving = true;
    try {
      let saved: Content;
      if (isEditMode && contentToEdit) {
        saved = await api.contents.update(contentToEdit.id, {
          title: title.trim(),
          type,
          summary: summary.trim() || undefined,
          readingTimeMinutes,
          body: type !== 'quiz' ? body.trim() : undefined,
          questions: type !== 'materi' ? questions : undefined,
          isPublished,
        });
      } else {
        saved = await api.contents.create({
          workspaceId,
          title: title.trim(),
          type,
          summary: summary.trim() || undefined,
          readingTimeMinutes,
          body: type !== 'quiz' ? body.trim() : undefined,
          questions: type !== 'materi' ? questions : undefined,
          isPublished,
        });
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      validationError = err.message || 'Gagal menyimpan modul kuis';
    } finally {
      isSaving = false;
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 12px; -webkit-overflow-scrolling: touch;"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <!-- Modal Window -->
    <div
      style="background: #ffffff; width: 100%; max-width: 820px; max-height: 94vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3); overflow: hidden;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Modal Header -->
      <div
        style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #ffffff; flex-shrink: 0; gap: 12px;"
      >
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
          <div
            style="width: 36px; height: 36px; border-radius: 9px; background: {type === 'quiz' ? '#ccfbf1' : type === 'materi' ? '#eff6ff' : '#fef3c7'}; color: {type === 'quiz' ? '#0f766e' : type === 'materi' ? '#1d4ed8' : '#b45309'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
          >
            <Icon name={type === 'quiz' ? 'check-circle' : type === 'materi' ? 'book-open' : 'layers'} size={18} />
          </div>
          <div style="min-width: 0; flex: 1;">
            <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {isEditMode ? 'Edit Modul Pembelajaran' : 'Buat Modul Baru'}
            </h2>
            <div style="font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {isEditMode ? `Memperbarui "${contentToEdit?.title}"` : 'Susun materi dan bank soal kuis'}
            </div>
          </div>
        </div>

        <button
          onclick={onClose}
          aria-label="Tutup modal"
          style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0;"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div
        style="padding: 6px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; flex-shrink: 0;"
      >
        <button
          type="button"
          onclick={() => (activeTab = 'info')}
          style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 0; background: {activeTab === 'info' ? '#0f766e' : 'transparent'}; color: {activeTab === 'info' ? '#ffffff' : '#64748b'};"
        >
          <Icon name="info-circle" size={14} />
          <span>Info Modul</span>
        </button>

        {#if type !== 'materi'}
          <button
            type="button"
            onclick={() => (activeTab = 'questions')}
            style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 0; background: {activeTab === 'questions' ? '#0f766e' : 'transparent'}; color: {activeTab === 'questions' ? '#ffffff' : '#64748b'};"
          >
            <Icon name="check-circle" size={14} />
            <span>Butir Soal ({questions.length})</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'preview')}
            style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 0; background: {activeTab === 'preview' ? '#0f766e' : 'transparent'}; color: {activeTab === 'preview' ? '#ffffff' : '#64748b'};"
          >
            <Icon name="eye" size={14} />
            <span>Pratinjau</span>
          </button>
        {/if}
      </div>

      <!-- Error / Validation Alert Banner -->
      {#if validationError}
        <div
          style="background: #fef2f2; border-bottom: 1px solid #fecaca; color: #b91c1c; padding: 10px 16px; font-size: 0.825rem; font-weight: 600; display: flex; align-items: center; gap: 8px; flex-shrink: 0;"
        >
          <Icon name="exclamation-circle" size={16} />
          <span>{validationError}</span>
        </div>
      {/if}

      <!-- Modal Body (Scrollable) -->
      <div style="flex: 1; overflow-y: auto; padding: 18px; -webkit-overflow-scrolling: touch;">
        <!-- TAB 1: INFO MODUL -->
        {#if activeTab === 'info'}
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Content Type Selector -->
            <div>
              <label for="fl-content-type" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 8px;">
                Tipe Modul Pembelajaran
              </label>
              <div id="fl-content-type" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                <button
                  type="button"
                  onclick={() => (type = 'quiz')}
                  style="text-align: left; padding: 12px; border-radius: 10px; border: 2px solid {type === 'quiz' ? '#0f766e' : '#e2e8f0'}; background: {type === 'quiz' ? '#f0fdfa' : '#ffffff'}; cursor: pointer;"
                >
                  <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
                    <Icon name="check-circle" size={15} style="color: #0f766e;" />
                    <span>Kuis Saja</span>
                  </div>
                  <div style="font-size: 0.775rem; color: #64748b; line-height: 1.3;">
                    Asesmen interaktif, skor otomatis & 3D flashcards.
                  </div>
                </button>

                <button
                  type="button"
                  onclick={() => (type = 'materi')}
                  style="text-align: left; padding: 12px; border-radius: 10px; border: 2px solid {type === 'materi' ? '#0f766e' : '#e2e8f0'}; background: {type === 'materi' ? '#f0fdfa' : '#ffffff'}; cursor: pointer;"
                >
                  <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
                    <Icon name="book-open" size={15} style="color: #1d4ed8;" />
                    <span>Materi Saja</span>
                  </div>
                  <div style="font-size: 0.775rem; color: #64748b; line-height: 1.3;">
                    Bahan bacaan artikel / teori dengan format Markdown.
                  </div>
                </button>

                <button
                  type="button"
                  onclick={() => (type = 'combined')}
                  style="text-align: left; padding: 12px; border-radius: 10px; border: 2px solid {type === 'combined' ? '#0f766e' : '#e2e8f0'}; background: {type === 'combined' ? '#f0fdfa' : '#ffffff'}; cursor: pointer;"
                >
                  <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
                    <Icon name="layers" size={15} style="color: #0f766e;" />
                    <span>Materi + Kuis</span>
                  </div>
                  <div style="font-size: 0.775rem; color: #64748b; line-height: 1.3;">
                    Bahan teori di awal dilanjutkan evaluasi pemahaman.
                  </div>
                </button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label for="fl-title-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                Judul Modul <span style="color: #ef4444;">*</span>
              </label>
              <input
                id="fl-title-input"
                type="text"
                placeholder="Contoh: Validasi Topologi Peta Wilkerstat SE2026..."
                bind:value={title}
                style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; outline: none;"
              />
            </div>

            <!-- Summary -->
            <div>
              <label for="fl-summary-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                Ringkasan / Deskripsi Singkat
              </label>
              <input
                id="fl-summary-input"
                type="text"
                placeholder="Rangkuman 1-2 kalimat untuk preview modul..."
                bind:value={summary}
                style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; outline: none;"
              />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <!-- Reading / Quiz time -->
              <div>
                <label for="fl-time-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                  Estimasi Waktu (Menit)
                </label>
                <input
                  id="fl-time-input"
                  type="number"
                  min="1"
                  max="120"
                  bind:value={readingTimeMinutes}
                  style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; outline: none;"
                />
              </div>

              <!-- Publication Status -->
              <div>
                <label for="fl-status-select" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                  Status Publikasi
                </label>
                <select
                  id="fl-status-select"
                  bind:value={isPublished}
                  style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; background: #ffffff;"
                >
                  <option value={true}>Terbitkan Sekarang (Aktif)</option>
                  <option value={false}>Draf (Belum Terbit)</option>
                </select>
              </div>
            </div>

            <!-- Material Body Markdown for Non-Quiz Types -->
            {#if type !== 'quiz'}
              <div>
                <label for="fl-body-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                  Isi Materi Teori (Markdown)
                </label>
                <textarea
                  id="fl-body-input"
                  rows="7"
                  placeholder="# Judul Topik Teori&#10;&#10;Jelaskan materi pembelajaran di sini menggunakan format Markdown..."
                  bind:value={body}
                  style="width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: monospace; box-sizing: border-box; line-height: 1.5;"
                ></textarea>
              </div>
            {/if}
          </div>
        {/if}

        <!-- TAB 2: BUTIR SOAL KUIS -->
        {#if activeTab === 'questions'}
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div>
                <div style="font-weight: 800; font-size: 1rem; color: #0f172a;">
                  Daftar Butir Soal Kuis
                </div>
                <div style="font-size: 0.8rem; color: #64748b;">
                  Pilih kunci jawaban benar dengan menekan tombol centang pada opsi yang sesuai.
                </div>
              </div>

              <button
                type="button"
                onclick={addQuestion}
                style="background: #0f766e; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(15,118,110,0.25); white-space: nowrap;"
              >
                <Icon name="plus" size={14} />
                <span>Tambah Soal</span>
              </button>
            </div>

            {#each questions as q, qIdx}
              <div
                style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);"
              >
                <!-- Question Card Top Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span
                      style="background: #0f766e; color: #ffffff; font-weight: 800; font-size: 0.775rem; padding: 2px 8px; border-radius: 6px;"
                    >
                      Soal #{qIdx + 1}
                    </span>

                    <!-- Difficulty selector -->
                    <select
                      bind:value={q.difficulty}
                      style="font-size: 0.75rem; font-weight: 700; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 6px; background: #f8fafc; color: #475569;"
                    >
                      <option value="easy">Mudah</option>
                      <option value="medium">Sedang</option>
                      <option value="hard">Sulit</option>
                    </select>
                  </div>

                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button
                      type="button"
                      disabled={qIdx === 0}
                      onclick={() => moveQuestion(qIdx, 'up')}
                      title="Pindahkan ke atas"
                      aria-label="Pindahkan ke atas"
                      style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; opacity: {qIdx === 0 ? '0.35' : '1'};"
                    >
                      <Icon name="arrow-up" size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={qIdx === questions.length - 1}
                      onclick={() => moveQuestion(qIdx, 'down')}
                      title="Pindahkan ke bawah"
                      aria-label="Pindahkan ke bawah"
                      style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; opacity: {qIdx === questions.length - 1 ? '0.35' : '1'};"
                    >
                      <Icon name="arrow-down" size={12} />
                    </button>
                    <button
                      type="button"
                      onclick={() => removeQuestion(qIdx)}
                      title="Hapus soal ini"
                      aria-label="Hapus soal ini"
                      style="background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                    >
                      <Icon name="trash" size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                <!-- Question Text -->
                <div>
                  <textarea
                    rows="2"
                    placeholder="Tuliskan pertanyaan soal #{qIdx + 1}..."
                    bind:value={q.question}
                    style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit; box-sizing: border-box; outline: none; line-height: 1.4;"
                  ></textarea>
                </div>

                <!-- Multiple-choice Options Builder -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 700; font-size: 0.825rem; color: #334155;">
                      Pilihan Jawaban (Tandai kunci yang benar):
                    </span>
                    {#if q.options.length < 6}
                      <button
                        type="button"
                        onclick={() => addOption(qIdx)}
                        style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f766e; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                      >
                        <Icon name="plus" size={12} />
                        <span>Tambah Opsi</span>
                      </button>
                    {/if}
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    {#each q.options as opt, optIdx}
                      <div
                        style="display: flex; align-items: center; gap: 8px; background: {opt.isCorrect ? '#f0fdf4' : '#f8fafc'}; border: 1.5px solid {opt.isCorrect ? '#86efac' : '#e2e8f0'}; border-radius: 10px; padding: 6px 10px;"
                      >
                        <!-- Correct Answer Radio Button -->
                        <button
                          type="button"
                          onclick={() => setCorrectOption(qIdx, optIdx)}
                          title="Klik untuk jadikan kunci jawaban benar"
                          aria-label="Pilih opsi {optionLetters[optIdx]} sebagai kunci benar"
                          style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid {opt.isCorrect ? '#16a34a' : '#cbd5e1'}; background: {opt.isCorrect ? '#16a34a' : '#ffffff'}; color: {opt.isCorrect ? '#ffffff' : '#64748b'}; font-weight: 800; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                        >
                          {#if opt.isCorrect}
                            <Icon name="check" size={14} />
                          {:else}
                            {optionLetters[optIdx]}
                          {/if}
                        </button>

                        <!-- Option Text Input -->
                        <input
                          type="text"
                          placeholder="Pilihan {optionLetters[optIdx]}..."
                          bind:value={opt.text}
                          style="flex: 1; min-width: 0; padding: 7px 10px; border: 1px solid {opt.isCorrect ? '#bbf7d0' : '#cbd5e1'}; border-radius: 6px; font-size: 0.875rem; background: #ffffff;"
                        />

                        {#if opt.isCorrect}
                          <span style="font-size: 0.725rem; font-weight: 700; color: #166534; padding: 3px 6px; background: #dcfce7; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
                            Kunci Benar
                          </span>
                        {/if}

                        {#if q.options.length > 2}
                          <button
                            type="button"
                            onclick={() => removeOption(qIdx, optIdx)}
                            title="Hapus opsi ini"
                            aria-label="Hapus opsi"
                            style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;"
                          >
                            <Icon name="xmark" size={15} />
                          </button>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Explanation / Pembahasan -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
                  <div style="display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 0.8rem; color: #1e293b; margin-bottom: 6px;">
                    <Icon name="info-circle" size={14} style="color: #0f766e;" />
                    <span>Pembahasan / Penjelasan Jawaban</span>
                  </div>
                  <textarea
                    rows="2"
                    placeholder="Tuliskan penjelasan detail mengapa pilihan kunci tersebut benar..."
                    bind:value={q.explanation}
                    style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-family: inherit; box-sizing: border-box;"
                  ></textarea>
                </div>
              </div>
            {/each}

            <!-- Bottom Add Question Button -->
            <button
              type="button"
              onclick={addQuestion}
              style="width: 100%; border: 1.5px dashed #0f766e; background: #f0fdfa; color: #0f766e; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
            >
              <Icon name="plus" size={16} />
              <span>Tambah Butir Soal Baru</span>
            </button>
          </div>
        {/if}

        <!-- TAB 3: PRATINJAU KUIS -->
        {#if activeTab === 'preview'}
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
              <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                <ChipBadge variant={type === 'quiz' ? 'quiz' : type === 'materi' ? 'materi' : 'combined'} icon={type === 'quiz' ? 'check-circle' : type === 'materi' ? 'book-open' : 'layers'} label={type.toUpperCase()} />
                <ChipBadge variant="neutral" icon="clock" label="~{readingTimeMinutes} Menit" />
                <ChipBadge variant="neutral" icon="check-circle" label="{questions.length} Soal" />
              </div>
              <h3 style="margin: 0 0 6px 0; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
                {title || '(Judul belum diisi)'}
              </h3>
              {#if summary}
                <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.4;">
                  {summary}
                </p>
              {/if}
            </div>

            <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">
              Pratinjau Butir Soal & Kunci Jawaban:
            </div>

            {#each questions as q, qIdx}
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 12px;">
                  {qIdx + 1}. {q.question || '(Pertanyaan belum diisi)'}
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
                  {#each q.options as opt, optIdx}
                    <div
                      style="padding: 8px 12px; border-radius: 8px; border: 1.5px solid {opt.isCorrect ? '#86efac' : '#e2e8f0'}; background: {opt.isCorrect ? '#f0fdf4' : '#ffffff'}; font-size: 0.875rem; display: flex; justify-content: space-between; align-items: center; gap: 8px;"
                    >
                      <span style="min-width: 0; overflow-wrap: break-word;">
                        <strong>{optionLetters[optIdx]}.</strong> {opt.text || '(Opsi kosong)'}
                      </span>
                      {#if opt.isCorrect}
                        <ChipBadge variant="success" icon="check" label="Kunci Jawaban" />
                      {/if}
                    </div>
                  {/each}
                </div>

                {#if q.explanation}
                  <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 0.8rem; color: #475569; border-left: 3px solid #0f766e;">
                    <strong>Pembahasan:</strong> {q.explanation}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        style="padding: 12px 18px; border-top: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; gap: 10px;"
      >
        <div style="font-size: 0.825rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          {#if type !== 'materi'}
            <strong>{questions.length} Soal</strong> terkonfigurasi
          {/if}
        </div>

        <div style="display: flex; gap: 8px; flex-shrink: 0;">
          <button
            type="button"
            disabled={isSaving}
            onclick={onClose}
            style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; white-space: nowrap;"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onclick={handleSave}
            style="background: #0f766e; color: #ffffff; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25); white-space: nowrap;"
          >
            {#if isSaving}
              <span>Menyimpan...</span>
            {:else}
              <Icon name="check" size={15} />
              <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan & Terbitkan'}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
