import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../../infrastructure/database/db';
import { quizSubmissions } from '../../../infrastructure/database/schema';

export interface CheckGuestNameResult {
  isTaken: boolean;
  suggestedName: string;
}

export class CheckGuestNameUseCase {
  async execute(contentId: string, name: string): Promise<CheckGuestNameResult> {
    const trimmed = name.trim();
    if (!trimmed) {
      return { isTaken: false, suggestedName: '' };
    }

    const matches = await db
      .select({ guestName: quizSubmissions.guestName })
      .from(quizSubmissions)
      .where(
        and(
          eq(quizSubmissions.contentId, contentId),
          sql`LOWER(${quizSubmissions.guestName}) LIKE LOWER(${trimmed} || '%')`
        )
      );

    const exactMatch = matches.some(
      (m) => m.guestName && m.guestName.toLowerCase() === trimmed.toLowerCase()
    );

    if (!exactMatch) {
      return { isTaken: false, suggestedName: trimmed };
    }

    // Generate auto-disambiguation suffix, e.g. "Budi (2)"
    const count = matches.length;
    const suggestedName = `${trimmed} (${count + 1})`;

    return {
      isTaken: true,
      suggestedName,
    };
  }
}
