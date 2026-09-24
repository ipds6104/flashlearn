<script lang="ts">
  import { api } from '../stores/api';
  import type { Content, ContentType, QuizQuestion, QuizOption } from '@flashlearn/shared';

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
        
        // Deep clone questions
        if (contentToEdit.questions && contentToEdit.questions.length > 0) {
          questions = JSON.parse(JSON.stringify(contentToEdit.questions));
        } else if (contentToEdit.type !== 'materi') {
          questions = [createBlankQuestion(1)];
        } else {
          questions = [];
        }
        activeTab = contentToEdit.type === 'materi' ? 'info' : 'questions';
      } else {
        // Create new
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
          validationError = `Soal #${i + 1} belum memiliki Kunci Jawaban Benar (tandai salah satu opsi dengan centang hijau).`;
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
        style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #ffffff; flex-shrink: 0;"
      >
        <div style="display: flex; align-items: center; gap: 10px;">
          <div
            style="width: 38px; height: 38px; border-radius: 10px; background: {type === 'quiz' ? '#ccfbf1' : type === 'materi' ? '#e0f2fe' : '#fef3c7'}; color: {type === 'quiz' ? '#0f766e' : type === 'materi' ? '#0284c7' : '#d97706'}; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;"
          >
            {type === 'quiz' ? '📝' : type === 'materi' ? '📖' : '⚡'}
          </div>
          <div>
            <h2 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #0f172a;">
              {isEditMode ? 'Edit Modul Pembelajaran' : 'Buat Modul Kuis / Materi Baru'}
            </h2>
            <div style="font-size: 0.8rem; color: #64748b;">
              {isEditMode ? `Memperbarui "${contentToEdit?.title}"` : 'Susun materi, bank soal, dan kunci jawaban interaktif'}
            </div>
          </div>
        </div>

        <button
          onclick={onClose}
          style="background: #f1f5f9; border: none; width: 34px; height: 34px; border-radius: 50%; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b;"
        >
          ✕
        </button>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div
        style="padding: 8px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 8px; flex-shrink: 0; overflow-x: auto;"
      >
        <button
          type="button"
          onclick={() => (activeTab = 'info')}
          style="padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; background: {activeTab === 'info' ? '#0f766e' : 'transparent'}; color: {activeTab === 'info' ? '#ffffff' : '#64748b'};"
        >
          ⚙️ 1. Info Modul
        </button>

        {#if type !== 'materi'}
          <button
            type="button"
            onclick={() => (activeTab = 'questions')}
            style="padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; background: {activeTab === 'questions' ? '#0f766e' : 'transparent'}; color: {activeTab === 'questions' ? '#ffffff' : '#64748b'};"
          >
            📝 2. Butir Soal Kuis
            <span
              style="padding: 1px 7px; border-radius: 10px; font-size: 0.75rem; background: {activeTab === 'questions' ? 'rgba(255,255,255,0.25)' : '#e2e8f0'}; color: {activeTab === 'questions' ? '#ffffff' : '#334155'}; font-weight: 800;"
            >
              {questions.length}
            </span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'preview')}
            style="padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; background: {activeTab === 'preview' ? '#0f766e' : 'transparent'}; color: {activeTab === 'preview' ? '#ffffff' : '#64748b'};"
          >
            👁️ 3. Pratinjau Kuis
          </button>
        {/if}
      </div>

      <!-- Error / Validation Alert Banner -->
      {#if validationError}
        <div
          style="background: #fef2f2; border-bottom: 1px solid #fecaca; color: #b91c1c; padding: 10px 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-shrink: 0;"
        >
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      {/if}

      <!-- Modal Body (Scrollable) -->
      <div style="flex: 1; overflow-y: auto; padding: 20px; -webkit-overflow-scrolling: touch;">
        <!-- TAB 1: INFO MODUL -->
        {#if activeTab === 'info'}
          <div style="display: flex; flex-direction: column; gap: 18px;">
            <!-- Content Type Selector -->
            <div>
              <label style="display: block; font-weight: 700; font-size: 0.875rem; color: #334155; margin-bottom: 8px;">
                Tipe Modul Pembelajaran
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <button
                  type="button"
                  onclick={() => (type = 'quiz')}
                  style="text-align: left; padding: 12px; border-radius: 12px; border: 2px solid {type === 'quiz' ? '#0f766e' : '#e2e8f0'}; background: {type === 'quiz' ? '#f0fdfa' : '#ffffff'}; cursor: pointer;"
                >
                  <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 2px;">
                    📝 Quiz Saja
                  </div>
                  <div style="font-size: 0.775rem; color: #64748b;">
                    Asesmen interaktif, skor instan & 3D flashcards.
                  </div>
                </button>

                <button
                  type="button"
                  onclick={() => (type = 'materi')}
                  style="text-align: left; padding: 12px; border-radius: 12px; border: 2px solid {type === 'materi' ? '#0f766e' : '#e2e8f0'}; background: {type === 'materi' ? '#f0fdfa' : '#ffffff'}; cursor: pointer;"
                >
                  <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 2px;">
                    📖 Materi Saja
                  </div>
                  <div style="font-size: 0.775rem; color: #64748b;">
                    Bahan bacaan artikel / teori dengan format Markdown.
                  </div>
                </button>

                <button
                  type="button"
                  onclick={() => (type = 'combined')}
                  style="text-align: left; padding: 12px; border-radius: 12px; border: 2px solid {type === 'combined' ? '#0f766e' : '#e2e8f0'}; background: {type === 'combined' ? '#f0fdfa' : '#ffffff'}; cursor: pointer;"
                >
                  <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 2px;">
                    📚⚡ Materi + Quiz
                  </div>
                  <div style="font-size: 0.775rem; color: #64748b;">
                    Baca materi teori dahulu, lalu uji kemampuan kuis.
                  </div>
                </button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label style="display: block; font-weight: 700; font-size: 0.875rem; color: #334155; margin-bottom: 6px;">
                Judul Modul <span style="color: #ef4444;">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pre-Test Pengolahan Peta Wilkerstat SE2026..."
                bind:value={title}
                style="width: 100%; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; box-sizing: border-box;"
              />
            </div>

            <!-- Summary -->
            <div>
              <label style="display: block; font-weight: 700; font-size: 0.875rem; color: #334155; margin-bottom: 6px;">
                Ringkasan / Deskripsi Singkat
              </label>
              <textarea
                rows="2"
                placeholder="Ringkasan singkat tujuan kuis atau materi ini..."
                bind:value={summary}
                style="width: 100%; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.9rem; font-family: inherit; box-sizing: border-box;"
              ></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <!-- Reading / Quiz time -->
              <div>
                <label style="display: block; font-weight: 700; font-size: 0.875rem; color: #334155; margin-bottom: 6px;">
                  ⏱️ Estimasi Waktu (Menit)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  bind:value={readingTimeMinutes}
                  style="width: 100%; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; box-sizing: border-box;"
                />
              </div>

              <!-- Publication Status -->
              <div>
                <label style="display: block; font-weight: 700; font-size: 0.875rem; color: #334155; margin-bottom: 6px;">
                  Status Publikasi
                </label>
                <select
                  bind:value={isPublished}
                  style="width: 100%; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; box-sizing: border-box; background: #ffffff;"
                >
                  <option value={true}>🟢 Diterbitkan (Dapat diakses peserta)</option>
                  <option value={false}>🟡 Draf (Hanya terlihat oleh Anda)</option>
                </select>
              </div>
            </div>

            <!-- Markdown Body (if materi or combined) -->
            {#if type !== 'quiz'}
              <div>
                <label style="display: block; font-weight: 700; font-size: 0.875rem; color: #334155; margin-bottom: 6px;">
                  Isi Materi Teori (Markdown)
                </label>
                <textarea
                  rows="8"
                  placeholder="# Judul Topik&#10;&#10;Tuliskan uraian materi di sini menggunakan format Markdown..."
                  bind:value={body}
                  style="width: 100%; padding: 12px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.9rem; font-family: monospace; line-height: 1.5; box-sizing: border-box;"
                ></textarea>
              </div>
            {/if}

            {#if type !== 'materi'}
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 0.9rem; color: #166534;">
                    Lanjut ke Penyusunan Soal Kuis
                  </div>
                  <div style="font-size: 0.8rem; color: #15803d;">
                    Saat ini ada {questions.length} butir soal terkonfigurasi.
                  </div>
                </div>
                <button
                  type="button"
                  onclick={() => (activeTab = 'questions')}
                  style="background: #16a34a; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer;"
                >
                  Kelola Soal →
                </button>
              </div>
            {/if}
          </div>
        {/if}

        <!-- TAB 2: INTERACTIVE QUESTION BUILDER -->
        {#if activeTab === 'questions'}
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Questions Top Action Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <span style="font-weight: 800; font-size: 1rem; color: #0f172a;">
                  Bank Soal Kuis ({questions.length} Soal)
                </span>
                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #64748b;">
                  Pilih opsi radio (lingkaran huruf) untuk menandai kunci jawaban yang benar.
                </p>
              </div>

              <button
                type="button"
                onclick={addQuestion}
                style="background: #0f766e; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;"
              >
                + Tambah Soal
              </button>
            </div>

            <!-- Questions Cards List -->
            {#each questions as q, qIdx}
              <div
                style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 14px;"
              >
                <!-- Question Card Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span
                      style="background: #0f766e; color: #ffffff; font-weight: 800; font-size: 0.85rem; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;"
                    >
                      {qIdx + 1}
                    </span>
                    <span style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">
                      Butir Soal #{qIdx + 1}
                    </span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 6px;">
                    <!-- Difficulty Select -->
                    <select
                      bind:value={q.difficulty}
                      style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.775rem; font-weight: 700; background: #f8fafc; color: {q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'hard' ? '#dc2626' : '#d97706'};"
                    >
                      <option value="easy">🟢 Mudah</option>
                      <option value="medium">🟡 Sedang</option>
                      <option value="hard">🔴 Sulit</option>
                    </select>

                    <!-- Reorder Buttons -->
                    <button
                      type="button"
                      disabled={qIdx === 0}
                      onclick={() => moveQuestion(qIdx, 'up')}
                      title="Geser ke atas"
                      style="background: #f1f5f9; border: 1px solid #cbd5e1; width: 28px; height: 28px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; color: #475569;"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={qIdx === questions.length - 1}
                      onclick={() => moveQuestion(qIdx, 'down')}
                      title="Geser ke bawah"
                      style="background: #f1f5f9; border: 1px solid #cbd5e1; width: 28px; height: 28px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; color: #475569;"
                    >
                      ▼
                    </button>

                    <!-- Delete Question -->
                    <button
                      type="button"
                      onclick={() => removeQuestion(qIdx)}
                      title="Hapus butir soal ini"
                      style="background: #fee2e2; border: 1px solid #fecaca; width: 28px; height: 28px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; color: #b91c1c;"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <!-- Question Text -->
                <div>
                  <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                    Pertanyaan <span style="color: #ef4444;">*</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Contoh: Berapakah batas beban SLS maksimal per petugas...?"
                    bind:value={q.question}
                    style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit; box-sizing: border-box;"
                  ></textarea>
                </div>

                <!-- Options List -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 700; font-size: 0.85rem; color: #334155;">
                      Pilihan Jawaban (Pilih centang hijau untuk Kunci Benar):
                    </span>
                    {#if q.options.length < 6}
                      <button
                        type="button"
                        onclick={() => addOption(qIdx)}
                        style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f766e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;"
                      >
                        + Tambah Opsi
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
                          style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid {opt.isCorrect ? '#16a34a' : '#cbd5e1'}; background: {opt.isCorrect ? '#16a34a' : '#ffffff'}; color: {opt.isCorrect ? '#ffffff' : '#64748b'}; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                        >
                          {opt.isCorrect ? '✓' : optionLetters[optIdx]}
                        </button>

                        <!-- Option Text Input -->
                        <input
                          type="text"
                          placeholder="Pilihan {optionLetters[optIdx]}..."
                          bind:value={opt.text}
                          style="flex: 1; padding: 8px 12px; border: 1px solid {opt.isCorrect ? '#bbf7d0' : '#cbd5e1'}; border-radius: 6px; font-size: 0.875rem; background: #ffffff;"
                        />

                        {#if opt.isCorrect}
                          <span style="font-size: 0.75rem; font-weight: 800; color: #166534; padding: 2px 6px; background: #dcfce7; border-radius: 6px; white-space: nowrap;">
                            Kunci Benar
                          </span>
                        {/if}

                        {#if q.options.length > 2}
                          <button
                            type="button"
                            onclick={() => removeOption(qIdx, optIdx)}
                            title="Hapus opsi ini"
                            style="background: none; border: none; color: #94a3b8; font-size: 1rem; cursor: pointer; padding: 4px;"
                          >
                            ✕
                          </button>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Explanation / Pembahasan -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
                  <label style="display: block; font-weight: 700; font-size: 0.825rem; color: #1e293b; margin-bottom: 6px;">
                    💡 Pembahasan / Penjelasan Jawaban
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Tuliskan penjelasan detail mengapa pilihan kunci tersebut benar..."
                    bind:value={q.explanation}
                    style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-family: inherit; box-sizing: border-box;"
                  ></textarea>
                </div>
              </div>
            {/each}

            <!-- Bottom Add Question Button -->
            <button
              type="button"
              onclick={addQuestion}
              style="width: 100%; border: 2px dashed #0f766e; background: #f0fdfa; color: #0f766e; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
            >
              + Tambah Butir Soal Baru
            </button>
          </div>
        {/if}

        <!-- TAB 3: PRATINJAU KUIS -->
        {#if activeTab === 'preview'}
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <h3 style="margin: 0 0 6px 0; font-size: 1.25rem; color: #0f172a; font-weight: 800;">
                {title || 'Judul Kuis'}
              </h3>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
                {summary || 'Tidak ada ringkasan'}
              </p>
              <div style="display: flex; gap: 12px; margin-top: 10px; font-size: 0.8rem; color: #475569;">
                <span>📝 {questions.length} Butir Soal</span>
                <span>⏱️ ~{readingTimeMinutes} Menit</span>
                <span>Status: {isPublished ? '🟢 Diterbitkan' : '🟡 Draf'}</span>
              </div>
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
                      style="padding: 8px 12px; border-radius: 8px; border: 1.5px solid {opt.isCorrect ? '#86efac' : '#e2e8f0'}; background: {opt.isCorrect ? '#f0fdf4' : '#ffffff'}; font-size: 0.875rem; display: flex; justify-content: space-between; align-items: center;"
                    >
                      <span>
                        <strong>{optionLetters[optIdx]}.</strong> {opt.text || '(Opsi kosong)'}
                      </span>
                      {#if opt.isCorrect}
                        <span style="font-size: 0.75rem; font-weight: 800; color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 6px;">
                          ✓ Kunci Jawaban
                        </span>
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
        style="padding: 14px 20px; border-top: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;"
      >
        <div style="font-size: 0.85rem; color: #64748b;">
          {#if type !== 'materi'}
            <strong>{questions.length} Soal</strong> terkonfigurasi
          {/if}
        </div>

        <div style="display: flex; gap: 10px;">
          <button
            type="button"
            disabled={isSaving}
            onclick={onClose}
            style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer;"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onclick={handleSave}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 800; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);"
          >
            {isSaving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan & Terbitkan'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
