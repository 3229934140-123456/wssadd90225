import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { AnesthesiaRecord } from '@/types';
import { statusLabels, statusColors } from '@/data/projects';
import { formatCountdown, getRemainingTime } from '@/utils/timer';
import styles from './index.module.scss';

interface TaskCardProps {
  record: AnesthesiaRecord;
  onClick?: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ record, onClick }) => {
  const remaining = getRemainingTime(record.startTime, record.duration);
  const isActive = record.status === 'counting' || record.status === 'warning_10min' || record.status === 'time_up';
  const isOvertime = record.status === 'overtime';

  const displayStatus = (() => {
    if (record.status === 'time_up') return '该揭麻了';
    if (record.status === 'overtime') return '已超时';
    return statusLabels[record.status];
  })();

  const displayColor = statusColors[record.status];

  const countdownDisplay = (() => {
    if (record.status === 'time_up') return '该揭麻了';
    if (isOvertime) return '已超时';
    if (remaining <= 0) return '已超时';
    return formatCountdown(remaining);
  })();

  return (
    <View
      className={classnames(styles.card, styles[`status_${record.status}`])}
      onClick={() => onClick?.(record.id)}
    >
      <View className={styles.header}>
        <View className={styles.projectTag}>{record.projectName}</View>
        <View
          className={styles.statusBadge}
          style={{ backgroundColor: `${displayColor}15`, color: displayColor }}
        >
          {displayStatus}
        </View>
      </View>
      <View className={styles.body}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>部位</Text>
          <Text className={styles.infoValue}>{record.part}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>麻药</Text>
          <Text className={styles.infoValue}>{record.drugType}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>皮肤</Text>
          <Text className={styles.infoValue}>
            {{ normal: '正常', sensitive: '敏感', damaged: '受损', inflamed: '炎症' }[record.skinCondition]}
          </Text>
        </View>
      </View>
      {(isActive || isOvertime) && (
        <View className={styles.countdownRow}>
          <Text className={styles.countdownLabel}>
            {record.status === 'time_up' ? '已到点' : isOvertime ? '超时状态' : '剩余时间'}
          </Text>
          <Text
            className={classnames(
              styles.countdownValue,
              (isOvertime || remaining <= 0) && styles.overtime,
              record.status === 'time_up' && styles.timeUp
            )}
          >
            {countdownDisplay}
          </Text>
        </View>
      )}
    </View>
  );
};

export default TaskCard;
