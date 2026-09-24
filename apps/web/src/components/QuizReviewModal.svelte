<script lang="ts">
  import { api } from '../stores/api';
  import type { Content, QuizQuestion, QuizSubmissionRecord } from '@flashlearn/shared';
  import Icon from './ui/Icon.svelte';
  import ChipBadge from './ui/ChipBadge.svelte';

  interface Props {
    content: Content;
    isOpen: boolean;
    initialTab?: 'analysis' | 'participants';
    onClose: () => void;
  }

  let { content, isOpen, initialTab = 'analysis', onClose }: Props = $props();

  let activeTab = $state<'analysis' | 'participants'>('analysis');
  let submissions = $state<QuizSubmissionRecord[]>([]);
  let fullQuestions = $state<QuizQuestion[]>([]);
  let isLoading = $state(true);
  let isExporting = $state(false);
  let filterMode = $state<'all' | 'wrong_only' | 'mastered_only'>('all');
  let sortMode = $state<'most_wrong' | 'question_order' | 'most_correct'>('most_wrong');
  let participantSearch = $state('');

  $effect(() => {
    if (isOpen) {
      activeTab = initialTab;
      loadData();
    }
  });

  async function loadData() {
    isLoading = true;
    try {
      // 1. Fetch submissions
      submissions = await api.contents.getSubmissions(content.id);

      // 2. Ensure we have questions with full options & explanations
      if (content.questions && content.questions.length > 0 && content.questions[0].options?.[0]?.isCorrect !== undefined) {
        fullQuestions = content.questions;
      } else {
        const fullContent = await api.contents.get(content.id);
        fullQuestions = fullContent.questions || [];
      }
    } catch (err: any) {
      console.error('Failed to load review data:', err);
    } finally {
      isLoading = false;
    }
  }

  async function handleExport(format: 'xlsx' | 'csv') {
    isExporting = true;
    try {
      await api.contents.downloadExport(content.id, format);
    } catch (err: any) {
      alert(`Gagal mengekspor data: ${err.message}`);
    } finally {
      isExporting = false;
    }
  }

  // --- Analytics Derivations ---
  const totalParticipants = $derived(submissions.length);

  const averageScore = $derived(
    totalParticipants > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / totalParticipants)
      : 0
  );

  const passingCount = $derived(submissions.filter((s) => s.percentage >= 70).length);

  const passingRate = $derived(
    totalParticipants > 0 ? Math.round((passingCount / totalParticipants) * 100) : 0
  );

  interface QuestionAnalysis {
    index: number;
    question: QuizQuestion;
    totalAnswered: number;
    correctCount: number;
    wrongCount: number;
    wrongRate: number;
    correctRate: number;
    isNeedDiscussion: boolean;
    isMastered: boolean;
    topDistractor: { id: string; text: string; pickCount: number; percentage: number } | null;
    optionsStats: {
      id: string;
      text: string;
      isCorrect: boolean;
      pickCount: number;
      percentage: number;
    }[];
  }

  const questionsAnalysis = $derived<QuestionAnalysis[]>(
    fullQuestions.map((q, idx) => {
      let answeredCount = 0;
      let correctCount = 0;

      const optionsStats = (q.options || []).map((opt) => {
        const pickCount = submissions.filter((s) => {
          if (!Array.isArray(s.answers)) return false;
          const a = s.answers.find((ans: any) => ans.questionId === q.id);
          return a && a.selectedOptionId === opt.id;
        }).length;

        if (pickCount > 0) {
          answeredCount += pickCount;
        }

        if (opt.isCorrect) {
          correctCount += pickCount;
        }

        const percentage =
          totalParticipants > 0 ? Math.round((pickCount / totalParticipants) * 100) : 0;

        return {
          id: opt.id,
          text: opt.text,
          isCorrect: !!opt.isCorrect,
          pickCount,
          percentage,
        };
      });

      const effectiveTotal = totalParticipants > 0 ? totalParticipants : answeredCount;
      const wrongCount = Math.max(0, effectiveTotal - correctCount);
      const wrongRate = effectiveTotal > 0 ? Math.round((wrongCount / effectiveTotal) * 100) : 0;
      const correctRate = 100 - wrongRate;

      // Find top incorrect option that misled the most participants
      const wrongOptions = optionsStats.filter((o) => !o.isCorrect);
      wrongOptions.sort((a, b) => b.pickCount - a.pickCount);
      const topDistractor = wrongOptions[0] && wrongOptions[0].pickCount > 0 ? wrongOptions[0] : null;

      return {
        index: idx + 1,
        question: q,
        totalAnswered: effectiveTotal,
        correctCount,
        wrongCount,
        wrongRate,
        correctRate,
        isNeedDiscussion: wrongCount > 0,
        isMastered: wrongCount === 0 && effectiveTotal > 0,
        topDistractor,
        optionsStats,
      };
    })
  );

  const mostMissedQuestion = $derived<QuestionAnalysis | null>(
    [...questionsAnalysis].sort((a, b) => b.wrongRate - a.wrongRate)[0] || null
  );

  const filteredQuestions = $derived<QuestionAnalysis[]>(
    questionsAnalysis
      .filter((qa) => {
        if (filterMode === 'wrong_only') return qa.wrongCount > 0;
        if (filterMode === 'mastered_only') return qa.isMastered;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'most_wrong') return b.wrongRate - a.wrongRate;
        if (sortMode === 'most_correct') return b.correctRate - a.correctRate;
        return a.index - b.index;
      })
  );

  const filteredSubmissions = $derived(
    submissions.filter((s) => {
      const name = s.guestName || s.userName || '';
      return name.toLowerCase().includes(participantSearch.toLowerCase());
    })
  );

  const missedQuestionsCount = $derived(questionsAnalysis.filter((q) => q.wrongCount > 0).length);
  const masteredQuestionsCount = $derived(questionsAnalysis.filter((q) => q.isMastered).length);
