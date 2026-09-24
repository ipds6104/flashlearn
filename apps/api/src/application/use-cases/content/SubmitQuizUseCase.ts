import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type {
  QuizSubmissionRequest,
  QuizResultResponse,
  QuestionReviewItem,
} from '@flashlearn/shared';

export class SubmitQuizUseCase {
  constructor(private readonly contentRepository: IContentRepository) {}

  async execute(contentId: string, submission: QuizSubmissionRequest): Promise<QuizResultResponse> {
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    if (!content.hasQuiz() || !content.questions || content.questions.length === 0) {
      throw new Error('This content does not contain a quiz');
    }

    const answerMap = new Map<string, string>();
    for (const ans of submission.answers) {
      answerMap.set(ans.questionId, ans.selectedOptionId);
    }

    let correctCount = 0;
    const reviews: QuestionReviewItem[] = [];

    for (const q of content.questions) {
      const selectedOptionId = answerMap.get(q.id) || '';
      const correctOption = q.options.find((opt) => opt.isCorrect);
      const correctOptionId = correctOption ? correctOption.id : '';
      const isCorrect = selectedOptionId === correctOptionId;

      if (isCorrect) {
        correctCount++;
      }

      reviews.push({
        questionId: q.id,
        question: q.question,
        selectedOptionId,
        correctOptionId,
        isCorrect,
        explanation: q.explanation || 'No explanation provided.',
      });
    }

    const totalQuestions = content.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Persist submission for leaderboard / creator insights
    import('../../../infrastructure/database/db').then(async ({ db }) => {
      const { quizSubmissions } = await import('../../../infrastructure/database/schema');
      db.insert(quizSubmissions)
        .values({
          contentId,
          guestName: submission.guestName || 'Anonim',
          score: correctCount,
          totalQuestions,
          percentage,
          answers: submission.answers,
        })
        .catch(() => {});
    });

    return {
      guestName: submission.guestName,
      score: correctCount,
      totalQuestions,
      correctAnswers: correctCount,
      percentage,
      passed: percentage >= 70,
      reviews,
    };
  }
}
