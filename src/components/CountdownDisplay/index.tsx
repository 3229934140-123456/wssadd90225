import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { formatCountdown, getRemainingTime } from '@/utils/timer';
import type { AnesthesiaRecord } from '@/types';
import styles from './index.module.scss';

interface CountdownDisplayProps {
  record: AnesthesiaRecord;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ record }) => {
  const remaining = getRemainingTime(record.startTime, record.duration);
  const totalMs = record.duration * 60 * 1000;
  const progress = Math.max(0, Math.min(100, ((totalMs - remaining) / totalMs) * 100));
  const isOvertime = remaining <= 0;
  const isWarning = remaining > 0 && remaining <= 10 * 60 * 1000;

  return (
    <View className={classnames(styles.container, isOvertime && styles.overtime, isWarning && styles.warning)}>
      <View className={styles.ringWrapper}>
        <View className={styles.ringBg}>
          <View className={styles.ringProgress} style={{ height: `${progress}%` }} />
        </View>
        <View className={styles.ringContent}>
          <Text className={styles.countdownText}>
            {isOvertime ? '已超时' : formatCountdown(remaining)}
          </Text>
          <Text className={styles.countdownLabel}>
            {isOvertime ? '请立即处理' : '剩余时间'}
          </Text>
        </View>
      </View>
      <View className={styles.infoSection}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>项目</Text>
          <Text className={styles.infoValue}>{record.projectName}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>部位</Text>
          <Text className={styles.infoValue}>{record.part}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>麻药</Text>
          <Text className={styles.infoValue}>{record.drugType}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>时长</Text>
          <Text className={styles.infoValue}>{record.duration}分钟</Text>
        </View>
      </View>
    </View>
  );
};

export default CountdownDisplay;
