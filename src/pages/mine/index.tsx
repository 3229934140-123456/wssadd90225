import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockUserProfile } from '@/data/tasks';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const profile = mockUserProfile;

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.profileCard}>
        <Image className={styles.avatar} src={profile.avatar} mode="aspectFill" />
        <View className={styles.profileInfo}>
          <Text className={styles.profileName}>{profile.name}</Text>
          <View className={styles.profileLevel}>
            <Text>{profile.level}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{profile.consecutiveNoOvertimeDays}</Text>
          <Text className={styles.statLabel}>连续无超时天数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{profile.standardRecordCount}</Text>
          <Text className={styles.statLabel}>规范记录次数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{profile.anomalyReportCount}</Text>
          <Text className={styles.statLabel}>异常上报次数</Text>
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
        <View className={styles.menuItem} onClick={() => Taro.navigateTo({ url: '/pages/growth/index' })}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>📊</Text>
            <Text className={styles.menuText}>操作统计</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.navigateTo({ url: '/pages/growth/index' })}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>📝</Text>
            <Text className={styles.menuText}>历史记录</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem}>
          <View className={styles.menuItemLeft}>
            <Text className={styles.menuIcon}>⚙️</Text>
            <Text className={styles.menuText}>设置</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
