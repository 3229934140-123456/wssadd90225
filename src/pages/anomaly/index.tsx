import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import {
  StatsTimeRange,
  filterRecordsByRange,
  getAnomalyTypes,
  getEffectiveStatus,
  groupRecordsByAnomalyType,
  computeAnomalyTrend,
} from '@/utils/timer';
import { ANOMALY_TYPE_LABELS, AnomalyType } from '@/types';
import { getNurseName } from '@/data/nurses';
import styles from './anomaly.module.scss';

const RANGE_TABS: { key: StatsTimeRange; label: string }[] = [
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'all', label: '全部' },
];

const TYPE_TABS: { key: AnomalyType | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: '#8B5CF6' },
  { key: 'overtime', label: '超时', color: '#EF4444' },
  { key: 'extended', label: '加时', color: '#F97316' },
  { key: 'severe_redness', label: '严重红斑', color: '#EF4444' },
  { key: 'strong_reaction', label: '反应强烈', color: '#EF4444' },
];

const AnomalyPage: React.FC = () => {
  const [range, setRange] = useState<StatsTimeRange>('week');
  const [activeType, setActiveType] = useState<AnomalyType | 'all'>('all');
  const { records, reviews, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.type) setActiveType(params.type as AnomalyType | 'all');
    if (params?.range) setRange(params.range as StatsTimeRange);
  }, []);

  const rangeRecords = useMemo(
    () => filterRecordsByRange(records, range),
    [records, range]
  );

  const anomalyGroups = useMemo(
    () => groupRecordsByAnomalyType(rangeRecords),
    [rangeRecords]
  );

  const anomalyTrend = useMemo(
    () => computeAnomalyTrend(rangeRecords, 7),
    [rangeRecords]
  );

  const maxTrendCount = Math.max(...anomalyTrend.map((t) => t.count), 1);

  const filteredRecords = useMemo(() => {
    if (activeType === 'all') {
      return rangeRecords.filter(
        (r) => getAnomalyTypes(r).length > 0
      ).sort((a, b) => b.startTime - a.startTime);
    }
    return anomalyGroups[activeType].sort((a, b) => b.startTime - a.startTime);
  }, [rangeRecords, activeType, anomalyGroups]);

  const getTypeCount = (type: AnomalyType | 'all') => {
    if (type === 'all') {
      return rangeRecords.filter((r) => getAnomalyTypes(r).length > 0).length;
    }
    return anomalyGroups[type].length;
  };

  const totalAnomaly = getTypeCount('all');

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>异常风险汇总</Text>
        <Text className={styles.headerSubTitle}>
          近7天共 {totalAnomaly} 条异常
        </Text>
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

      <Text className={styles.sectionTitle}>
        {RANGE_TABS.find((t) => t.key === range)?.label}异常分布
      </Text>
      <View className={styles.typeGrid}>
        {Object.entries(ANOMALY_TYPE_LABELS).map(([type, label]) => {
          const count = anomalyGroups[type as keyof typeof ANOMALY_TYPE_LABELS].length;
          const isActive = activeType === type;
          return (
            <View
              key={type}
              className={classnames(styles.typeCard, isActive && styles.typeCardActive)}
              onClick={() => setActiveType(type as AnomalyType)}
            >
              <Text className={styles.typeCount} style={{
                color: (type === 'overtime' || type === 'severe_redness' || type === 'strong_reaction')
                  ? '#EF4444' : '#F97316'
              }}>
                {count}
              </Text>
              <Text className={styles.typeLabel}>{label}</Text>
            </View>
          );
        })}
      </View>

      <Text className={styles.sectionTitle}>近7天异常趋势</Text>
      <View className={styles.trendCard}>
        <View className={styles.trendBars}>
          {anomalyTrend.map((item) => (
            <View key={item.date} className={styles.trendBarItem}>
              <View className={styles.trendBarWrap}>
                <View
                  className={styles.trendBar}
                  style={{ height: `${Math.max(8, (item.count / maxTrendCount) * 100)}rpx` }}
                >
                  {item.count > 0 && <Text className={styles.trendBarCount}>{item.count}</Text>}
                </View>
              </View>
              <Text className={styles.trendBarLabel}>{item.date}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text className={styles.sectionTitle}>记录列表</Text>
      <View className={styles.typeTabs}>
        {TYPE_TABS.map((tab) => {
          const count = getTypeCount(tab.key);
          const isActive = activeType === tab.key;
          return (
            <View
              key={tab.key}
              className={classnames(styles.typeTab, isActive && styles.typeTabActive)}
              style={{
                borderColor: isActive ? tab.color : undefined,
                color: isActive ? tab.color : undefined,
                background: isActive ? `${tab.color}10` : undefined,
              }}
              onClick={() => setActiveType(tab.key)}
            >
              <Text>{tab.label} ({count})</Text>
            </View>
          );
        })}
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>该范围内暂无异常记录</Text>
        </View>
      ) : (
        <View className={styles.recordList}>
          {filteredRecords.map((r) => {
            const types = getAnomalyTypes(r);
            const status = getEffectiveStatus(r);
            return (
              <View
                key={r.id}
                className={styles.recordCard}
                onClick={() => Taro.navigateTo({ url: `/pages/review/index?id=${r.id}` })}
              >
                <View className={styles.recordHead}>
                  <View>
                    <Text className={styles.recordTitle}>
                      {r.projectName} - {r.part}
                    </Text>
                    <Text className={styles.recordMeta}>
                      {getNurseName(r.nurseId || 'self')} · {dayjs(r.startTime).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </View>
                  <View
                    className={classnames(
                      styles.statusBadge,
                      status === 'completed' && styles.statusBadgeGreen,
                      status === 'overtime' && styles.statusBadgeRed,
                      status === 'time_up' && styles.statusBadgeOrange,
                    )}
                  >
                    <Text>
                      {{ counting: '进行中', warning_10min: '即将到点', time_up: '该揭麻了', overtime: '已超时', completed: '已完成', pending: '待处理' }[status]}
                    </Text>
                  </View>
                </View>
                <View className={styles.recordTags}>
                  {types.map((type) => (
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
                {r.customerFeeling && (
                  <Text className={styles.recordDesc}>顾客感受：{r.customerFeeling}</Text>
                )}
                {r.rednessDescription && (
                  <Text className={styles.recordDesc}>红斑情况：{r.rednessDescription}</Text>
                )}
                {r.followUp?.status && (
                  <View className={styles.followUpBadge}>
                    <Text
                      style={{
                        color: r.followUp.status === 'pending' ? '#F59E0B'
                          : r.followUp.status === 'followed_up' ? '#10B981'
                          : '#EF4444',
                      }}
                    >
                      {{ pending: '待复查', followed_up: '已跟进', needs_on_site: '需现场带教' }[r.followUp.status]}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default AnomalyPage;
