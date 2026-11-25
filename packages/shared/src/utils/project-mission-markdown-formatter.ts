import type { Content } from '../types/content';
import type { ProjectMissionPayload } from '../types/project-mission';

export function formatProjectMissionToMarkdown(
  content: Content,
  payload: ProjectMissionPayload
): string {
  const levelLabel =
    payload.missionLevel === 'capstone' ? 'Proyek Karya Akhir (Capstone)' : 'Mini-Praktek Unit';
  const lines: string[] = [
    `> **${levelLabel}** · Bidang: ${payload.domainCategory} · Estimasi: ±${payload.estimatedMinutes} menit`,
    '',
  ];

  if (content.summary?.trim()) {
    lines.push(content.summary.trim(), '');
  }

  lines.push('#### Wujud Karya Nyata (Authentic Deliverable)', payload.authenticDeliverable.trim(), '');
  lines.push('#### Brief & Skenario Dunia Nyata', payload.realWorldBrief.trim(), '');

  if (payload.starterContext?.trim()) {
    lines.push('#### Konteks Awal / Starter', payload.starterContext.trim(), '');
  }

  if (payload.constraints.length > 0) {
    lines.push('#### Batasan & Syarat Realistis');
    payload.constraints.forEach((c) => lines.push(`- ${c}`));
    lines.push('');
  }

  if (payload.edgeCasesToTest.length > 0) {
    lines.push('#### Edge Cases yang Wajib Diuji Sendiri');
    payload.edgeCasesToTest.forEach((e) => lines.push(`- ${e}`));
    lines.push('');
  }

  if (payload.milestones && payload.milestones.length > 0) {
    lines.push('#### Tonggak Progres');
    payload.milestones.forEach((m, i) => {
      const hint = m.hint ? ` *(Petunjuk: ${m.hint})*` : '';
      lines.push(`${i + 1}. ${m.title}${hint}`);
    });
    lines.push('');
  }

  if (payload.selfAuditRubric.length > 0) {
    lines.push('#### Rubrik Audit Mandiri (Single-Point Rubric)');
    payload.selfAuditRubric.forEach((r) => {
      lines.push(`- [ ] **${r.criterion}** — *Cara verifikasi*: ${r.verificationMethod}`);
      if (r.redFlag) {
        lines.push(`  - *Red flag*: ${r.redFlag}`);
      }
    });
    lines.push('');
  }

  if (payload.stretchGoals && payload.stretchGoals.length > 0) {
    lines.push('#### Tantangan Ekstra (Opsional)');
    payload.stretchGoals.forEach((g) => lines.push(`- ${g}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}
