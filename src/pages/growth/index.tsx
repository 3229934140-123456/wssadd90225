import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { mockGrowthRank, mockUserProfile } from '@/data/tasks';
import styles from './index.module.scss';

const GrowthPage: React.FC = () => {
  const profile = mockUserProfile;
  const myRank = mockGrowthRank.find((r) => r.id === 'rank_4');
  const rankIndex = mockGrowthRank.findIndex((r) => r.id === 'rank_4');

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.myRankCard}>
        <View className={styles.myRankHeader}>
          <Image className={styles.myRankAvatar} src={profile.avatar} mode="aspectFill" />
          <View className={styles.myRankInfo}>
            <Text className={styles.myRankName}>{profile.name}</Text>
            <Text className={styles.myRankLevel}>{profile.level}</Text>
          </View>
          <View className={styles.myRankScore}>
            <Text className={styles.scoreValue}>{myRank?.score || 0}</Text>
            <Text className={styles.scoreLabel}>综合评分</Text>
          </View>
        </View>
        <View className={styles.myStatsRow}>
          <View className={styles.myStatItem}>
            <Text className={styles.myStatValue}>{profile.consecutiveNoOvertimeDays}天</Text>
            <Text className={styles.myStatLabel}>连续无超时</Text>
          </View>
          <View className={styles.myStatItem}>
            <Text className={styles.myStatValue}>{profile.standardRecordCount}次</Text>
            <Text className={styles.myStatLabel}>规范记录</Text>
          </View>
          <View className={styles.myStatItem}>
            <Text className={styles.myStatValue}>{profile.anomalyReportCount}次</Text>
            <Text className={styles.myStatLabel}>异常上报</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>排行榜</Text>
      <View className={styles.rankList}>
        {mockGrowthRank.map((item, index) => (
          <View
            key={item.id}
            className={classnames(
              styles.rankItem,
              index < 3 && styles.rankItemTop,
              item.id === 'rank_4' && styles.rankItemSelf
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
              <Text className={styles.rankName}>{item.name}</Text>
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
