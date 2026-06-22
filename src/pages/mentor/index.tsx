import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import {
  computeStatsInRangeForNurse,
  StatsTimeRange,
  isAbnormalRecord,
  getEffectiveStatus,
  getAnomalyTypes,
  groupRecordsByAnomalyType,
  computeAnomalyTrend,
  filterRecordsByRange,
} from '@/utils/timer';
import { ANOMALY_TYPE_LABELS } from '@/types';
import { NURSE_PROFILES, getNurseAvatar, getNurseName, getNurseLevel, NURSE_IDS } from '@/data/nurses';
import styles from './index.module.scss';

const RANGE_TABS: { key: StatsTimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'all', label: '全部' },
];

const MentorPage: React.FC = () => {
  const [range, setRange] = useState<StatsTimeRange>('week');
  const { records, reviews, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  const rangeRecords = useMemo(() => filterRecordsByRange(records, range), [records, range]);
  const rangeReviews = useMemo(
    () => reviews.filter((rv) => rangeRecords.some((r) => r.id === rv.recordId)),
    [reviews, rangeRecords]
  );

  const totalTasks = rangeRecords.length;
  const completedTasks = rangeRecords.filter(
    (r) => getEffectiveStatus(r) === 'completed'
  ).length;
  const abnormalTasks = rangeRecords.filter((r) => isAbnormalRecord(r)).length;
  const reviewedCount = rangeRecords.filter((r) =>
    rangeReviews.some((rv) => rv.recordId === r.id)
  ).length;
  const coverage = totalTasks > 0 ? Math.round((reviewedCount / totalTasks) * 100) : 0;

  const pendingFollowUps = rangeRecords.filter(
    (r) => r.followUp?.status === 'pending'
  ).length;

  const nurseStats = useMemo(() => {
    return NURSE_IDS.map((nurseId) => {
      const stats = computeStatsInRangeForNurse(records, reviews, range, nurseId);
      const reviewed = stats.reviewedCount;
      const coverageVal = stats.coverage;
      return {
        id: nurseId,
        name: getNurseName(nurseId),
        avatar: getNurseAvatar(nurseId),
        level: getNurseLevel(nurseId),
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        overtimeTasks: stats.overtimeTasks,
        abnormalTasks: stats.abnormalTasks,
        reviewedTasks: reviewed,
        reviewCoverage: `${coverageVal}%`,
        score: stats.standardRecordCount * 2 + stats.consecutiveNoOvertimeDays * 3 - stats.abnormalTasks,
      };
    }).filter((n) => n.totalTasks > 0).sort((a, b) => b.score - a.score);
  }, [records, reviews, range]);

  const anomalyGroups = useMemo(
    () => groupRecordsByAnomalyType(rangeRecords),
    [rangeRecords]
  );

  const anomalyTrend = useMemo(
    () => computeAnomalyTrend(records, 7),
    [records]
  );

  const maxTrendCount = Math.max(...anomalyTrend.map((t) => t.count), 1);

  const handleNurseClick = (id: string, name: string) => {
    Taro.navigateTo({ url: `/pages/nurse/index?id=${id}&name=${encodeURIComponent(name)}` });
  };

  const handleAnomalyGroupClick = (type: string) => {
    Taro.navigateTo({
      url: `/pages/anomaly/index?type=${type}&range=${range}`,
    });
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
            {totalTasks}
          </Text>
          <Text className={styles.summaryLabel}>总任务</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#10B981' }}>
            {completedTasks}
          </Text>
          <Text className={styles.summaryLabel}>已完成</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#EF4444' }}>
            {abnormalTasks}
          </Text>
          <Text className={styles.summaryLabel}>异常</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum} style={{ color: '#F59E0B' }}>
            {coverage}%
          </Text>
          <Text className={styles.summaryLabel}>点评覆盖</Text>
        </View>
      </View>

      <View className={styles.quickActions}>
        <View className={styles.quickCard} onClick={() => Taro.navigateTo({ url: `/pages/anomaly/index?range=${range}` })}>
          <Text className={styles.quickIcon}>📊</Text>
          <View>
            <Text className={styles.quickTitle}>异常风险汇总</Text>
            <Text className={styles.quickDesc}>按类型查看最近趋势</Text>
          </View>
          <Text className={styles.quickArrow}>›</Text>
        </View>
        <View className={styles.quickCard}>
          <Text className={styles.quickIcon}>⏳</Text>
          <View>
            <Text className={styles.quickTitle}>待跟进</Text>
            <Text className={styles.quickDesc}>
              {pendingFollowUps} 条记录需要复查
            </Text>
          </View>
          <Text className={styles.quickArrow}>{pendingFollowUps > 0 ? pendingFollowUps : '✓'}</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>
        异常趋势（近7天）
      </Text>
      <View className={styles.trendCard}>
        <View className={styles.trendBars}>
          {anomalyTrend.map((item) => (
            <View key={item.date} className={styles.trendBarItem}>
              <View className={styles.trendBarWrap}>
                <View
                  className={styles.trendBar}
                  style={{ height: `${Math.max(6, (item.count / maxTrendCount) * 100)}rpx` }}
                >
                  {item.count > 0 && <Text className={styles.trendBarCount}>{item.count}</Text>}
                </View>
              </View>
              <Text className={styles.trendBarLabel}>{item.date}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text className={styles.sectionTitle}>异常类型分布</Text>
      <View className={styles.anomalyGrid}>
        {Object.entries(ANOMALY_TYPE_LABELS).map(([type, label]) => {
          const count = anomalyGroups[type as keyof typeof ANOMALY_TYPE_LABELS].length;
          return (
            <View
              key={type}
              className={styles.anomalyCard}
              onClick={() => handleAnomalyGroupClick(type)}
            >
              <View className={styles.anomalyHead}>
                <Text className={styles.anomalyCount} style={{
                  color: (type === 'overtime' || type === 'severe_redness' || type === 'strong_reaction')
                    ? '#EF4444' : '#F97316'
                }}>
                  {count}
                </Text>
                <Text className={styles.anomalyLabel}>{label}</Text>
              </View>
              <View className={styles.anomalyTag}>
                <Text>查看详情 ›</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text className={styles.sectionTitle}>护士概况</Text>
      <View className={styles.nurseList}>
        {nurseStats.map((nurse, idx) => (
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

      {rangeRecords.filter((r) => isAbnormalRecord(r)).length > 0 && (
        <>
          <Text className={styles.sectionTitle}>
            {RANGE_TABS.find((t) => t.key === range)?.label}异常记录
          </Text>
          <View className={styles.recentList}>
            {rangeRecords
              .filter((r) => isAbnormalRecord(r))
              .sort((a, b) => b.startTime - a.startTime)
              .slice(0, 8)
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
                    {getAnomalyTypes(r).map((type) => (
                      <View
                        key={type}
                        className={classnames(
                          (type === 'overtime' || type === 'severe_redness' || type === 'strong_reaction')
                            ? styles.tagRed : styles.tagOrange
                        )}
                      >
                        <Text>{ANOMALY_TYPE_LABELS[type]}</Text>
                      </View>
                    ))}
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
