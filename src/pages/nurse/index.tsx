import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import {
  StatsTimeRange,
  computeStatsInRange,
  isAbnormalRecord,
  getEffectiveStatus,
} from '@/utils/timer';
import { reviewRatingLabels } from '@/data/tasks';
import styles from './nurse.module.scss';

const RANGE_TABS: { key: StatsTimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'all', label: '全部' },
];

const MOCK_NURSE_PROFILE: Record<string, { name: string; avatar: string; level: string }> = {
  rank_1: { name: '李小护', avatar: 'https://picsum.photos/id/91/200/200', level: '高级护士' },
  rank_2: { name: '王小美', avatar: 'https://picsum.photos/id/177/200/200', level: '中级护士' },
  rank_3: { name: '赵小护', avatar: 'https://picsum.photos/id/338/200/200', level: '初级护士' },
  rank_5: { name: '陈小护', avatar: 'https://picsum.photos/id/1027/200/200', level: '初级护士' },
  rank_6: { name: '刘小护', avatar: 'https://picsum.photos/id/1/200/200', level: '初级护士' },
  rank_7: { name: '黄小护', avatar: 'https://picsum.photos/id/2/200/200', level: '初级护士' },
  rank_8: { name: '周小护', avatar: 'https://picsum.photos/id/3/200/200', level: '实习护士' },
  rank_9: { name: '吴小护', avatar: 'https://picsum.photos/id/6/200/200', level: '实习护士' },
  rank_10: { name: '孙小护', avatar: 'https://picsum.photos/id/8/200/200', level: '实习护士' },
  self: { name: '张小美', avatar: 'https://picsum.photos/id/64/200/200', level: '初级护士' },
};

const NursePage: React.FC = () => {
  const [range, setRange] = useState<StatsTimeRange>('week');
  const [nurseId, setNurseId] = useState('self');
  const [nurseName, setNurseName] = useState('张小美');
  const { records, reviews, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) setNurseId(params.id);
    if (params?.name) setNurseName(decodeURIComponent(params.name));
    if (params?.id) {
      const profile = MOCK_NURSE_PROFILE[params.id];
      if (profile?.name) setNurseName(profile.name);
    }
  }, []);

  const nurseProfile = MOCK_NURSE_PROFILE[nurseId] || {
    name: nurseName,
    avatar: 'https://picsum.photos/id/64/200/200',
    level: '初级护士',
  };

  const stats = computeStatsInRange(records, range);
  const reviewedCount = records.filter((r) => reviews.some((rv) => rv.recordId === r.id)).length;
  const coverage = records.length > 0 ? Math.round((reviewedCount / records.length) * 100) : 0;

  const filteredRecords = records
    .filter((r) => {
      if (range === 'all') return true;
      if (range === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return r.startTime >= d.getTime();
      }
      if (range === 'week') return r.startTime >= Date.now() - 7 * 24 * 3600 * 1000;
      if (range === 'month') return r.startTime >= Date.now() - 30 * 24 * 3600 * 1000;
      return true;
    })
    .sort((a, b) => b.startTime - a.startTime);

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.profileCard}>
        <Image className={styles.avatar} src={nurseProfile.avatar} mode="aspectFill" />
        <View className={styles.profileInfo}>
          <Text className={styles.profileName}>{nurseProfile.name}</Text>
          <Text className={styles.profileLevel}>{nurseProfile.level}</Text>
        </View>
      </View>

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

      <View className={styles.statsGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.totalTasks}</Text>
          <Text className={styles.statLabel}>总任务</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.completedTasks}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#EF4444' }}>{stats.overtimeTasks}</Text>
          <Text className={styles.statLabel}>超时</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#F97316' }}>{stats.abnormalTasks}</Text>
          <Text className={styles.statLabel}>异常</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.standardRecordCount}</Text>
          <Text className={styles.statLabel}>规范记录</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#8B5CF6' }}>{coverage}%</Text>
          <Text className={styles.statLabel}>点评覆盖</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>复盘记录</Text>
      <View className={styles.recordList}>
        {filteredRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无记录</Text>
          </View>
        ) : (
          filteredRecords.map((r) => {
            const effectiveStatus = getEffectiveStatus(r);
            const recordReviews = reviews.filter((rv) => rv.recordId === r.id);
            const abnormal = isAbnormalRecord(r);
            return (
              <View
                key={r.id}
                className={classnames(styles.recordCard, abnormal && styles.recordCardAbnormal)}
                onClick={() => Taro.navigateTo({ url: `/pages/review/index?id=${r.id}` })}
              >
                <View className={styles.recordHead}>
                  <View>
                    <Text className={styles.recordTitle}>{r.projectName} - {r.part}</Text>
                    <Text className={styles.recordTime}>{dayjs(r.startTime).format('YYYY-MM-DD HH:mm')}</Text>
                  </View>
                  <View
                    className={classnames(
                      styles.statusBadge,
                      effectiveStatus === 'completed' && styles.statusBadgeGreen,
                      effectiveStatus === 'overtime' && styles.statusBadgeRed,
                      effectiveStatus === 'time_up' && styles.statusBadgeOrange,
                    )}
                  >
                    <Text>
                      {{ counting: '进行中', warning_10min: '即将到点', time_up: '该揭麻了', overtime: '已超时', completed: '已完成', pending: '待处理' }[effectiveStatus]}
                    </Text>
                  </View>
                </View>

                {abnormal && (
                  <View className={styles.recordTags}>
                    {effectiveStatus === 'overtime' && <View className={styles.tagRed}><Text>超时</Text></View>}
                    {effectiveStatus === 'time_up' && <View className={styles.tagOrange}><Text>到点未揭</Text></View>}
                    {r.extended && <View className={styles.tagOrange}><Text>已加时</Text></View>}
                    {r.rednessLevel === 'severe' && <View className={styles.tagRed}><Text>严重红斑</Text></View>}
                    {(r.customerFeeling === '明显刺痛' || r.customerFeeling === '灼热感' || r.customerFeeling === '不适感强') && (
                      <View className={styles.tagRed}><Text>反应强烈</Text></View>
                    )}
                  </View>
                )}

                {recordReviews.length > 0 && (
                  <View className={styles.reviewPreview}>
                    <Text className={styles.reviewPreviewTitle}>
                      老师点评（{recordReviews.length}次）
                    </Text>
                    {recordReviews.slice(0, 2).map((rv, i) => (
                      <View key={rv.id} className={styles.reviewPreviewItem}>
                        <View className={styles.reviewPreviewHead}>
                          <Text className={styles.reviewPreviewName}>{rv.mentorName}</Text>
                          <Text className={styles.reviewPreviewTime}>{rv.createdAt}</Text>
                        </View>
                        {rv.ratings.length > 0 && (
                          <View className={styles.ratingTags}>
                            {rv.ratings.slice(0, 3).map((rating) => (
                              <View key={rating} className={styles.ratingTag}><Text>{reviewRatingLabels[rating]}</Text></View>
                            ))}
                          </View>
                        )}
                        {rv.comment && <Text className={styles.reviewPreviewComment}>{rv.comment}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default NursePage;
