import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storageService } from '../core/services/StorageService';
import { ScoringSettings, DEFAULT_SCORING_SETTINGS } from '../core/types/scoring.types';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const [recordCount, setRecordCount] = useState(0);
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(DEFAULT_SCORING_SETTINGS);

  useEffect(() => {
    loadRecordCount();
    loadScoringSettings();
  }, []);

  const loadRecordCount = async () => {
    const count = await storageService.getRecordCount();
    setRecordCount(count);
  };

  const loadScoringSettings = async () => {
    const settings = await storageService.getScoringSettings();
    setScoringSettings(settings);
  };

  const handleResetLearning = () => {
    Alert.alert(
      '学習データをリセット',
      '学習した履歴をすべて削除し、初期状態に戻します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.resetLearningData();
              await loadRecordCount();
              Alert.alert('完了', '学習データをリセットしました');
            } catch (error) {
              Alert.alert('エラー', '学習データのリセットに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handlePriceLevelChange = async (priceLevel: 'INEXPENSIVE' | 'MODERATE' | 'EXPENSIVE' | 'ANY') => {
    const newSettings = { ...scoringSettings, preferredPriceLevel: priceLevel };
    setScoringSettings(newSettings);
    await storageService.saveScoringSettings(newSettings);
  };

  const handleResetScoring = async () => {
    Alert.alert(
      'スコアリング設定をリセット',
      'スコアリングの設定をデフォルトに戻します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            setScoringSettings(DEFAULT_SCORING_SETTINGS);
            await storageService.saveScoringSettings(DEFAULT_SCORING_SETTINGS);
            Alert.alert('完了', 'スコアリング設定をリセットしました');
          },
        },
      ]
    );
  };

  const priceLevelOptions = [
    { value: 'ANY', label: 'こだわらない' },
    { value: 'INEXPENSIVE', label: 'リーズナブル (¥)' },
    { value: 'MODERATE', label: '普通 (¥¥)' },
    { value: 'EXPENSIVE', label: 'やや高め (¥¥¥)' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>スコアリング設定</Text>
          <Text style={styles.sectionDescription}>
            店舗の並び順をカスタマイズできます
          </Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>好みの価格帯</Text>
            <View style={styles.buttonGroup}>
              {priceLevelOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    scoringSettings.preferredPriceLevel === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => handlePriceLevelChange(option.value as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      scoringSettings.preferredPriceLevel === option.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetScoring}
          >
            <Text style={styles.settingText}>
              スコアリング設定をリセット
            </Text>
            <Text style={styles.settingDescription}>
              デフォルトの設定に戻します
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>学習レコード数</Text>
            <Text style={styles.settingValue}>{recordCount}件</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetLearning}
          >
            <Text style={[styles.settingText, styles.dangerText]}>
              学習データをリセット
            </Text>
            <Text style={styles.settingDescription}>
              これまでの学習履歴を削除し、初期状態に戻します
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリについて</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>バージョン</Text>
            <Text style={styles.infoValue}>0.1.0 (MVP)</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.backButtonText}>ホームに戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  settingItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  dangerText: {
    color: '#FF3B30',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  settingValue: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  backButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
