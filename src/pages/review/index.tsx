import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import { rednessLabels, reviewRatingLabels } from '@/data/tasks';
import {
  getTimelineLabel,
  getTimelineIcon,
  ensureTimeline,
  getEffectiveStatus,
  TIMELINE_PROCESS_STATUS_LABELS,
  TIMELINE_PROCESS_STATUS_COLORS,
} from '@/utils/timer';
import { generateId } from '@/utils/timer';
import type { AnesthesiaRecord, ReviewRating, Review, TimelineProcessStatus } from '@/types';
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
  const { records, reviews, updateRecordReview, addReview, addTimelineEvent, hydrate, hydrated } = useTaskStore();

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
      }
    }
  }, [records, hydrated]);

  const recordReviews = record ? reviews.filter((r) => r.recordId === record.id) : [];

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

    const wasCompleted = record.status === 'completed';
    updateRecordReview(record.id, {
      customerFeeling: feeling,
      rednessLevel: redness as AnesthesiaRecord['rednessLevel'],
      extended,
      comment,
      status: 'completed',
    });

    if (!wasCompleted) {
      addTimelineEvent(record.id, { type: 'completed', timestamp: Date.now() });
    }

    Taro.showToast({ title: '记录已保存', icon: 'success' });
  };

  const handleSubmitReview = () => {
    if (!record) return;
    if (selectedRatings.length === 0 && !mentorComment.trim()) {
      Taro.showToast({ title: '请选择评价标签或填写评语', icon: 'none' });
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
    if (recordReviews.length === 0) {
      addTimelineEvent(record.id, { type: 'reviewed', timestamp: Date.now() });
    }
    setSelectedRatings([]);
    setMentorComment('');
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
  const effectiveStatus = getEffectiveStatus(record);
  const timeline = ensureTimeline(record);

  const getStatusColor = (s: TimelineProcessStatus) => TIMELINE_PROCESS_STATUS_COLORS[s];
  const getStatusText = (s: TimelineProcessStatus) => TIMELINE_PROCESS_STATUS_LABELS[s];

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
        <View className={styles.recordRow}>
          <Text className={styles.recordLabel}>状态</Text>
          <Text className={styles.recordValue} style={{
            color: effectiveStatus === 'overtime' ? '#EF4444'
              : effectiveStatus === 'time_up' ? '#F97316'
              : effectiveStatus === 'completed' ? '#10B981'
              : '#3B82F6'
          }}>
            {{ counting: '倒计时中', warning_10min: '即将到点', time_up: '该揭麻了', overtime: '已超时', completed: '已完成' }[effectiveStatus] || effectiveStatus}
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>复盘时间线</Text>
        <View className={styles.timelineCard}>
          {timeline.length === 0 ? (
            <Text className={styles.timelineEmpty}>暂无时间线记录</Text>
          ) : (
            timeline.map((event, idx) => (
              <View key={`${event.type}_${event.timestamp}`} className={styles.timelineItem}>
                <View className={styles.timelineLeft}>
                  <Text className={styles.timelineIcon}>{getTimelineIcon(event.type)}</Text>
                  {idx < timeline.length - 1 && <View className={styles.timelineLine} />}
                </View>
                <View className={styles.timelineRight}>
                  <View className={styles.timelineHead}>
                    <Text className={styles.timelineLabel}>{getTimelineLabel(event.type)}</Text>
                    {event.processStatus && (
                      <View
                        className={styles.timelineStatusTag}
                        style={{
                          backgroundColor: `${getStatusColor(event.processStatus)}15`,
                          color: getStatusColor(event.processStatus),
                        }}
                      >
                        <Text>{getStatusText(event.processStatus)}</Text>
                      </View>
                    )}
                  </View>
                  <Text className={styles.timelineTime}>{dayjs(event.timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  {event.note && <Text className={styles.timelineNote}>{event.note}</Text>}
                </View>
              </View>
            ))
          )}
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
        <Text className={styles.sectionTitle}>
          师傅点评 {recordReviews.length > 0 && <Text className={styles.sectionSub}>({recordReviews.length}次点评)</Text>}
        </Text>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>评价标签（可多选）</Text>
            <View className={styles.optionRow}>
              {ratingOptions.map(([key, label]) => (
                <View
                  key={key}
                  className={classnames(styles.optionTag, selectedRatings.includes(key) && styles.optionTagActive)}
                  onClick={() => toggleRating(key)}
                >
                  <Text>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>评语 / 补充建议</Text>
            <Textarea
              className={styles.textArea}
              placeholder="写下对这次操作的评价或补充建议..."
              value={mentorComment}
              onInput={(e) => setMentorComment(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.submitBtn} onClick={handleSubmitReview} style={{ marginTop: '24rpx' }}>
          <Text>{recordReviews.length === 0 ? '提交点评' : '追加点评'}</Text>
        </View>

        {recordReviews.length > 0 && (
          <View className={styles.reviewList} style={{ marginTop: '24rpx' }}>
            {[...recordReviews].reverse().map((review, idx) => (
              <View key={review.id} className={styles.reviewCard}>
                <View className={styles.reviewHeader}>
                  <View>
                    <Text className={styles.mentorName}>{review.mentorName}</Text>
                    {recordReviews.length > 1 && (
                      <Text className={styles.reviewRound}>第 {recordReviews.length - idx} 次</Text>
                    )}
                  </View>
                  <Text className={styles.reviewTime}>{review.createdAt}</Text>
                </View>
                {review.ratings.length > 0 && (
                  <View className={styles.ratingTags}>
                    {review.ratings.map((rating) => (
                      <View key={rating} className={styles.ratingTag}>
                        <Text>{reviewRatingLabels[rating]}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {review.comment && (
                  <Text className={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ReviewPage;
