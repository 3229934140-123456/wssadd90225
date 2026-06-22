import type { AnesthesiaRecord, Review } from '@/types';
import { projects } from './projects';

export const NURSE_PROFILES: Record<string, { id: string; name: string; level: string; avatarId: number }> = {
  self: { id: 'self', name: '张小美', level: '初级护士', avatarId: 64 },
  rank_1: { id: 'rank_1', name: '李小护', level: '高级护士', avatarId: 91 },
  rank_2: { id: 'rank_2', name: '王小美', level: '中级护士', avatarId: 177 },
  rank_3: { id: 'rank_3', name: '赵小护', level: '初级护士', avatarId: 338 },
  rank_5: { id: 'rank_5', name: '陈小护', level: '初级护士', avatarId: 1027 },
  rank_6: { id: 'rank_6', name: '刘小护', level: '初级护士', avatarId: 1 },
  rank_7: { id: 'rank_7', name: '黄小护', level: '初级护士', avatarId: 2 },
  rank_8: { id: 'rank_8', name: '周小护', level: '实习护士', avatarId: 3 },
  rank_9: { id: 'rank_9', name: '吴小护', level: '实习护士', avatarId: 6 },
  rank_10: { id: 'rank_10', name: '孙小护', level: '实习护士', avatarId: 8 },
};

export function getNurseAvatar(nurseId: string): string {
  const profile = NURSE_PROFILES[nurseId];
  const id = profile?.avatarId || 64;
  return `https://picsum.photos/id/${id}/200/200`;
}

export function getNurseName(nurseId: string): string {
  return NURSE_PROFILES[nurseId]?.name || '未知';
}

export function getNurseLevel(nurseId: string): string {
  return NURSE_PROFILES[nurseId]?.level || '初级护士';
}

function randomProject() {
  return projects[Math.floor(Math.random() * projects.length)];
}

function randomPart(projectId: string) {
  const p = projects.find((x) => x.id === projectId);
  return p?.parts[0] || '面部';
}

function randomDrug(projectId: string) {
  const p = projects.find((x) => x.id === projectId);
  return p?.drugTypes[0] || '利多卡因乳膏';
}

function generateMockRecordsForNurse(nurseId: string): AnesthesiaRecord[] {
  const countMap: Record<string, number> = {
    self: 12,
    rank_1: 18,
    rank_2: 15,
    rank_3: 10,
    rank_5: 8,
    rank_6: 6,
    rank_7: 5,
    rank_8: 4,
    rank_9: 3,
    rank_10: 2,
  };
  const count = countMap[nurseId] || 5;
  const records: AnesthesiaRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 25);
    const hoursAgo = Math.floor(Math.random() * 10) + 1;
    const startTime = now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000);
    const project = randomProject();
    const duration = project.defaultDuration;
    const statusRoll = Math.random();
    let status: AnesthesiaRecord['status'] = 'completed';
    let customerFeeling: AnesthesiaRecord['customerFeeling'];
    let rednessLevel: AnesthesiaRecord['rednessLevel'];
    let extended: boolean | undefined;

    if (daysAgo === 0 && hoursAgo < 1) {
      if (statusRoll < 0.3) status = 'counting';
      else if (statusRoll < 0.5) status = 'warning_10min';
      else if (statusRoll < 0.7) status = 'time_up';
      else if (statusRoll < 0.85) status = 'overtime';
    } else if (statusRoll < 0.1) {
      status = 'overtime';
    }

    if (status === 'completed') {
      const feelingRoll = Math.random();
      if (feelingRoll < 0.4) customerFeeling = '无痛感';
      else if (feelingRoll < 0.7) customerFeeling = '轻微刺痛';
      else if (feelingRoll < 0.85) customerFeeling = '明显刺痛';
      else if (feelingRoll < 0.95) customerFeeling = '灼热感';
      else customerFeeling = '不适感强';

      const rednessRoll = Math.random();
      if (rednessRoll < 0.4) rednessLevel = 'none';
      else if (rednessRoll < 0.75) rednessLevel = 'mild';
      else if (rednessRoll < 0.92) rednessLevel = 'moderate';
      else rednessLevel = 'severe';

      extended = Math.random() < 0.2;
    }

    records.push({
      id: `mock_${nurseId}_${i}`,
      projectId: project.id,
      projectName: project.name,
      part: randomPart(project.id),
      drugType: randomDrug(project.id),
      skinCondition: 'normal',
      photoUrl: `https://picsum.photos/id/${100 + i}/200/200`,
      startTime,
      duration,
      status,
      customerFeeling,
      rednessLevel,
      extended,
      nurseId,
    });
  }

  return records;
}

function generateMockReviewsForRecords(records: AnesthesiaRecord[], nurseId: string): Review[] {
  const reviews: Review[] = [];
  let idx = 0;
  const commentPool = [
    '操作规范，时间把控良好。',
    '记录完整，继续保持。',
    '注意观察顾客反应，及时沟通。',
    '应急处理正确，值得表扬。',
    '建议加强皮肤反应观察记录。',
    '下次可以尝试缩短敷麻时间5分钟。',
    '揭麻时间把控准确，客户反馈良好。',
  ];
  for (const r of records) {
    if (r.status !== 'completed') continue;
    if (Math.random() > 0.6) continue;
    const isAdditional = Math.random() < 0.3;
    const reviewCount = isAdditional ? 2 : 1;
    for (let i = 0; i < reviewCount; i++) {
      const createdAt = r.startTime + (i + 1) * 60 * 60 * 1000;
      reviews.push({
        id: `mock_rev_${nurseId}_${idx}_${i}`,
        recordId: r.id,
        mentorName: i === 0 ? '王老师' : '李老师',
        ratings: (['time_accurate', 'record_complete', 'communication_good', 'emergency_correct'] as const).slice(0, Math.floor(Math.random() * 3) + 1),
        comment: commentPool[Math.floor(Math.random() * commentPool.length)],
        createdAt: new Date(createdAt).toISOString().slice(0, 16).replace('T', ' '),
      });
      idx++;
    }
  }
  return reviews;
}

export function generateAllMockData(): { records: AnesthesiaRecord[]; reviews: Review[] } {
  const nurseIds = Object.keys(NURSE_PROFILES);
  const allRecords: AnesthesiaRecord[] = [];
  const allReviews: Review[] = [];

  for (const nurseId of nurseIds) {
    const records = generateMockRecordsForNurse(nurseId);
    const reviews = generateMockReviewsForRecords(records, nurseId);
    allRecords.push(...records);
    allReviews.push(...reviews);
  }

  return { records: allRecords, reviews: allReviews };
}

export const NURSE_IDS = Object.keys(NURSE_PROFILES);
