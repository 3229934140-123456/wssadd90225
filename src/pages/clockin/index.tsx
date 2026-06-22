import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { projects, skinConditionLabels } from '@/data/projects';
import { useTaskStore } from '@/store/useTaskStore';
import { generateId } from '@/utils/timer';
import type { SkinCondition, AnesthesiaRecord } from '@/types';
import styles from './index.module.scss';

const ClockinPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedSkin, setSelectedSkin] = useState<SkinCondition | ''>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [duration, setDuration] = useState(30);
  const { addRecord } = useTaskStore();

  const currentProject = projects.find((p) => p.id === selectedProject);

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setPhotoUrl(res.tempFilePaths[0]);
        console.info('[Clockin] Photo selected:', res.tempFilePaths[0]);
      },
      fail: (err) => {
        console.error('[Clockin] Photo selection failed:', err);
      },
    });
  };

  const handleSubmit = () => {
    if (!selectedProject || !selectedPart || !selectedDrug || !selectedSkin || !photoUrl) {
      Taro.showToast({ title: '请完善所有信息', icon: 'none' });
      return;
    }

    const record: AnesthesiaRecord = {
      id: generateId(),
      projectId: selectedProject,
      projectName: currentProject?.name || '',
      part: selectedPart,
      drugType: selectedDrug,
      skinCondition: selectedSkin as SkinCondition,
      photoUrl,
      startTime: Date.now(),
      duration,
      status: 'counting',
    };

    addRecord(record);
    console.info('[Clockin] Record created:', record.id);

    Taro.showToast({ title: '打卡成功', icon: 'success' });

    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/countdown/index?id=${record.id}` });
    }, 500);
  };

  const isFormComplete = selectedProject && selectedPart && selectedDrug && selectedSkin && photoUrl;

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择项目</Text>
        <View className={styles.optionGrid}>
          {projects.map((p) => (
            <View
              key={p.id}
              className={classnames(styles.optionItem, selectedProject === p.id && styles.optionItemActive)}
              onClick={() => {
                setSelectedProject(p.id);
                setSelectedPart('');
                setSelectedDrug('');
                setDuration(p.defaultDuration);
              }}
            >
              <Text>{p.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {currentProject && (
        <>
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>选择部位</Text>
            <View className={styles.optionGrid}>
              {currentProject.parts.map((part) => (
                <View
                  key={part}
                  className={classnames(styles.optionItem, selectedPart === part && styles.optionItemActive)}
                  onClick={() => setSelectedPart(part)}
                >
                  <Text>{part}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>麻药类型</Text>
            <View className={styles.optionGrid}>
              {currentProject.drugTypes.map((drug) => (
                <View
                  key={drug}
                  className={classnames(styles.optionItem, selectedDrug === drug && styles.optionItemActive)}
                  onClick={() => setSelectedDrug(drug)}
                >
                  <Text>{drug}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>皮肤状态</Text>
        <View className={styles.optionGrid}>
          {Object.entries(skinConditionLabels).map(([key, label]) => (
            <View
              key={key}
              className={classnames(styles.optionItem, selectedSkin === key && styles.optionItemActive)}
              onClick={() => setSelectedSkin(key as SkinCondition)}
            >
              <Text>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>敷贴确认图</Text>
        <View className={styles.photoSection}>
          {photoUrl ? (
            <View className={styles.photoPreview}>
              <Image className={styles.photoPreviewImg} src={photoUrl} mode="aspectFill" />
              <View className={styles.photoRetake} onClick={handleChooseImage}>
                <Text>重新拍照</Text>
              </View>
            </View>
          ) : (
            <View className={styles.photoArea} onClick={handleChooseImage}>
              <Text className={styles.photoIcon}>📷</Text>
              <Text className={styles.photoHint}>拍照上传局部敷贴确认图</Text>
              <Text className={styles.photoHint}>（不含面部隐私）</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>敷麻时长</Text>
        <View className={styles.durationSection}>
          <View className={styles.durationRow}>
            <View className={styles.durationAdjust}>
              <View className={styles.durationBtn} onClick={() => setDuration(Math.max(5, duration - 5))}>
                <Text>-</Text>
              </View>
              <Text className={styles.durationValue}>{duration}<Text className={styles.durationUnit}>分钟</Text></Text>
              <View className={styles.durationBtn} onClick={() => setDuration(Math.min(120, duration + 5))}>
                <Text>+</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.submitBar}>
        <View
          className={classnames(styles.submitBtn, !isFormComplete && styles.submitBtnDisabled)}
          onClick={handleSubmit}
        >
          <Text>确认打卡</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ClockinPage;
