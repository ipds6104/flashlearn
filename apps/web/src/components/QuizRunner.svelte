<script lang="ts">
  import type { Content, QuizResultResponse, FlashcardItem } from '@flashlearn/shared';
  import { api } from '../stores/api';
  import FlashcardDeck from './FlashcardDeck.svelte';

  interface Props {
    content: Content;
    onCompleted?: (result: QuizResultResponse) => void;
  }

  let { content, onCompleted }: Props = $props();

  let questions = $derived(content.questions || []);
  let userAnswers = $state<Record<string, string>>({});
  let isSubmitting = $state(false);
  let quizResult = $state<QuizResultResponse | null>(null);
  let showFlashcards = $state(false);
  let flashcardItems = $state<FlashcardItem[]>([]);
  let isLoadingFlashcards = $state(false);

  function selectOption(questionId: string, optionId: string) {
    if (quizResult) return; // Locked after submission
    userAnswers[questionId] = optionId;
  }

  async function submitQuiz() {
    isSubmitting = true;
    try {
      const payload = {
        answers: Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      };

      const result = await api.contents.submitQuiz(content.id, payload);
      quizResult = result;
      if (onCompleted) onCompleted(result);
    } catch (err: any) {
      alert(`Gagal mengirim jawaban: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }

  async function openFlashcards() {
    isLoadingFlashcards = true;
    try {
      const cards = await api.contents.getFlashcards(content.id);
      flashcardItems = cards;
      showFlashcards = true;
    } catch (err: any) {
      alert(`Gagal memuat flashcard: ${err.message}`);
    } finally {
      isLoadingFlashcards = false;
    }
  }

  function retryQuiz() {
    userAnswers = {};
    quizResult = null;
    showFlashcards = false;
  }
</script>

<div class="quiz-runner" style="max-width: 720px; margin: 0 auto; padding: 16px;">
  {#if showFlashcards && flashcardItems.length > 0}
    <!-- Active Recall 3D Flashcards View -->
    <div style="margin-bottom: 20px;">
      <button
        onclick={() => (showFlashcards = false)}
        style="background: none; border: none; color: #0f766e; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.95rem; padding: 0;"
      >
        ← Kembali ke Hasil Kuis
      </button>
    </div>
    <FlashcardDeck
      flashcards={flashcardItems}
      title={`Flashcard: ${content.title}`}
      onClose={() => (showFlashcards = false)}
    />
  {:else}
    <!-- Quiz Questions View -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span class="badge-quiz">📝 Kuis Interaktif</span>
        {#if content.readingTimeMinutes}
          <span style="font-size: 0.8rem; color: #64748b;">⏱️ ~{content.readingTimeMinutes} Menit</span>
        {/if}
      </div>
      <h1 style="font-size: 1.6rem; color: #0f172a; margin: 0 0 8px 0; font-weight: 800;">
        {content.title}
      </h1>
      {#if content.summary}
        <p style="color: #64748b; font-size: 0.95rem; margin: 0;">{content.summary}</p>
      {/if}
    </div>

    <!-- Quiz Results Banner when finished -->
    {#if quizResult}
      <div
        style="background: {quizResult.passed ? '#f0fdf4' : '#fff7ed'}; border: 2px solid {quizResult.passed ? '#86efac' : '#fdba74'}; border-radius: 16px; padding: 24px; margin-bottom: 28px; text-align: center;"
      >
        <div style="font-size: 2.5rem; margin-bottom: 8px;">
          {quizResult.passed ? '🏆' : '📚'}
        </div>
        <h2 style="margin: 0 0 6px 0; font-size: 1.4rem; color: #0f172a;">
          Skor Kamu: <span style="color: {quizResult.passed ? '#15803d' : '#c2410c'}; font-weight: 800;">{quizResult.percentage}%</span>
        </h2>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 0.95rem;">
          Berhasil menjawab benar <strong>{quizResult.correctAnswers}</strong> dari <strong>{quizResult.totalQuestions}</strong> soal.
        </p>

        <!-- The Prominent Post-Quiz Flashcard Button -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin: 0 auto;">
          <button
            onclick={openFlashcards}
            disabled={isLoadingFlashcards}
            style="background: #ea580c; color: #ffffff; border: none; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);"
          >
            ⚡ {isLoadingFlashcards ? 'Menyiapkan...' : 'Buka Soal dalam Bentuk Flashcard'}
          </button>
          
          <button
            onclick={retryQuiz}
            style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer;"
          >
            🔄 Ulangi Pengerjaan Kuis
          </button>
        </div>
      </div>
    {/if}

    <!-- Questions List -->
    <div style="display: flex; flex-direction: column; gap: 24px;">
      {#each questions as q, qIndex}
        {@const review = quizResult?.reviews?.find((r) => r.questionId === q.id)}
        <div
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 700; font-size: 0.85rem; color: #0f766e; text-transform: uppercase;">
              Pertanyaan {qIndex + 1}
            </span>
            {#if review}
              <span
                style="font-size: 0.8rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: {review.isCorrect ? '#dcfce7' : '#fee2e2'}; color: {review.isCorrect ? '#15803d' : '#b91c1c'};"
              >
                {review.isCorrect ? '✓ Benar' : '✗ Belum Tepat'}
              </span>
            {/if}
          </div>

          <h3 style="font-size: 1.15rem; color: #0f172a; margin: 0 0 16px 0; line-height: 1.45;">
            {q.question}
          </h3>

          <!-- Options -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            {#each q.options as opt}
              {@const isSelected = userAnswers[q.id] === opt.id}
              {@const isThisCorrect = review?.correctOptionId === opt.id}
              {@const isThisIncorrect = isSelected && !review?.isCorrect}

              <div
                class="quiz-option-card"
                class:selected={isSelected && !review}
                class:correct={review && isThisCorrect}
                class:incorrect={review && isThisIncorrect}
                onclick={() => selectOption(q.id, opt.id)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === ' ' && selectOption(q.id, opt.id)}
              >
                <div
                  style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid {isSelected ? '#0f766e' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                >
                  {#if isSelected}
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #0f766e;"></div>
                  {/if}
                </div>
                <div style="font-size: 0.95rem; line-height: 1.4; color: #1e293b;">
                  {opt.text}
                </div>
              </div>
            {/each}
          </div>

          <!-- Explanation after submission -->
          {#if review}
            <div
              style="margin-top: 14px; background: #f8fafc; border-left: 4px solid #0f766e; padding: 12px 14px; border-radius: 6px; font-size: 0.9rem; color: #334155; line-height: 1.5;"
            >
              <strong>Penjelasan:</strong> {review.explanation}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Submit Action Button -->
    {#if !quizResult && questions.length > 0}
      <div style="margin-top: 32px; text-align: center;">
        <button
          onclick={submitQuiz}
          disabled={isSubmitting || Object.keys(userAnswers).length === 0}
          style="background: #0f766e; color: #ffffff; border: none; padding: 16px 36px; border-radius: 12px; font-weight: 700; font-size: 1.05rem; cursor: pointer; opacity: {Object.keys(userAnswers).length === 0 ? 0.6 : 1};"
        >
          {isSubmitting ? 'Memeriksa Jawaban...' : 'Kirim Jawaban Kuis'}
        </button>
      </div>
    {/if}
  {/if}
</div>
