import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import TaskCard from '@/components/TaskCard';
import { useTaskStore } from '@/store/useTaskStore';
import { getEffectiveStatus, isAbnormalRecord } from '@/utils/timer';
import { projects } from '@/data/projects';
import type { AnesthesiaRecord } from '@/types';
import styles from './index.module.scss';

const filterTabs: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'counting', label: '进行中' },
  { key: 'warning_10min', label: '即将到点' },
  { key: 'time_up', label: '该揭麻了' },
  { key: 'overtime', label: '已超时' },
  { key: 'completed', label: '已完成' },
  { key: 'anomaly', label: '异常记录' },
];

const TasksPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [, setTick] = useState(0);
  const { records, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const enrichedRecords = records.map((r) => {
    const effectiveStatus = getEffectiveStatus(r);
    const abnormal = isAbnormalRecord(r);
    return { ...r, status: effectiveStatus, abnormal };
  });

  const filteredRecords = enrichedRecords.filter((r) => {
    if (activeFilter === 'anomaly') {
      return r.abnormal;
    }
    if (activeFilter !== 'all' && r.status !== activeFilter) return false;
    if (selectedProject !== 'all' && r.projectId !== selectedProject) return false;
    return true;
  });

  const activeCount = enrichedRecords.filter((r) =>
    r.status === 'counting' || r.status === 'warning_10min'
  ).length;
  const timeUpCount = enrichedRecords.filter((r) => r.status === 'time_up').length;
  const overtimeCount = enrichedRecords.filter((r) => r.status === 'overtime').length;
  const completedCount = enrichedRecords.filter((r) => r.status === 'completed').length;
  const anomalyCount = enrichedRecords.filter((r) => r.abnormal).length;

  const handleTaskClick = useCallback((id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    const effectiveStatus = getEffectiveStatus(record);
    if (effectiveStatus === 'completed') {
      Taro.navigateTo({ url: `/pages/review/index?id=${id}` });
    } else {
      Taro.navigateTo({ url: `/pages/countdown/index?id=${id}` });
    }
  }, [records]);

  const getAnomalyTags = (r: AnesthesiaRecord & { abnormal?: boolean }) => {
    const tags: { text: string; red: boolean }[] = [];
    if (getEffectiveStatus(r) === 'overtime') tags.push({ text: '超时', red: true });
    if (getEffectiveStatus(r) === 'time_up') tags.push({ text: '到点未揭', red: false });
    if (r.extended) tags.push({ text: '已加时', red: false });
    if (r.rednessLevel === 'severe') tags.push({ text: '严重红斑', red: true });
    if (r.customerFeeling === '明显刺痛' || r.customerFeeling === '灼热感' || r.customerFeeling === '不适感强') {
      tags.push({ text: '反应强烈', red: true });
    }
    return tags;
  };

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
          <Text className={styles.summaryValue} style={{ color: '#EF4444' }}>{anomalyCount}</Text>
          <Text className={styles.summaryLabel}>异常</Text>
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
            className={classnames(styles.filterBtn, activeFilter === tab.key && styles.filterBtnActive, tab.key === 'anomaly' && styles.filterBtnAnomaly)}
            onClick={() => setActiveFilter(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </ScrollView>

      {activeFilter !== 'anomaly' && (
        <ScrollView scrollX className={styles.projectRow}>
          <View
            className={classnames(styles.projectBtn, selectedProject === 'all' && styles.projectBtnActive)}
            onClick={() => setSelectedProject('all')}
          >
            <Text>全部项目</Text>
          </View>
          {projects.map((p) => (
            <View
              key={p.id}
              className={classnames(styles.projectBtn, selectedProject === p.id && styles.projectBtnActive)}
              onClick={() => setSelectedProject(p.id)}
            >
              <Text>{p.name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View className={styles.taskList}>
        {filteredRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>
              {records.length === 0 ? '暂无任务，去开麻打卡创建吧' : '暂无符合条件的任务'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.id}>
              <TaskCard record={record} onClick={handleTaskClick} />
              {activeFilter === 'anomaly' && getAnomalyTags(record).length > 0 && (
                <View className={styles.anomalyTagsRow}>
                  {getAnomalyTags(record).map((tag, idx) => (
                    <View
                      key={idx}
                      className={classnames(styles.anomalyTag, tag.red && styles.anomalyTagRed)}
                    >
                      <Text>{tag.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default TasksPage;
