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

  return (
    <View
      className={classnames(styles.card, styles[`status_${record.status}`])}
      onClick={() => onClick?.(record.id)}
    >
      <View className={styles.header}>
        <View className={styles.projectTag}>{record.projectName}</View>
        <View
          className={styles.statusBadge}
          style={{ backgroundColor: `${statusColors[record.status]}15`, color: statusColors[record.status] }}
        >
          {statusLabels[record.status]}
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
      {isActive && (
        <View className={styles.countdownRow}>
          <Text className={styles.countdownLabel}>剩余时间</Text>
          <Text
            className={classnames(styles.countdownValue, remaining <= 0 && styles.overtime)}
          >
            {remaining <= 0 ? '已超时' : formatCountdown(remaining)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default TaskCard;
