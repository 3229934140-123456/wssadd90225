import React from 'react';
import { View, Text } from '@tarojs/components';
import type { KnowledgeTip } from '@/types';
import styles from './index.module.scss';

interface KnowledgeTipCardProps {
  tip: KnowledgeTip;
}

const KnowledgeTipCard: React.FC<KnowledgeTipCardProps> = ({ tip }) => {
  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.icon}>{tip.icon}</Text>
        <View className={styles.categoryTag}>{tip.category}</View>
      </View>
      <Text className={styles.title}>{tip.title}</Text>
      <Text className={styles.content}>{tip.content}</Text>
    </View>
  );
};

export default KnowledgeTipCard;
