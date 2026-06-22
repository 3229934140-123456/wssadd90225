import React, { useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useTaskStore } from '@/store/useTaskStore';
import { computeStats } from '@/utils/timer';
import { mockGrowthRank } from '@/data/tasks';
import styles from './index.module.scss';

const PROFILE = {
  id: 'self',
  name: '张小美',
  avatar: 'https://picsum.photos/id/64/200/200',
  level: '初级护士',
};

const GrowthPage: React.FC = () => {
  const { records, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  const myStats = computeStats(records);
  const myScore = myStats.standardRecordCount * 2 + myStats.consecutiveNoOvertimeDays * 3 - myStats.anomalyReportCount;

  const allRankItems = [
    ...mockGrowthRank.filter((r) => r.id !== 'rank_4'),
    {
      id: 'self',
      name: PROFILE.name,
      avatar: PROFILE.avatar,
      consecutiveNoOvertimeDays: myStats.consecutiveNoOvertimeDays,
      standardRecordCount: myStats.standardRecordCount,
      anomalyReportCount: myStats.anomalyReportCount,
      score: Math.max(0, myScore),
    },
  ].sort((a, b) => b.score - a.score);

  const myRankIndex = allRankItems.findIndex((r) => r.id === 'self');

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.myRankCard}>
        <View className={styles.myRankHeader}>
          <Image className={styles.myRankAvatar} src={PROFILE.avatar} mode="aspectFill" />
          <View className={styles.myRankInfo}>
            <Text className={styles.myRankName}>{PROFILE.name}</Text>
            <Text className={styles.myRankLevel}>{PROFILE.level}</Text>
          </View>
          <View className={styles.myRankScore}>
            <Text className={styles.scoreValue}>{Math.max(0, myScore)}</Text>
            <Text className={styles.scoreLabel}>综合评分</Text>
          </View>
        </View>
        <View className={styles.myStatsRow}>
          <View className={styles.myStatItem}>
            <Text className={styles.myStatValue}>{myStats.consecutiveNoOvertimeDays}天</Text>
            <Text className={styles.myStatLabel}>连续无超时</Text>
          </View>
          <View className={styles.myStatItem}>
            <Text className={styles.myStatValue}>{myStats.standardRecordCount}次</Text>
            <Text className={styles.myStatLabel}>规范记录</Text>
          </View>
          <View className={styles.myStatItem}>
            <Text className={styles.myStatValue}>{myStats.anomalyReportCount}次</Text>
            <Text className={styles.myStatLabel}>异常上报</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>排行榜</Text>
      <View className={styles.rankList}>
        {allRankItems.map((item, index) => (
          <View
            key={item.id}
            className={classnames(
              styles.rankItem,
              index < 3 && styles.rankItemTop,
              item.id === 'self' && styles.rankItemSelf
            )}
          >
            <View
              className={classnames(
                styles.rankNumber,
                index === 0 && styles.rankNumber1,
                index === 1 && styles.rankNumber2,
                index === 2 && styles.rankNumber3
              )}
            >
              <Text>{index + 1}</Text>
            </View>
            <Image className={styles.rankAvatar} src={item.avatar} mode="aspectFill" />
            <View className={styles.rankInfo}>
              <Text className={styles.rankName}>{item.name}{item.id === 'self' ? '（我）' : ''}</Text>
              <Text className={styles.rankStats}>
                无超时{item.consecutiveNoOvertimeDays}天 · 规范{item.standardRecordCount}次
              </Text>
            </View>
            <Text className={styles.rankScore}>
              {item.score}<Text className={styles.rankScoreUnit}>分</Text>
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default GrowthPage;
