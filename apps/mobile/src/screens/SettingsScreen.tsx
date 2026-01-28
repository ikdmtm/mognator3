import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storageService } from '../core/services/StorageService';

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

  useEffect(() => {
    loadRecordCount();
  }, []);

  const loadRecordCount = async () => {
    const count = await storageService.getRecordCount();
    setRecordCount(count);
  };

  const handleResetLearning = () => {
    Alert.alert(
      '学習データをリセット',
      '学習した履歴をすべて削除します。よろしいですか？',
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

  const handleResetAll = () => {
    Alert.alert(
      'すべてのデータをリセット',
      'すべてのデータを初期状態に戻します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.resetLearningData();
              await loadRecordCount();
              Alert.alert('完了', 'すべてのデータをリセットしました');
            } catch (error) {
              Alert.alert('エラー', 'データのリセットに失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
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
          <Text style={styles.settingText}>学習データをリセット</Text>
          <Text style={styles.settingDescription}>
            これまでの学習履歴を削除します
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleResetAll}
        >
          <Text style={[styles.settingText, styles.dangerText]}>
            すべてのデータをリセット
          </Text>
          <Text style={styles.settingDescription}>
            すべてのデータを初期状態に戻します
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
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
    marginTop: 'auto',
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
