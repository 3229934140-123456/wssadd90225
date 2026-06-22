import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import CountdownDisplay from '@/components/CountdownDisplay';
import { useTaskStore } from '@/store/useTaskStore';
import { getRemainingTime, OVERTIME_GRACE_MS } from '@/utils/timer';
import { knowledgeTips } from '@/data/knowledge';
import type { AnesthesiaRecord, TaskStatus } from '@/types';
import styles from './index.module.scss';

type Phase = 'counting' | 'warning_10min' | 'time_up' | 'overtime' | 'completed';

const PHASE_CONFIG: Record<string, { icon: string; title: string; desc: string }> = {
  warning_10min: { icon: '⏰', title: '10分钟预警', desc: '距到点10分钟，请提前准备' },
  time_up: { icon: '🔔', title: '准点提醒', desc: '敷麻时间到，该揭麻了！' },
  overtime: { icon: '🚨', title: '超时警告', desc: '已超时，请立即处理！' },
};

const CountdownPage: React.FC = () => {
  const [record, setRecord] = useState<AnesthesiaRecord | null>(null);
  const [, setTick] = useState(0);
  const { records, updateRecordStatus } = useTaskStore();
  const lastNotifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const found = records.find((r) => r.id === params.id);
      if (found) {
        setRecord(found);
        console.info('[Countdown] Record loaded:', found.id);
      }
    }
  }, [records]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      if (!record) return;
      const remaining = getRemainingTime(record.startTime, record.duration);
      const tenMinMs = 10 * 60 * 1000;

      let newStatus: TaskStatus | null = null;

      if (remaining <= -OVERTIME_GRACE_MS && record.status !== 'overtime' && record.status !== 'completed') {
        newStatus = 'overtime';
        if (!lastNotifiedRef.current.has('overtime')) {
          lastNotifiedRef.current.add('overtime');
          Taro.showToast({ title: '已超时！请立即处理', icon: 'none', duration: 3000 });
          console.warn('[Countdown] Overtime detected:', record.id);
        }
      } else if (remaining <= 0 && remaining > -OVERTIME_GRACE_MS && record.status !== 'time_up' && record.status !== 'overtime' && record.status !== 'completed') {
        newStatus = 'time_up';
        if (!lastNotifiedRef.current.has('time_up')) {
          lastNotifiedRef.current.add('time_up');
          Taro.showToast({ title: '时间到了，该揭麻了！', icon: 'none', duration: 3000 });
          console.info('[Countdown] Time up:', record.id);
        }
      } else if (remaining > 0 && remaining <= tenMinMs && record.status === 'counting') {
        newStatus = 'warning_10min';
        if (!lastNotifiedRef.current.has('warning_10min')) {
          lastNotifiedRef.current.add('warning_10min');
          Taro.showToast({ title: '即将到点，请准备揭麻', icon: 'none' });
          console.info('[Countdown] 10-minute warning:', record.id);
        }
      }

      if (newStatus) {
        updateRecordStatus(record.id, newStatus);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [record]);

  if (!record) {
    return (
      <View className={styles.container}>
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  const remaining = getRemainingTime(record.startTime, record.duration);
  const tenMinMs = 10 * 60 * 1000;
  const currentPhase: Phase = (() => {
    if (record.status === 'completed') return 'completed';
    if (remaining <= -OVERTIME_GRACE_MS) return 'overtime';
    if (remaining <= 0) return 'time_up';
    if (remaining <= tenMinMs) return 'warning_10min';
    return 'counting';
  })();

  const relatedTips = knowledgeTips.filter((t) => t.projectId === record.projectId).slice(0, 2);

  const getPhaseStatus = (phase: 'warning_10min' | 'time_up' | 'overtime') => {
    const phaseOrder = ['counting', 'warning_10min', 'time_up', 'overtime', 'completed'];
    const currentIdx = phaseOrder.indexOf(currentPhase);
    const phaseIdx = phaseOrder.indexOf(phase);
    if (currentIdx > phaseIdx) return 'done';
    if (currentIdx === phaseIdx) return 'active';
    return 'pending';
  };

  const handleComplete = () => {
    updateRecordStatus(record.id, 'completed');
    Taro.navigateTo({ url: `/pages/review/index?id=${record.id}` });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.countdownSection}>
        <CountdownDisplay record={record} />
      </View>

      <View className={styles.reminderCards}>
        {(['warning_10min', 'time_up', 'overtime'] as const).map((phase) => {
          const config = PHASE_CONFIG[phase];
          const status = getPhaseStatus(phase);
          return (
            <View key={phase} className={classnames(
              styles.reminderCard,
              status === 'active' && styles.reminderCardActive
            )}>
              <Text className={styles.reminderIcon}>{config.icon}</Text>
              <View className={styles.reminderContent}>
                <Text className={styles.reminderTitle}>{config.title}</Text>
                <Text className={styles.reminderDesc}>{config.desc}</Text>
              </View>
              <View className={classnames(
                styles.reminderStatus,
                status === 'pending' && styles.statusPending,
                status === 'active' && styles.statusActive,
                status === 'done' && styles.statusDone
              )}>
                <Text>{status === 'pending' ? '等待中' : status === 'active' ? '进行中' : '已触发'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {relatedTips.length > 0 && (
        <View className={styles.actionSection}>
          {relatedTips.map((tip) => (
            <View key={tip.id} className={styles.reminderCard}>
              <Text className={styles.reminderIcon}>{tip.icon}</Text>
              <View className={styles.reminderContent}>
                <Text className={styles.reminderTitle}>{tip.title}</Text>
                <Text className={styles.reminderDesc}>{tip.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {record.status !== 'completed' && (
        <View className={styles.bottomBar}>
          <View className={styles.completeBtn} onClick={handleComplete}>
            <Text>揭麻完成</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CountdownPage;
