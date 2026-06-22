import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import TaskCard from '@/components/TaskCard';
import { useTaskStore } from '@/store/useTaskStore';
import { getRemainingTime } from '@/utils/timer';
import styles from './index.module.scss';

const filterTabs: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'counting', label: '进行中' },
  { key: 'warning_10min', label: '即将到点' },
  { key: 'time_up', label: '该揭麻了' },
  { key: 'overtime', label: '已超时' },
  { key: 'completed', label: '已完成' },
];

const TasksPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [, setTick] = useState(0);
  const { records, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStatuses = ['counting', 'warning_10min', 'time_up'];

  const enrichedRecords = records.map((r) => {
    if (activeStatuses.includes(r.status)) {
      const remaining = getRemainingTime(r.startTime, r.duration);
      if (remaining <= -120000 && r.status !== 'overtime') {
        return { ...r, status: 'overtime' as const };
      }
      if (remaining <= 0 && remaining > -120000 && r.status !== 'time_up') {
        return { ...r, status: 'time_up' as const };
      }
    }
    return r;
  });

  const filteredRecords = enrichedRecords.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const activeCount = enrichedRecords.filter((r) =>
    r.status === 'counting' || r.status === 'warning_10min'
  ).length;
  const timeUpCount = enrichedRecords.filter((r) => r.status === 'time_up').length;
  const overtimeCount = enrichedRecords.filter((r) => r.status === 'overtime').length;
  const completedCount = enrichedRecords.filter((r) => r.status === 'completed').length;

  const handleTaskClick = useCallback((id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    if (record.status === 'completed') {
      Taro.navigateTo({ url: `/pages/review/index?id=${id}` });
    } else {
      Taro.navigateTo({ url: `/pages/countdown/index?id=${id}` });
    }
  }, [records]);

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.summarySection}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{activeCount}</Text>
          <Text className={styles.summaryLabel}>进行中</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue} style={{ color: '#F97316' }}>{timeUpCount}</Text>
          <Text className={styles.summaryLabel}>该揭麻了</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue} style={{ color: '#EF4444' }}>{overtimeCount}</Text>
          <Text className={styles.summaryLabel}>超时</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue} style={{ color: '#10B981' }}>{completedCount}</Text>
          <Text className={styles.summaryLabel}>已完成</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterRow}>
        {filterTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.filterBtn, activeFilter === tab.key && styles.filterBtnActive)}
            onClick={() => setActiveFilter(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.taskList}>
        {filteredRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>
              {records.length === 0 ? '暂无任务，去开麻打卡创建吧' : '暂无该状态的任务'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <TaskCard key={record.id} record={record} onClick={handleTaskClick} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default TasksPage;
