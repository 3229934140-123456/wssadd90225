import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useTaskStore } from '@/store/useTaskStore';
import { mockReviews, rednessLabels, reviewRatingLabels } from '@/data/tasks';
import type { AnesthesiaRecord } from '@/types';
import styles from './index.module.scss';

const feelingOptions = ['无痛感', '轻微刺痛', '明显刺痛', '灼热感', '不适感强'];
const rednessOptions = Object.entries(rednessLabels);

const ReviewPage: React.FC = () => {
  const [record, setRecord] = useState<AnesthesiaRecord | null>(null);
  const [feeling, setFeeling] = useState('');
  const [redness, setRedness] = useState('');
  const [extended, setExtended] = useState(false);
  const [comment, setComment] = useState('');
  const { records, updateRecordReview } = useTaskStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const found = records.find((r) => r.id === params.id);
      if (found) {
        setRecord(found);
        if (found.customerFeeling) setFeeling(found.customerFeeling);
        if (found.rednessLevel) setRedness(found.rednessLevel);
        if (found.extended !== undefined) setExtended(found.extended);
        console.info('[Review] Record loaded:', found.id);
      }
    }
  }, [records]);

  const existingReview = record ? mockReviews.find((r) => r.recordId === record.id) : null;

  const handleSubmit = () => {
    if (!record) return;
    if (!feeling || !redness) {
      Taro.showToast({ title: '请填写顾客感受和红斑情况', icon: 'none' });
      return;
    }

    updateRecordReview(record.id, {
      customerFeeling: feeling,
      rednessLevel: redness as any,
      extended,
      status: 'completed',
    });

    console.info('[Review] Review submitted for:', record.id);
    Taro.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  if (!record) {
    return (
      <View className={styles.container}>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <Text style={{ color: '#86909C', fontSize: '28rpx' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.recordInfo}>
        <Text className={styles.recordTitle}>{record.projectName} - {record.part}</Text>
        <View className={styles.recordRow}>
          <Text className={styles.recordLabel}>麻药</Text>
          <Text className={styles.recordValue}>{record.drugType}</Text>
        </View>
        <View className={styles.recordRow}>
          <Text className={styles.recordLabel}>时长</Text>
          <Text className={styles.recordValue}>{record.duration}分钟</Text>
        </View>
        <View className={styles.recordRow}>
          <Text className={styles.recordLabel}>皮肤</Text>
          <Text className={styles.recordValue}>
            {{ normal: '正常', sensitive: '敏感', damaged: '受损', inflamed: '炎症' }[record.skinCondition]}
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>揭麻记录</Text>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>顾客感受</Text>
            <View className={styles.optionRow}>
              {feelingOptions.map((opt) => (
                <View
                  key={opt}
                  className={classnames(styles.optionTag, feeling === opt && styles.optionTagActive)}
                  onClick={() => setFeeling(opt)}
                >
                  <Text>{opt}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>红斑情况</Text>
            <View className={styles.optionRow}>
              {rednessOptions.map(([key, label]) => (
                <View
                  key={key}
                  className={classnames(styles.optionTag, redness === key && styles.optionTagActive)}
                  onClick={() => setRedness(key)}
                >
                  <Text>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>是否加时</Text>
            <View className={styles.extendedRow}>
              <View
                className={classnames(styles.switchBtn, extended && styles.switchBtnActive)}
                onClick={() => setExtended(!extended)}
              >
                <View className={classnames(styles.switchDot, extended && styles.switchDotActive)} />
              </View>
              <Text className={styles.switchLabel}>{extended ? '已加时' : '未加时'}</Text>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注</Text>
            <Textarea
              className={styles.textArea}
              placeholder="填写揭麻后的其他观察..."
              value={comment}
              onInput={(e) => setComment(e.detail.value)}
            />
          </View>
        </View>
      </View>

      {existingReview && (
        <View className={styles.reviewSection}>
          <Text className={styles.sectionTitle}>师傅点评</Text>
          <View className={styles.reviewCard}>
            <View className={styles.reviewHeader}>
              <Text className={styles.mentorName}>{existingReview.mentorName}</Text>
              <Text className={styles.reviewTime}>{existingReview.createdAt}</Text>
            </View>
            <View className={styles.ratingTags}>
              {existingReview.ratings.map((rating) => (
                <View key={rating} className={styles.ratingTag}>
                  <Text>{reviewRatingLabels[rating]}</Text>
                </View>
              ))}
            </View>
            <Text className={styles.reviewComment}>{existingReview.comment}</Text>
          </View>
        </View>
      )}

      {!existingReview && (
        <View className={styles.bottomBar}>
          <View className={styles.submitBtn} onClick={handleSubmit}>
            <Text>提交记录</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReviewPage;
