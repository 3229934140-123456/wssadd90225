import React, { useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTaskStore } from '@/store/useTaskStore';
import { computeStats } from '@/utils/timer';
import styles from './index.module.scss';

const PROFILE = {
  name: '张小美',
  avatar: 'https://picsum.photos/id/64/200/200',
  level: '初级护士',
};

const MinePage: React.FC = () => {
  const { records, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  const stats = computeStats(records);

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.profileCard}>
        <Image className={styles.avatar} src={PROFILE.avatar} mode="aspectFill" />
        <View className={styles.profileInfo}>
          <Text className={styles.profileName}>{PROFILE.name}</Text>
          <View className={styles.profileLevel}>
            <Text>{PROFILE.level}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.consecutiveNoOvertimeDays}</Text>
          <Text className={styles.statLabel}>连续无超时天数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.standardRecordCount}</Text>
          <Text className={styles.statLabel}>规范记录次数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.anomalyReportCount}</Text>
          <Text className={styles.statLabel}>异常上报次数</Text>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.totalTasks}</Text>
          <Text className={styles.statLabel}>总任务数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.completedTasks}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#EF4444' }}>{stats.overtimeTasks}</Text>
          <Text className={styles.statLabel}>超时次数</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>快捷入口</Text>
      <View className={styles.menuCard}>
        <View className={styles.menuItem} onClick={() => Taro.navigateTo({ url: '/pages/growth/index' })}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>🏆</Text>
            <Text className={styles.menuText}>成长榜</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>�</Text>
            <Text className={styles.menuText}>全部任务</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.switchTab({ url: '/pages/tips/index' })}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>📚</Text>
            <Text className={styles.menuText}>知识库</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.navigateTo({ url: '/pages/mentor/index' })}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>👩‍🏫</Text>
            <Text className={styles.menuText}>带教看板</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
