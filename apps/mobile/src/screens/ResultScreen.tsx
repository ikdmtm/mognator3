import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
};

// ダミーデータ（M2で実際のエンジンから取得）
const DUMMY_RESULTS = [
  {
    genre: '家系ラーメン',
    probability: 0.72,
    reason: '温かくてこってりが欲しいみたい',
  },
  {
    genre: 'スパイスカレー',
    probability: 0.65,
    reason: '辛くてご飯ものが良さそう',
  },
  {
    genre: '寿司',
    probability: 0.58,
    reason: 'さっぱり系が気になる',
  },
];

export default function ResultScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>あなたにおすすめ</Text>
        <Text style={styles.subtitle}>今の気分に合いそうな食事です</Text>
      </View>

      {DUMMY_RESULTS.map((result, index) => (
        <View key={index} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.genreName}>{result.genre}</Text>
            <Text style={styles.probability}>
              {Math.round(result.probability * 100)}%
            </Text>
          </View>
          <Text style={styles.reason}>{result.reason}</Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.mapButton]}
              onPress={() => {
                // M4で実装
                console.log('近くで探す:', result.genre);
              }}
            >
              <Text style={styles.mapButtonText}>近くで探す</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.selectButton]}
              onPress={() => {
                // M5で学習に使用
                console.log('これにする:', result.genre);
              }}
            >
              <Text style={styles.selectButtonText}>これにする</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeButtonText}>ホームに戻る</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  resultCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  genreName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  probability: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B35',
  },
  reason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: '#FF6B35',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  selectButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    margin: 20,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  homeButtonText: {
    fontSize: 16,
    color: '#333',
  },
});
