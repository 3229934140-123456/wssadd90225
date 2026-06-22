import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import CountdownDisplay from '@/components/CountdownDisplay';
import { useTaskStore } from '@/store/useTaskStore';
import { getRemainingTime } from '@/utils/timer';
import { knowledgeTips } from '@/data/knowledge';
import type { AnesthesiaRecord } from '@/types';
import styles from './index.module.scss';

const CountdownPage: React.FC = () => {
  const [record, setRecord] = useState<AnesthesiaRecord | null>(null);
  const [, setTick] = useState(0);
  const { records, updateRecordStatus } = useTaskStore();

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
      if (record) {
        const remaining = getRemainingTime(record.startTime, record.duration);
        const tenMinMs = 10 * 60 * 1000;
        if (remaining <= 0 && record.status !== 'overtime' && record.status !== 'completed') {
          updateRecordStatus(record.id, 'overtime');
          Taro.showToast({ title: '敷麻已超时！请立即处理', icon: 'none', duration: 3000 });
          console.warn('[Countdown] Overtime detected:', record.id);
        } else if (remaining > 0 && remaining <= tenMinMs && record.status === 'counting') {
          updateRecordStatus(record.id, 'warning_10min');
          Taro.showToast({ title: '即将到点，请准备揭麻', icon: 'none' });
          console.info('[Countdown] 10-minute warning:', record.id);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [record]);

  if (!record) {
    return (
      <View className={styles.container}>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <Text style={{ color: '#86909C', fontSize: '28rpx' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  const remaining = getRemainingTime(record.startTime, record.duration);
  const tenMinMs = 10 * 60 * 1000;

  const relatedTips = knowledgeTips.filter((t) => t.projectId === record.projectId).slice(0, 2);

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
        <View className={styles.reminderCard}>
          <Text className={styles.reminderIcon}>⏰</Text>
          <View className={styles.reminderContent}>
            <Text className={styles.reminderTitle}>10分钟预警</Text>
            <Text className={styles.reminderDesc}>距到点10分钟时提醒</Text>
          </View>
          <View className={`${styles.reminderStatus} ${remaining <= tenMinMs + 60000 && remaining > 0 ? styles.statusDone : remaining <= tenMinMs ? styles.statusActive : styles.statusPending}`}>
            <Text>{remaining <= tenMinMs && remaining > 0 ? '已触发' : remaining <= 0 ? '已过' : '等待中'}</Text>
          </View>
        </View>

        <View className={styles.reminderCard}>
          <Text className={styles.reminderIcon}>🔔</Text>
          <View className={styles.reminderContent}>
            <Text className={styles.reminderTitle}>到点提醒</Text>
            <Text className={styles.reminderDesc}>敷麻时间到达时提醒</Text>
          </View>
          <View className={`${styles.reminderStatus} ${remaining <= 0 ? styles.statusWarning : styles.statusPending}`}>
            <Text>{remaining <= 0 ? '已超时' : '等待中'}</Text>
          </View>
        </View>

        <View className={styles.reminderCard}>
          <Text className={styles.reminderIcon}>🚨</Text>
          <View className={styles.reminderContent}>
            <Text className={styles.reminderTitle}>超时警告</Text>
            <Text className={styles.reminderDesc}>超时后持续警告</Text>
          </View>
          <View className={`${styles.reminderStatus} ${remaining <= 0 ? styles.statusWarning : styles.statusPending}`}>
            <Text>{remaining <= 0 ? '超时中' : '等待中'}</Text>
          </View>
        </View>
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

      <View className={styles.bottomBar}>
        <View className={styles.completeBtn} onClick={handleComplete}>
          <Text>揭麻完成</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default CountdownPage;
