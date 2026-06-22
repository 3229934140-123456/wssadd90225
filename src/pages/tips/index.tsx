import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import classnames from 'classnames';
import KnowledgeTipCard from '@/components/KnowledgeTipCard';
import { knowledgeTips } from '@/data/knowledge';
import styles from './index.module.scss';

const categories = [
  { key: 'all', label: '全部' },
  { key: 'laser', label: '光电项目' },
  { key: 'lips', label: '唇部项目' },
  { key: 'eyebrow', label: '眉部项目' },
  { key: 'injectable', label: '注射项目' },
  { key: 'skin', label: '皮肤管理' },
  { key: 'hair', label: '脱毛项目' },
  { key: 'microneedle', label: '微针项目' },
  { key: 'thread', label: '线雕项目' },
];

const TipsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filteredTips = useMemo(() => {
    let tips = knowledgeTips;
    if (activeCategory !== 'all') {
      tips = tips.filter((t) => t.projectId === activeCategory);
    }
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      tips = tips.filter(
        (t) =>
          t.title.toLowerCase().includes(keyword) ||
          t.content.toLowerCase().includes(keyword)
      );
    }
    return tips;
  }, [activeCategory, searchText]);

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索注意事项..."
          placeholderClass={styles.searchPlaceholder}
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.categoryScroll}>
        <View className={styles.categoryRow}>
          {categories.map((cat) => (
            <View
              key={cat.key}
              className={classnames(styles.categoryItem, activeCategory === cat.key && styles.categoryItemActive)}
              onClick={() => setActiveCategory(cat.key)}
            >
              <Text>{cat.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className={styles.tipList}>
        {filteredTips.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📚</Text>
            <Text className={styles.emptyText}>暂无相关知识提示</Text>
          </View>
        ) : (
          filteredTips.map((tip) => <KnowledgeTipCard key={tip.id} tip={tip} />)
        )}
      </View>
    </ScrollView>
  );
};

export default TipsPage;