</script>

{#if isOpen}
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 12px;"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <!-- Main Modal Window -->
    <div
      style="background: #ffffff; width: 100%; max-width: 920px; max-height: 94vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.28); overflow: hidden; border: 1px solid #e2e8f0;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Modal Header -->
      <div
        style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-shrink: 0;"
      >
        <div style="min-width: 0; flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <ChipBadge variant="quiz" icon="check-circle" label="EVALUASI PASCA-KUIS" />
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">
              Total {fullQuestions.length} Soal • {totalParticipants} Peserta Mengisi
            </span>
          </div>
          <h2
            style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          >
            {content.title}
          </h2>
        </div>

        <button
          onclick={onClose}
          aria-label="Tutup dialog"
          style="background: #f1f5f9; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; transition: background 0.15s ease;"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Navigation Tabs & Actions Bar -->
      <div
        style="padding: 10px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; flex-shrink: 0;"
      >
        <!-- Tab Buttons -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <button
            type="button"
            class="fl-pill-btn"
            onclick={() => (activeTab = 'analysis')}
            style="padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {activeTab ===
            'analysis'
              ? '#0f766e'
              : '#e2e8f0'}; background: {activeTab === 'analysis'
              ? '#0f766e'
              : '#ffffff'}; color: {activeTab === 'analysis' ? '#ffffff' : '#475569'}; transition: all 0.15s ease;"
          >
            <Icon name="sparkles" size={14} />
            <span>Analisis Soal & Bahas Bersama</span>
            {#if missedQuestionsCount > 0}
              <span
                style="background: {activeTab === 'analysis'
                  ? 'rgba(255,255,255,0.25)'
                  : '#fee2e2'}; color: {activeTab === 'analysis'
                  ? '#ffffff'
                  : '#dc2626'}; font-size: 0.725rem; padding: 1px 6px; border-radius: 9999px; font-weight: 800;"
              >
                {missedQuestionsCount} Salah
              </span>
            {/if}
          </button>

          <button
            type="button"
            class="fl-pill-btn"
            onclick={() => (activeTab = 'participants')}
            style="padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {activeTab ===
            'participants'
              ? '#0f766e'
              : '#e2e8f0'}; background: {activeTab === 'participants'
              ? '#0f766e'
              : '#ffffff'}; color: {activeTab === 'participants' ? '#ffffff' : '#475569'}; transition: all 0.15s ease;"
          >
            <Icon name="chart-bar" size={14} />
            <span>Daftar Peserta & Nilai</span>
            <span
              style="background: {activeTab === 'participants'
                ? 'rgba(255,255,255,0.25)'
                : '#f1f5f9'}; color: {activeTab === 'participants'
                ? '#ffffff'
                : '#64748b'}; font-size: 0.725rem; padding: 1px 6px; border-radius: 9999px; font-weight: 800;"
            >
              {totalParticipants}
            </span>
          </button>
        </div>

        <!-- Export Buttons (Always accessible) -->
        <div style="display: flex; gap: 6px; align-items: center;">
          <button
            type="button"
            class="fl-pill-btn"
            onclick={() => handleExport('xlsx')}
            disabled={isExporting || totalParticipants === 0}
            title="Download data lengkap ke file Excel"
            style="background: #16a34a; color: #ffffff; border: none; padding: 6px 12px; border-radius: 7px; font-weight: 700; font-size: 0.775rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; opacity: {totalParticipants ===
            0
              ? '0.6'
              : '1'};"
          >
            <Icon name="arrow-down-tray" size={13} />
            <span>{isExporting ? 'Ekspor...' : 'Excel (.xlsx)'}</span>
          </button>
          <button
            type="button"
            class="fl-pill-btn"
            onclick={() => handleExport('csv')}
            disabled={isExporting || totalParticipants === 0}
            title="Download format CSV"
            style="background: #475569; color: #ffffff; border: none; padding: 6px 10px; border-radius: 7px; font-weight: 700; font-size: 0.775rem; cursor: pointer; opacity: {totalParticipants ===
            0
              ? '0.6'
              : '1'};"
          >
            CSV
          </button>
        </div>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div style="flex: 1; overflow-y: auto; padding: 20px 24px; -webkit-overflow-scrolling: touch;">
        {#if isLoading}
          <div style="text-align: center; padding: 60px 16px; color: #94a3b8; font-weight: 500;">
            <Icon name="arrow-path" size={24} style="animation: spin 1s linear infinite; margin-bottom: 8px;" />
            <div>Memuat data analisis butir soal...</div>
          </div>
        {:else if totalParticipants === 0}
          <div
            style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 16px; padding: 48px 24px; text-align: center; max-width: 520px; margin: 30px auto;"
          >
            <div
              style="width: 50px; height: 50px; border-radius: 14px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;"
            >
              <Icon name="info-circle" size={24} />
            </div>
            <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 1.1rem; font-weight: 700;">
              Belum Ada Peserta yang Mengisi
            </h3>
            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 0.85rem; line-height: 1.5;">
              Bagikan tautan kuis ini kepada peserta. Setelah ada jawaban masuk, diagram analisis butir soal dan opsi yang mengecoh akan langsung muncul di sini secara otomatis.
            </p>
            <button
              type="button"
              class="fl-pill-btn"
              onclick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/c/${content.id}`);
                alert('Tautan kuis berhasil disalin!');
              }}
              style="background: #0f766e; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
            >
              <Icon name="link" size={14} />
              <span>Salin Link Kuis untuk Peserta</span>
            </button>
          </div>
        {:else if activeTab === 'analysis'}
          <!-- TAB 1: ANALISIS BUTIR SOAL & BAHAS BERSAMA -->

          <!-- Executive Summary Metrics -->
          <div
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 22px;"
          >
            <div
              style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
            >
              <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">
                Rata-rata Nilai
              </div>
              <div
                style="font-size: 1.6rem; font-weight: 800; color: {averageScore >= 70
                  ? '#16a34a'
                  : '#ea580c'}; margin-top: 2px;"
              >
                {averageScore}%
              </div>
              <div style="font-size: 0.75rem; color: #64748b;">
                Tingkat Kelulusan: <strong>{passingRate}% ({passingCount}/{totalParticipants})</strong>
              </div>
            </div>

            <div
              style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
            >
              <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">
                Soal Perlu Dibahas
              </div>
              <div
                style="font-size: 1.6rem; font-weight: 800; color: {missedQuestionsCount > 0
                  ? '#dc2626'
                  : '#16a34a'}; margin-top: 2px;"
              >
                {missedQuestionsCount} Soal
              </div>
              <div style="font-size: 0.75rem; color: #64748b;">
                {fullQuestions.length - missedQuestionsCount} soal dijawab 100% tepat
              </div>
            </div>

            <div
              style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
            >
              <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">
                Soal Paling Banyak Salah
              </div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 4px;">
                {#if mostMissedQuestion && mostMissedQuestion.wrongCount > 0}
                  Soal #{mostMissedQuestion.index} <span style="font-size: 0.85rem; color: #dc2626; font-weight: 700;">({mostMissedQuestion.wrongRate}% Salah)</span>
                {:else}
                  <span style="font-size: 0.95rem; color: #16a34a; font-weight: 700;">Nihil (Sempurna)</span>
                {/if}
              </div>
              <div style="font-size: 0.75rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {#if mostMissedQuestion && mostMissedQuestion.wrongCount > 0}
                  {mostMissedQuestion.wrongCount} dari {totalParticipants} peserta salah
                {:else}
                  Semua soal berhasil dijawab
                {/if}
              </div>
            </div>
          </div>

          <!-- Discussion Controls Toolbar -->
          <div
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;"
          >
            <!-- Filter Pills -->
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-right: 4px;">
                Tampilkan:
              </span>

              <button
                type="button"
                class="fl-pill-btn"
                onclick={() => (filterMode = 'all')}
                style="padding: 4px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; border: 1px solid {filterMode ===
                'all'
                  ? '#0f766e'
                  : '#cbd5e1'}; background: {filterMode === 'all'
                  ? '#f0fdfa'
                  : '#ffffff'}; color: {filterMode === 'all' ? '#0f766e' : '#64748b'};"
              >
                Semua Soal ({questionsAnalysis.length})
              </button>

              <button
                type="button"
                class="fl-pill-btn"
                onclick={() => (filterMode = 'wrong_only')}
                style="padding: 4px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 700; cursor: pointer; border: 1px solid {filterMode ===
                'wrong_only'
                  ? '#dc2626'
                  : '#cbd5e1'}; background: {filterMode === 'wrong_only'
                  ? '#fee2e2'
                  : '#ffffff'}; color: {filterMode === 'wrong_only' ? '#dc2626' : '#64748b'};"
              >
                Perlu Dibahas ({missedQuestionsCount})
              </button>

              <button
                type="button"
                class="fl-pill-btn"
                onclick={() => (filterMode = 'mastered_only')}
                style="padding: 4px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; border: 1px solid {filterMode ===
                'mastered_only'
                  ? '#16a34a'
                  : '#cbd5e1'}; background: {filterMode === 'mastered_only'
                  ? '#dcfce7'
                  : '#ffffff'}; color: {filterMode === 'mastered_only' ? '#16a34a' : '#64748b'};"
              >
                Dikuasai 100% ({masteredQuestionsCount})
              </button>
            </div>

            <!-- Sort Selector -->
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #334155;">Urutan:</span>
              <select
                bind:value={sortMode}
                style="padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.775rem; font-weight: 600; color: #334155; background: #ffffff; outline: none; cursor: pointer;"
              >
                <option value="most_wrong">Paling Banyak Salah (Tersulit)</option>
                <option value="question_order">Nomor Soal (1, 2, 3...)</option>
                <option value="most_correct">Paling Banyak Benar (Termudah)</option>
              </select>
            </div>
          </div>

          <!-- Question Cards for Discussion -->
          <div style="display: flex; flex-direction: column; gap: 18px;">
            {#if filteredQuestions.length === 0}
              <div
                style="text-align: center; padding: 40px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b;"
              >
                Tidak ada soal yang sesuai dengan filter yang dipilih.
              </div>
            {/if}

            {#each filteredQuestions as item}
              <div
                class="fl-feature-card"
                style="background: #ffffff; border: 1.5px solid {item.wrongRate >= 50
                  ? '#fecaca'
                  : item.wrongCount > 0
                  ? '#fed7aa'
                  : '#e2e8f0'}; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);"
              >
                <!-- Question Top Header -->
                <div
                  style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;"
                >
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span
                      style="background: #0f766e; color: #ffffff; font-weight: 800; font-size: 0.825rem; padding: 3px 10px; border-radius: 6px;"
                    >
                      SOAL #{item.index}
                    </span>
                    {#if item.question.difficulty}
                      <span
                        style="font-size: 0.725rem; font-weight: 700; text-transform: uppercase; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 6px;"
                      >
                        {item.question.difficulty}
                      </span>
                    {/if}
                  </div>

                  <!-- Error Rate Status Badge -->
                  <div>
                    {#if item.wrongRate >= 50}
                      <ChipBadge
                        variant="danger"
                        icon="exclamation-circle"
                        label="{item.wrongCount}/{item.totalAnswered} Peserta Salah ({item.wrongRate}%)"
                      />
                    {:else if item.wrongCount > 0}
                      <ChipBadge
                        variant="warning"
                        icon="exclamation-circle"
                        label="{item.wrongCount}/{item.totalAnswered} Peserta Salah ({item.wrongRate}%)"
                      />
                    {:else}
                      <ChipBadge
                        variant="success"
                        icon="check-circle"
                        label="100% Tepat ({item.correctCount} Benar)"
                      />
                    {/if}
                  </div>
                </div>

                <!-- Question Text -->
                <h4
                  style="margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: #0f172a; line-height: 1.45;"
                >
                  {item.question.question}
                </h4>

                <!-- Options Breakdown with Distribution Bar Chart -->
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                  {#each item.optionsStats as opt, optIdx}
                    {@const isTopMisconception = item.topDistractor?.id === opt.id && opt.pickCount > 0}
                    <div
                      style="border: 1.5px solid {opt.isCorrect
                        ? '#86efac'
                        : isTopMisconception
                        ? '#fcd34d'
                        : '#e2e8f0'}; background: {opt.isCorrect
                        ? '#f0fdf4'
                        : isTopMisconception
                        ? '#fffbeb'
                        : '#ffffff'}; border-radius: 10px; padding: 10px 14px; position: relative;"
                    >
                      <!-- Option Label and Badges -->
                      <div
                        style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;"
                      >
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                          <span
                            style="width: 22px; height: 22px; border-radius: 50%; background: {opt.isCorrect
                              ? '#16a34a'
                              : isTopMisconception
                              ? '#d97706'
                              : '#64748b'}; color: #ffffff; font-weight: 800; font-size: 0.725rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;"
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span
                            style="font-size: 0.9rem; font-weight: {opt.isCorrect ? '700' : '500'}; color: {opt.isCorrect
                              ? '#166534'
                              : '#1e293b'};"
                          >
                            {opt.text}
                          </span>
                        </div>

                        <div style="display: flex; gap: 6px; align-items: center;">
                          {#if opt.isCorrect}
                            <span
                              style="background: #dcfce7; color: #166534; font-size: 0.725rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;"
                            >
                              <Icon name="check" size={11} strokeWidth={3} />
                              <span>KUNCI JAWABAN BENAR</span>
                            </span>
                          {:else if isTopMisconception}
                            <span
                              style="background: #fef3c7; color: #92400e; font-size: 0.725rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;"
                            >
                              <Icon name="exclamation-circle" size={12} />
                              <span>PALING BANYAK TERKECOH</span>
                            </span>
                          {/if}

                          <span
                            style="font-size: 0.825rem; font-weight: 800; color: {opt.isCorrect
                              ? '#166534'
                              : isTopMisconception
                              ? '#b45309'
                              : '#64748b'}; white-space: nowrap;"
                          >
                            {opt.percentage}% ({opt.pickCount} peserta)
                          </span>
                        </div>
                      </div>

                      <!-- Distribution Progress Fill Bar -->
                      <div
                        style="width: 100%; height: 6px; background: rgba(0,0,0,0.06); border-radius: 9999px; overflow: hidden;"
                      >
                        <div
                          style="height: 100%; width: {opt.percentage}%; background: {opt.isCorrect
                            ? '#22c55e'
                            : isTopMisconception
                            ? '#f59e0b'
                            : '#94a3b8'}; border-radius: 9999px; transition: width 0.3s ease;"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- Explanation & Discussion Guide Panel -->
                {#if item.question.explanation}
                  <div
                    style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 12px 16px;"
                  >
                    <div
                      style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #0f766e; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em;"
                    >
                      <Icon name="sparkles" size={13} />
                      <span>Bahan Diskusi & Pembahasan Guru:</span>
                    </div>
                    <p style="margin: 0; font-size: 0.85rem; color: #134e4a; line-height: 1.55;">
                      {item.question.explanation}
                    </p>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <!-- TAB 2: DAFTAR PESERTA & REKAP NILAI -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Search Participant Input -->
            <div style="position: relative; max-width: 360px;">
              <span
                style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; align-items: center; pointer-events: none;"
              >
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Cari nama peserta..."
                bind:value={participantSearch}
                style="width: 100%; padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; color: #0f172a; outline: none;"
              />
            </div>

            <!-- Table of Submissions -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.825rem; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                    <th style="padding: 10px 14px; white-space: nowrap;">No</th>
                    <th style="padding: 10px 14px; white-space: nowrap;">Nama Peserta</th>
                    <th style="padding: 10px 14px; white-space: nowrap;">Nilai (%)</th>
                    <th style="padding: 10px 14px; white-space: nowrap;">Skor Benar</th>
                    <th style="padding: 10px 14px; white-space: nowrap;">Status</th>
                    <th style="padding: 10px 14px; white-space: nowrap;">Waktu Pengerjaan</th>
                  </tr>
                </thead>
                <tbody>
                  {#if filteredSubmissions.length === 0}
                    <tr>
                      <td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8;">
                        Tidak ditemukan peserta yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  {/if}

                  {#each filteredSubmissions as sub, idx}
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
                      <td style="padding: 10px 14px; color: #94a3b8;">{idx + 1}</td>
                      <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">
                        {sub.guestName || sub.userName || 'Anonim'}
                      </td>
                      <td
                        style="padding: 10px 14px; font-weight: 800; color: {sub.percentage >= 70
                          ? '#16a34a'
                          : '#dc2626'};"
                      >
                        {sub.percentage}%
                      </td>
                      <td style="padding: 10px 14px; color: #475569;">
                        {sub.score} / {sub.totalQuestions}
                      </td>
                      <td style="padding: 10px 14px;">
                        <span
                          style="background: {sub.percentage >= 70
                            ? '#dcfce7'
                            : '#fee2e2'}; color: {sub.percentage >= 70
                            ? '#166534'
                            : '#991b1b'}; padding: 2px 8px; border-radius: 6px; font-size: 0.725rem; font-weight: 700;"
                        >
                          {sub.percentage >= 70 ? 'Lulus' : 'Belum Lulus'}
                        </span>
                      </td>
                      <td style="padding: 10px 14px; color: #64748b; font-size: 0.775rem;">
                        {new Date(sub.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        style="padding: 14px 24px; border-top: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-shrink: 0;"
      >
        <span style="font-size: 0.8rem; color: #64748b;">
          💡 Tip: Gunakan mode ini di layar proyektor untuk membahas butir soal yang paling membingungkan bersama peserta.
        </span>
        <button
          type="button"
          class="fl-pill-btn"
          onclick={onClose}
          style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 7px 16px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer;"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
