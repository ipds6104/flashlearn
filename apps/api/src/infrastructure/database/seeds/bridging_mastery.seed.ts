import { createHash } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { workspaces, contents, contentArtifacts } from '../schema';
import { buildCleanVisualDeckHtml } from './bridging_deck_html';
import { BRIDGING_MODULES } from './bridging_modules_data';

export async function seedBridgingMastery(creatorId: string): Promise<void> {
  const [wsInserted] = await db
    .insert(workspaces)
    .values({
      name: 'Akselerasi Pemahaman: Bridging Analogies Lab',
      slug: 'akselerasi-pemahaman-bridging',
      description: 'Belajar konsep mendalam selangkah demi selangkah lewat mikro-simulasi interaktif, jembatan analogi, batas analogi, dan uji pemahaman instan.',
      icon: 'BR',
      isPublic: true,
      creatorId,
    })
    .onConflictDoNothing()
    .returning();

  const workspace =
    wsInserted ||
    (await db.select().from(workspaces).where(eq(workspaces.slug, 'akselerasi-pemahaman-bridging')))[0];

  if (!workspace) return;

  for (const mod of BRIDGING_MODULES) {
    const [existing] = await db
      .select({ id: contents.id })
      .from(contents)
      .where(and(eq(contents.workspaceId, workspace.id), eq(contents.slug, mod.slug)));

    let contentId = existing?.id;
    if (!contentId) {
      const [created] = await db
        .insert(contents)
        .values({
          workspaceId: workspace.id,
          title: mod.title,
          slug: mod.slug,
          type: 'interactive_module',
          summary: mod.summary,
          readingTimeMinutes: mod.readingTimeMinutes,
          body: null,
          questions: null,
          interactivePayload: mod.payload,
          isPublished: true,
        })
        .returning({ id: contents.id });
      contentId = created.id;
    }

    if (contentId && mod.slides.length > 0) {
      const html = buildCleanVisualDeckHtml(mod.title, mod.slides);
      const hash = createHash('sha256').update(html, 'utf-8').digest('hex');
      const [existingArt] = await db
        .select({ id: contentArtifacts.id })
        .from(contentArtifacts)
        .where(
          and(
            eq(contentArtifacts.contentId, contentId),
            eq(contentArtifacts.kind, 'slide_deck_html')
          )
        );
      if (!existingArt) {
        await db.insert(contentArtifacts).values({
          contentId,
          kind: 'slide_deck_html',
          mimeType: 'text/html',
          htmlContent: html,
          sha256Hash: hash,
          byteSize: Buffer.byteLength(html, 'utf-8'),
          metadata: { slideCount: mod.slides.length, lang: 'id', style: 'clean-visual' },
        });
      }
    }
  }

  // Ensure sample Capstone Project Mission (Phase 25) exists in Bridging Mastery workspace
  const projectSlug = 'capstone-rancang-eksperimen-analogi-mandiri';
  const [existingProject] = await db
    .select({ id: contents.id })
    .from(contents)
    .where(and(eq(contents.workspaceId, workspace.id), eq(contents.slug, projectSlug)));

  if (!existingProject) {
    await db.insert(contents).values({
      workspaceId: workspace.id,
      title: 'Proyek Karya Akhir: Rancang Mini-Lab Analogi untuk 1 Konsep Sulit',
      slug: projectSlug,
      type: 'project_mission',
      summary:
        'Terapkan seluruh teknik Bridging Analogies dengan merancang panduan & prototipe eksperimen nyata untuk mengajarkan 1 konsep sulit di bidangmu sendiri.',
      readingTimeMinutes: 45,
      body: null,
      questions: null,
      interactivePayload: null,
      projectPayload: {
        schemaVersion: 'project-mission-v1',
        missionLevel: 'capstone',
        domainCategory: 'Pedagogi & Komunikasi Teknis',
        estimatedMinutes: 45,
        realWorldBrief:
          'Pilih **1 konsep sulit di bidang kerja atau studimu** (misalnya: *Event Loop JavaScript*, *Bunga Majemuk*, *Normalisasi Database*, atau *Inflasi Moneter*) yang sering membuat pemula bingung.\n\nTugasmu bukan menulis ringkasan definisi kamus, melainkan **membangun artefak penjelasan konkret** (halaman web mini, dokumen Markdown interaktif, atau slide visual) yang membawa pembaca dari pengalaman sehari-hari hingga mampu memprediksi skenario baru.',
        authenticDeliverable:
          'Satu artefak publik/lokal (link GitHub/Notion/Google Docs/web demo atau catatan struktur lengkap) berisi 1 jangkar akrab, 2 langkah jembatan analogi, 1 titik batas analogi, dan 1 soal prediksi kausal.',
        starterContext:
          'Mulailah dengan menuliskan miskonsepsi #1 yang paling sering kamu dengar dari pemula tentang konsep pilihanmu sebelum menyusun analoginya.',
        constraints: [
          'Dilarang membuka penjelasan dengan definisi buku teks yang penuh jargon teknis.',
          'Wajib mencantumkan minimal 1 Analogy Breakpoint (menjelaskan secara jujur di mana analogi berhenti berlaku).',
          'Soal uji akhir harus berupa prediksi sebab-akibat ("Apa yang terjadi jika X diubah?"), bukan hafalan istilah.',
        ],
        edgeCasesToTest: [
          'Berikan drafmu kepada 1 orang non-spesialis (atau baca ulang sebagai pemula): apakah ada istilah mendadak yang belum dijelaskan?',
          'Cek apakah pembaca bisa tertipu menganggap analogi 100% sama dengan realitas jika bagian Analogy Breakpoint dihilangkan.',
        ],
        milestones: [
          {
            id: 'ms-1',
            title: 'Pilih konsep target & catat 1 miskonsepsi utama pemula',
            hint: 'Fokus pada konsep yang sering bikin orang menghafal rumus tanpa tahu mengapa rumusnya bekerja.',
          },
          {
            id: 'ms-2',
            title: 'Susun jangkar akrab, 2 jembatan bertahap, dan 1 Analogy Breakpoint',
          },
          {
            id: 'ms-3',
            title: 'Rancang 1 skenario uji prediksi baru & publikasikan/simpan karyamu',
          },
        ],
        selfAuditRubric: [
          {
            id: 'rub-1',
            criterion: 'Jangkar analogi benar-benar akrab bagi pembaca awam',
            verificationMethod: 'Baca paragraf pembuka tanpa menyebut istilah teknis apa pun — apakah tetap masuk akal dalam < 30 detik?',
            redFlag: 'Analogi justru memakai konsep abstrak lain yang sama-sama asing bagi pemula.',
          },
          {
            id: 'rub-2',
            criterion: 'Analogy Breakpoint dinyatakan secara eksplisit & akurat',
            verificationMethod: 'Tunjukkan 1 batas konkret di mana analogi tidak lagi sesuai dengan mekanisme aslinya.',
            redFlag: 'Analogi dibiarkan seolah-olah identik 100% dengan sistem asli.',
          },
          {
            id: 'rub-3',
            criterion: 'Uji akhir menguji transfer kausal, bukan hafalan definisi',
            verificationMethod: 'Pastikan soal akhir tidak bisa dijawab hanya dengan Ctrl+F di teks penjelasan.',
            redFlag: 'Soal berpola "Apa kepanjangan / definisi dari X?".',
          },
        ],
        stretchGoals: [
          'Bangun simulasi interaktif 1 halaman HTML/JS tempat pembaca bisa menggeser parameter dan melihat efek sebab-akibat secara langsung.',
        ],
        relatedConcepts: ['Experiential Anchor', 'Bridging Chain', 'Analogy Breakpoint', 'Causal Transfer'],
      },
      isPublished: true,
    });
  }

  console.log('✓ Bridging Mastery interactive workspace & artifacts ensured.');
}
