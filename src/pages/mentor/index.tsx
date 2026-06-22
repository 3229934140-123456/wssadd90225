import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import {
  computeStatsInRange,
  StatsTimeRange,
  isAbnormalRecord,
  getEffectiveStatus,
} from '@/utils/timer';
import { mockGrowthRank } from '@/data/tasks';
import styles from './index.module.scss';

const RANGE_TABS: { key: StatsTimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'all', label: '全部' },
];

interface NurseStat {
  id: string;
  name: string;
  avatar: string;
  level: string;
  totalTasks: number;
  completedTasks: number;
  overtimeTasks: number;
  abnormalTasks: number;
  reviewedTasks: number;
  reviewCoverage: string;
  score: number;
}

const MOCK_NURSES: NurseStat[] = mockGrowthRank
  .filter((r) => r.id !== 'rank_4')
  .map((r) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    level: '初级护士',
    totalTasks: Math.floor(Math.random() * 30) + 10,
    completedTasks: Math.floor(Math.random() * 25) + 5,
    overtimeTasks: Math.floor(Math.random() * 4),
    abnormalTasks: Math.floor(Math.random() * 5),
    reviewedTasks: 0,
    reviewCoverage: '0%',
    score: r.score,
  }));

const MentorPage: React.FC = () => {
  const [range, setRange] = useState<StatsTimeRange>('today');
  const { records, reviews, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  const myStats = computeStatsInRange(records, range);
  const myReviewed = records.filter((r) => reviews.some((rv) => rv.recordId === r.id)).length;
  const myCoverage = records.length > 0 ? Math.round((myReviewed / records.length) * 100) : 0;

  const nurseList: NurseStat[] = [
    {
      id: 'self',
      name: '张小美',
      avatar: 'https://picsum.photos/id/64/200/200',
      level: '初级护士',
      totalTasks: myStats.totalTasks,
      completedTasks: myStats.completedTasks,
      overtimeTasks: myStats.overtimeTasks,
      abnormalTasks: myStats.abnormalTasks,
      reviewedTasks: myReviewed,
      reviewCoverage: `${myCoverage}%`,
      score: myStats.standardRecordCount * 2 + myStats.consecutiveNoOvertimeDays * 3 - myStats.abnormalTasks,
    },
    ...MOCK_NURSES.map((n) => ({
      ...n,
      reviewedTasks: Math.floor(n.totalTasks * (0.3 + Math.random() * 0.5)),
      reviewCoverage: n.totalTasks > 0
        ? `${Math.round((Math.floor(n.totalTasks * (0.3 + Math.random() * 0.5)) / n.totalTasks) * 100)}%`
        : '0%',
    })),
  ].sort((a, b) => b.score - a.score);

  const handleNurseClick = (id: string, name: string) => {
    Taro.navigateTo({ url: `/pages/nurse/index?id=${id}&name=${encodeURIComponent(name)}` });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.rangeTabs}>
        {RANGE_TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.rangeTab, range === tab.key && styles.rangeTabActive)}
            onClick={() => setRange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.summarySection}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#8B5CF6' }}>
            {records.length}
          </Text>
          <Text className={styles.summaryLabel}>总任务</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#10B981' }}>
            {myStats.completedTasks}
          </Text>
          <Text className={styles.summaryLabel}>已完成</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#EF4444' }}>
            {myStats.abnormalTasks}
          </Text>
          <Text className={styles.summaryLabel}>异常</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#F59E0B' }}>
            {myCoverage}%
          </Text>
          <Text className={styles.summaryLabel}>点评覆盖</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>护士概况</Text>
      <View className={styles.nurseList}>
        {nurseList.map((nurse, idx) => (
          <View key={nurse.id} className={styles.nurseCard} onClick={() => handleNurseClick(nurse.id, nurse.name)}>
            <View className={styles.nurseHead}>
              <View className={styles.rankBadge}>{idx + 1}</View>
              <Image className={styles.nurseAvatar} src={nurse.avatar} mode="aspectFill" />
              <View className={styles.nurseInfo}>
                <Text className={styles.nurseName}>{nurse.name}{nurse.id === 'self' ? '（我）' : ''}</Text>
                <Text className={styles.nurseLevel}>{nurse.level}</Text>
              </View>
              <View className={styles.arrow}>›</View>
            </View>
            <View className={styles.nurseStats}>
              <View className={styles.nurseStatItem}>
                <Text className={styles.nurseStatValue}>{nurse.completedTasks}/{nurse.totalTasks}</Text>
                <Text className={styles.nurseStatLabel}>完成/总数</Text>
              </View>
              <View className={styles.nurseStatItem}>
                <Text className={styles.nurseStatValue} style={{ color: '#EF4444' }}>{nurse.overtimeTasks}</Text>
                <Text className={styles.nurseStatLabel}>超时</Text>
              </View>
              <View className={styles.nurseStatItem}>
                <Text className={styles.nurseStatValue} style={{ color: '#F97316' }}>{nurse.abnormalTasks}</Text>
                <Text className={styles.nurseStatLabel}>异常</Text>
              </View>
              <View className={styles.nurseStatItem}>
                <Text className={styles.nurseStatValue} style={{ color: '#8B5CF6' }}>{nurse.reviewCoverage}</Text>
                <Text className={styles.nurseStatLabel}>点评覆盖</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {range !== 'all' && records.length > 0 && (
        <>
          <Text className={styles.sectionTitle}>{RANGE_TABS.find((t) => t.key === range)?.label}异常记录</Text>
          <View className={styles.recentList}>
            {records
              .filter((r) => {
                if (range === 'today') {
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  return r.startTime >= d.getTime();
                }
                if (range === 'week') return r.startTime >= Date.now() - 7 * 24 * 3600 * 1000;
                if (range === 'month') return r.startTime >= Date.now() - 30 * 24 * 3600 * 1000;
                return true;
              })
              .filter((r) => isAbnormalRecord(r))
              .map((r) => (
                <View
                  key={r.id}
                  className={styles.recordItem}
                  onClick={() => Taro.navigateTo({ url: `/pages/review/index?id=${r.id}` })}
                >
                  <View className={styles.recordRowMain}>
                    <Text className={styles.recordTitle}>{r.projectName} - {r.part}</Text>
                    <Text className={styles.recordTime}>{dayjs(r.startTime).format('MM-DD HH:mm')}</Text>
                  </View>
                  <View className={styles.recordTags}>
                    {getEffectiveStatus(r) === 'overtime' && (
                      <View className={styles.tagRed}><Text>超时</Text></View>
                    )}
                    {getEffectiveStatus(r) === 'time_up' && (
                      <View className={styles.tagOrange}><Text>到点未揭</Text></View>
                    )}
                    {r.extended && <View className={styles.tagOrange}><Text>已加时</Text></View>}
                    {r.rednessLevel === 'severe' && <View className={styles.tagRed}><Text>严重红斑</Text></View>}
                    {(r.customerFeeling === '明显刺痛' || r.customerFeeling === '灼热感' || r.customerFeeling === '不适感强') && (
                      <View className={styles.tagRed}><Text>反应强烈</Text></View>
                    )}
                  </View>
                </View>
              ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default MentorPage;
