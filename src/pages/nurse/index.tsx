import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Image, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/useTaskStore';
import {
  StatsTimeRange,
  computeStatsInRangeForNurse,
  isAbnormalRecord,
  getEffectiveStatus,
  getAnomalyTypes,
  filterRecordsByRange,
} from '@/utils/timer';
import { ANOMALY_TYPE_LABELS, FollowUpStatus } from '@/types';
import { reviewRatingLabels } from '@/data/tasks';
import { getNurseAvatar, getNurseName, getNurseLevel } from '@/data/nurses';
import styles from './nurse.module.scss';

const RANGE_TABS: { key: StatsTimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'all', label: '全部' },
];

const FOLLOWUP_OPTIONS: { key: FollowUpStatus; label: string; color: string }[] = [
  { key: 'pending', label: '待复查', color: '#F59E0B' },
  { key: 'followed_up', label: '已跟进', color: '#10B981' },
  { key: 'needs_on_site', label: '需现场带教', color: '#EF4444' },
];

const NursePage: React.FC = () => {
  const [range, setRange] = useState<StatsTimeRange>('week');
  const [nurseId, setNurseId] = useState('self');
  const [nurseName, setNurseName] = useState('张小美');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | ''>('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const { records, reviews, hydrate, hydrated, updateFollowUp } = useTaskStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, []);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) setNurseId(params.id);
    if (params?.id) {
      const name = getNurseName(params.id);
      if (name) setNurseName(name);
    }
  }, []);

  const nurseProfile = useMemo(() => ({
    name: getNurseName(nurseId),
    avatar: getNurseAvatar(nurseId),
    level: getNurseLevel(nurseId),
  }), [nurseId]);

  const stats = useMemo(
    () => computeStatsInRangeForNurse(records, reviews, range, nurseId),
    [records, reviews, range, nurseId]
  );

  const filteredRecords = useMemo(
    () => filterRecordsByRange(records, range)
      .filter((r) => r.nurseId === nurseId)
      .sort((a, b) => b.startTime - a.startTime),
    [records, range, nurseId]
  );

  const handleFollowUp = (recordId: string) => {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    setEditingRecordId(recordId);
    setFollowUpStatus(record.followUp?.status || '');
    setFollowUpNote(record.followUp?.note || '');
  };

  const handleSaveFollowUp = () => {
    if (!editingRecordId || !followUpStatus) {
      Taro.showToast({ title: '请选择跟进状态', icon: 'none' });
      return;
    }
    updateFollowUp(editingRecordId, {
      status: followUpStatus as FollowUpStatus,
      note: followUpNote,
      mentorName: '王老师',
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    });
    setEditingRecordId(null);
    setFollowUpStatus('');
    setFollowUpNote('');
    Taro.showToast({ title: '跟进已保存', icon: 'success' });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.profileCard}>
        <Image className={styles.avatar} src={nurseProfile.avatar} mode="aspectFill" />
        <View className={styles.profileInfo}>
          <Text className={styles.profileName}>{nurseProfile.name}</Text>
          <Text className={styles.profileLevel}>{nurseProfile.level}</Text>
        </View>
      </View>

      <View className={styles.rangeTabs}>
        {RANGE_TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.rangeTab, range === tab.key && styles.rangeTabActive)}
            onClick={() => setRange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.totalTasks}</Text>
          <Text className={styles.statLabel}>总任务</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.completedTasks}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#EF4444' }}>{stats.overtimeTasks}</Text>
          <Text className={styles.statLabel}>超时</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#F97316' }}>{stats.abnormalTasks}</Text>
          <Text className={styles.statLabel}>异常</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.standardRecordCount}</Text>
          <Text className={styles.statLabel}>规范记录</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#8B5CF6' }}>{stats.coverage}%</Text>
          <Text className={styles.statLabel}>点评覆盖</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>带教跟进</Text>
      <View className={styles.followUpSummary}>
        <View className={styles.followUpSummaryItem}>
          <Text className={styles.followUpSummaryValue} style={{ color: '#F59E0B' }}>
            {filteredRecords.filter((r) => r.followUp?.status === 'pending').length}
          </Text>
          <Text className={styles.followUpSummaryLabel}>待复查</Text>
        </View>
        <View className={styles.followUpSummaryItem}>
          <Text className={styles.followUpSummaryValue} style={{ color: '#10B981' }}>
            {filteredRecords.filter((r) => r.followUp?.status === 'followed_up').length}
          </Text>
          <Text className={styles.followUpSummaryLabel}>已跟进</Text>
        </View>
        <View className={styles.followUpSummaryItem}>
          <Text className={styles.followUpSummaryValue} style={{ color: '#EF4444' }}>
            {filteredRecords.filter((r) => r.followUp?.status === 'needs_on_site').length}
          </Text>
          <Text className={styles.followUpSummaryLabel}>需现场带教</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>复盘记录</Text>
      <View className={styles.recordList}>
        {filteredRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无记录</Text>
          </View>
        ) : (
          filteredRecords.map((r) => {
            const effectiveStatus = getEffectiveStatus(r);
            const recordReviews = reviews.filter((rv) => rv.recordId === r.id);
            const abnormal = isAbnormalRecord(r);
            const isEditing = editingRecordId === r.id;

            return (
              <View
                key={r.id}
                className={classnames(styles.recordCard, abnormal && styles.recordCardAbnormal)}
              >
                <View
                  className={styles.recordClickArea}
                  onClick={() => Taro.navigateTo({ url: `/pages/review/index?id=${r.id}` })}
                >
                  <View className={styles.recordHead}>
                    <View>
                      <Text className={styles.recordTitle}>{r.projectName} - {r.part}</Text>
                      <Text className={styles.recordTime}>{dayjs(r.startTime).format('YYYY-MM-DD HH:mm')}</Text>
                    </View>
                    <View
                      className={classnames(
                        styles.statusBadge,
                        effectiveStatus === 'completed' && styles.statusBadgeGreen,
                        effectiveStatus === 'overtime' && styles.statusBadgeRed,
                        effectiveStatus === 'time_up' && styles.statusBadgeOrange,
                      )}
                    >
                      <Text>
                        {{ counting: '进行中', warning_10min: '即将到点', time_up: '该揭麻了', overtime: '已超时', completed: '已完成', pending: '待处理' }[effectiveStatus]}
                      </Text>
                    </View>
                  </View>

                  {abnormal && (
                    <View className={styles.recordTags}>
                      {getAnomalyTypes(r).map((type) => (
                        <View
                          key={type}
                          className={classnames(
                            (type === 'overtime' || type === 'severe_redness' || type === 'strong_reaction')
                              ? styles.tagRed : styles.tagOrange
                          )}
                        >
                          <Text>{ANOMALY_TYPE_LABELS[type]}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {recordReviews.length > 0 && (
                    <View className={styles.reviewPreview}>
                      <Text className={styles.reviewPreviewTitle}>
                        老师点评（{recordReviews.length}次）
                      </Text>
                      {recordReviews.slice(0, 2).map((rv) => (
                        <View key={rv.id} className={styles.reviewPreviewItem}>
                          <View className={styles.reviewPreviewHead}>
                            <Text className={styles.reviewPreviewName}>{rv.mentorName}</Text>
                            <Text className={styles.reviewPreviewTime}>{rv.createdAt}</Text>
                          </View>
                          {rv.ratings.length > 0 && (
                            <View className={styles.ratingTags}>
                              {rv.ratings.slice(0, 3).map((rating) => (
                                <View key={rating} className={styles.ratingTag}><Text>{reviewRatingLabels[rating]}</Text></View>
                              ))}
                            </View>
                          )}
                          {rv.comment && <Text className={styles.reviewPreviewComment}>{rv.comment}</Text>}
                        </View>
                      ))}
                    </View>
                  )}

                  {r.followUp && (
                    <View className={styles.followUpCard}>
                      <View className={styles.followUpHead}>
                        <Text
                          className={styles.followUpStatus}
                          style={{
                            color: r.followUp.status === 'pending' ? '#F59E0B'
                              : r.followUp.status === 'followed_up' ? '#10B981'
                              : '#EF4444',
                          }}
                        >
                          {{ pending: '待复查', followed_up: '已跟进', needs_on_site: '需现场带教' }[r.followUp.status]}
                        </Text>
                        <Text className={styles.followUpMeta}>
                          {r.followUp.mentorName} · {r.followUp.updatedAt}
                        </Text>
                      </View>
                      {r.followUp.note && (
                        <Text className={styles.followUpNote}>{r.followUp.note}</Text>
                      )}
                    </View>
                  )}
                </View>

                <View
                  className={styles.followUpBtn}
                  onClick={() => handleFollowUp(r.id)}
                >
                  <Text>{r.followUp ? '更新跟进' : '标记跟进'}</Text>
                </View>

                {isEditing && (
                  <View className={styles.followUpEditor}>
                    <Text className={styles.formLabel}>跟进状态</Text>
                    <View className={styles.optionRow}>
                      {FOLLOWUP_OPTIONS.map((opt) => (
                        <View
                          key={opt.key}
                          className={classnames(styles.optionTag, followUpStatus === opt.key && styles.optionTagActive)}
                          style={{
                            borderColor: followUpStatus === opt.key ? opt.color : undefined,
                            color: followUpStatus === opt.key ? opt.color : undefined,
                            background: followUpStatus === opt.key ? `${opt.color}10` : undefined,
                          }}
                          onClick={() => setFollowUpStatus(opt.key)}
                        >
                          <Text>{opt.label}</Text>
                        </View>
                      ))}
                    </View>
                    <Text className={styles.formLabel}>跟进备注</Text>
                    <Textarea
                      className={styles.textArea}
                      placeholder="填写跟进建议或带教要点..."
                      value={followUpNote}
                      onInput={(e) => setFollowUpNote(e.detail.value)}
                    />
                    <View className={styles.editorActions}>
                      <View className={styles.cancelBtn} onClick={() => setEditingRecordId(null)}>
                        <Text>取消</Text>
                      </View>
                      <View className={styles.saveBtn} onClick={handleSaveFollowUp}>
                        <Text>保存</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default NursePage;
