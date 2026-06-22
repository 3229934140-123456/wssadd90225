import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import TaskCard from '@/components/TaskCard';
import { useTaskStore } from '@/store/useTaskStore';
import { mockRecords } from '@/data/tasks';
import styles from './index.module.scss';

const filterTabs: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'counting', label: '进行中' },
  { key: 'warning_10min', label: '即将到点' },
  { key: 'overtime', label: '超时' },
  { key: 'completed', label: '已完成' },
];

const TasksPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [, setTick] = useState(0);
  const { records, addRecord } = useTaskStore();

  useEffect(() => {
    if (records.length === 0) {
      mockRecords.forEach((r) => addRecord(r));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const activeCount = records.filter(
    (r) => r.status === 'counting' || r.status === 'warning_10min' || r.status === 'time_up'
  ).length;
  const overtimeCount = records.filter((r) => r.status === 'overtime').length;
  const completedCount = records.filter((r) => r.status === 'completed').length;

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
            <Text className={styles.emptyText}>暂无{activeFilter === 'all' ? '' : '该状态的'}任务</Text>
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
