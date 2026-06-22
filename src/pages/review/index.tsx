import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import { rednessLabels, reviewRatingLabels } from '@/data/tasks';
import type { AnesthesiaRecord, ReviewRating, Review } from '@/types';
import { generateId } from '@/utils/timer';
import styles from './index.module.scss';

const feelingOptions = ['无痛感', '轻微刺痛', '明显刺痛', '灼热感', '不适感强'];
const rednessOptions = Object.entries(rednessLabels);
const ratingOptions = Object.entries(reviewRatingLabels) as [ReviewRating, string][];

const ReviewPage: React.FC = () => {
  const [record, setRecord] = useState<AnesthesiaRecord | null>(null);
  const [feeling, setFeeling] = useState('');
  const [redness, setRedness] = useState('');
  const [extended, setExtended] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedRatings, setSelectedRatings] = useState<ReviewRating[]>([]);
  const [mentorComment, setMentorComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { records, reviews, updateRecordReview, addReview, hydrate, hydrated } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const found = records.find((r) => r.id === params.id);
      if (found) {
        setRecord(found);
        if (found.customerFeeling) setFeeling(found.customerFeeling);
        if (found.rednessLevel) setRedness(found.rednessLevel);
        if (found.extended !== undefined) setExtended(found.extended);
        if (found.comment) setComment(found.comment);
        console.info('[Review] Record loaded:', found.id);
      }
    }
  }, [records, hydrated]);

  const existingReview = record ? reviews.find((r) => r.recordId === record.id) : null;

  useEffect(() => {
    if (existingReview) {
      setSelectedRatings(existingReview.ratings);
      setMentorComment(existingReview.comment);
      setSubmitted(true);
    }
  }, [existingReview]);

  const toggleRating = (rating: ReviewRating) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  const handleSubmitRecord = () => {
    if (!record) return;
    if (!feeling || !redness) {
      Taro.showToast({ title: '请填写顾客感受和红斑情况', icon: 'none' });
      return;
    }

    updateRecordReview(record.id, {
      customerFeeling: feeling,
      rednessLevel: redness as AnesthesiaRecord['rednessLevel'],
      extended,
      comment,
      status: 'completed',
    });

    console.info('[Review] Record submitted for:', record.id);
    Taro.showToast({ title: '记录已保存', icon: 'success' });
  };

  const handleSubmitReview = () => {
    if (!record) return;
    if (selectedRatings.length === 0) {
      Taro.showToast({ title: '请至少选择一个评价标签', icon: 'none' });
      return;
    }

    const review: Review = {
      id: generateId(),
      recordId: record.id,
      mentorName: '带教老师',
      ratings: selectedRatings,
      comment: mentorComment,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    };

    addReview(review);
    setSubmitted(true);
    console.info('[Review] Review submitted for:', record.id);
    Taro.showToast({ title: '点评已提交', icon: 'success' });
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

  const isRecordSaved = !!record.customerFeeling && !!record.rednessLevel;

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

        {!isRecordSaved && (
          <View className={styles.submitBtn} onClick={handleSubmitRecord} style={{ marginTop: '24rpx' }}>
            <Text>保存揭麻记录</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>师傅点评</Text>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>评价标签（可多选）</Text>
            <View className={styles.optionRow}>
              {ratingOptions.map(([key, label]) => (
                <View
                  key={key}
                  className={classnames(styles.optionTag, selectedRatings.includes(key) && styles.optionTagActive)}
                  onClick={() => !submitted && toggleRating(key)}
                >
                  <Text>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>点评内容</Text>
            <Textarea
              className={styles.textArea}
              placeholder="写下对这次操作的评价..."
              value={mentorComment}
              onInput={(e) => !submitted && setMentorComment(e.detail.value)}
              disabled={submitted}
            />
          </View>
        </View>

        {!submitted && (
          <View className={styles.submitBtn} onClick={handleSubmitReview} style={{ marginTop: '24rpx' }}>
            <Text>提交点评</Text>
          </View>
        )}

        {submitted && existingReview && (
          <View className={styles.reviewCard} style={{ marginTop: '24rpx' }}>
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
            {existingReview.comment && (
              <Text className={styles.reviewComment}>{existingReview.comment}</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ReviewPage;
