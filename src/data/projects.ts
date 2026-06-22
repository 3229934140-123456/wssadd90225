import type { Project } from '@/types';

export const projects: Project[] = [
  {
    id: 'laser',
    name: '光电项目',
    defaultDuration: 30,
    parts: ['面部', '颈部', '手背', '手臂'],
    drugTypes: ['利多卡因乳膏', '复方利多卡因乳膏', 'EMLA乳膏'],
  },
  {
    id: 'lips',
    name: '唇部项目',
    defaultDuration: 20,
    parts: ['上唇', '下唇', '全唇', '唇周'],
    drugTypes: ['利多卡因乳膏', '复方利多卡因乳膏', '表面麻醉喷雾'],
  },
  {
    id: 'eyebrow',
    name: '眉部项目',
    defaultDuration: 25,
    parts: ['左眉', '右眉', '全眉', '眉尾'],
    drugTypes: ['利多卡因乳膏', '复方利多卡因乳膏'],
  },
  {
    id: 'injectable',
    name: '注射项目',
    defaultDuration: 40,
    parts: ['额头', '太阳穴', '苹果肌', '法令纹', '下巴'],
    drugTypes: ['利多卡因乳膏', 'EMLA乳膏', '冰敷麻醉'],
  },
  {
    id: 'skin',
    name: '皮肤管理',
    defaultDuration: 15,
    parts: ['面部', '颈部', '前胸', '背部'],
    drugTypes: ['利多卡因乳膏', '温和舒缓凝胶'],
  },
  {
    id: 'hair',
    name: '脱毛项目',
    defaultDuration: 30,
    parts: ['面部', '腋下', '手臂', '腿部', '比基尼线'],
    drugTypes: ['利多卡因乳膏', '复方利多卡因乳膏', 'EMLA乳膏'],
  },
  {
    id: 'microneedle',
    name: '微针项目',
    defaultDuration: 35,
    parts: ['面部', '颈部', '手背'],
    drugTypes: ['利多卡因乳膏', '复方利多卡因乳膏', 'EMLA乳膏'],
  },
  {
    id: 'thread',
    name: '线雕项目',
    defaultDuration: 45,
    parts: ['面部', '下颌线', '苹果肌', '法令纹'],
    drugTypes: ['利多卡因乳膏', 'EMLA乳膏', '局部浸润麻醉'],
  },
];

export const skinConditionLabels: Record<string, string> = {
  normal: '正常',
  sensitive: '敏感',
  damaged: '受损',
  inflamed: '炎症',
};

export const statusLabels: Record<string, string> = {
  pending: '待执行',
  counting: '倒计时中',
  warning_10min: '即将到点',
  time_up: '该揭麻了',
  overtime: '已超时',
  completed: '已完成',
};

export const statusColors: Record<string, string> = {
  pending: '#86909C',
  counting: '#3B82F6',
  warning_10min: '#F59E0B',
  time_up: '#F97316',
  overtime: '#EF4444',
  completed: '#10B981',
};
