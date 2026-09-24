import * as XLSX from 'xlsx';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { UserRole } from '@flashlearn/shared';

export class ExportSubmissionsUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    currentUserId: string,
    role: UserRole,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ buffer: Uint8Array; filename: string; mimeType: string }> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) {
      throw new Error('Associated workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only export submissions from your own workspaces');
    }

    const submissions = await this.contentRepository.listSubmissions(contentId);

    const rows = submissions.map((sub, index) => {
      const isPassed = sub.percentage >= 70;
      const formattedDate = new Date(sub.createdAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      return {
        No: index + 1,
        'Nama Peserta': sub.guestName || sub.userName || 'Anonim',
        Email: sub.userEmail || '-',
        'Nilai (%)': `${sub.percentage}%`,
        'Skor Benar': sub.score,
        'Total Soal': sub.totalQuestions,
        Status: isPassed ? 'Lulus' : 'Belum Lulus',
        'Waktu Pengerjaan (WIB)': formattedDate,
        'ID Percobaan': sub.id,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Peserta');

    // Auto-fit column widths
    const columnWidths = [
      { wch: 6 },  // No
      { wch: 25 }, // Nama Peserta
      { wch: 25 }, // Email
      { wch: 12 }, // Nilai (%)
      { wch: 12 }, // Skor Benar
      { wch: 12 }, // Total Soal
      { wch: 15 }, // Status
      { wch: 26 }, // Waktu Pengerjaan
      { wch: 38 }, // ID Percobaan
    ];
    worksheet['!cols'] = columnWidths;

    const safeTitle = content.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      // Prepend UTF-8 BOM so Excel opens CSV without encoding glitches
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const encoder = new TextEncoder();
      const csvBytes = encoder.encode(csvString);
      const combined = new Uint8Array(bom.length + csvBytes.length);
      combined.set(bom, 0);
      combined.set(csvBytes, bom.length);

      return {
        buffer: combined,
        filename: `flashlearn_submissions_${safeTitle}_${dateStr}.csv`,
        mimeType: 'text/csv;charset=utf-8',
      };
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return {
      buffer: new Uint8Array(buffer),
      filename: `flashlearn_submissions_${safeTitle}_${dateStr}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
