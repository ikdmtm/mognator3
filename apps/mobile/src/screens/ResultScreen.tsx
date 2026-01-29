import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inferenceEngine } from '../core/services/InferenceEngine';
import { locationService } from '../core/services/LocationService';
import { storageService } from '../core/services/StorageService';
import { placesService, Place } from '../core/services/PlacesService';
import { GenreResult } from '../core/types/genre.types';
import { QuestionAnswer } from '../core/types/question.types';
import PlacesModal from '../components/PlacesModal';

type RootStackParamList = {
  Home: undefined;
  Question: { answers?: QuestionAnswer[] };
  Result: { answers: QuestionAnswer[] };
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: { params: { answers: QuestionAnswer[] } };
};

export default function ResultScreen({ navigation, route }: Props) {
  const [results, setResults] = useState<GenreResult[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{ id: string; name: string } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | undefined>();
  const answers = route.params?.answers || [];

  useEffect(() => {
    // 推論エンジンからTop3を取得
    const top3 = inferenceEngine.getTop3();
    setResults(top3);
  }, []);

  const handleSearchPlaces = async (genreId: string, genreName: string) => {
    // 学習データを保存（このジャンルに興味がある）
    try {
      await storageService.saveLearningData(genreId, answers);
      console.log('学習データ保存:', genreId);
    } catch (error) {
      console.error('学習データ保存エラー:', error);
    }

    // モーダルを開く
    setSelectedGenre({ id: genreId, name: genreName });
    setPlaces([]);
    setPlacesError(undefined);
    setPlacesLoading(true);
    setModalVisible(true);

    // 位置情報を取得して店舗検索
    try {
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        const result = await placesService.searchNearby(
          genreId,
          location.latitude,
          location.longitude
        );
        
        setPlaces(result.places);
        setPlacesError(result.error);
      } else {
        setPlacesError('位置情報を取得できませんでした');
      }
    } catch (error) {
      console.error('Places search error:', error);
      setPlacesError('検索に失敗しました');
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleOpenMap = async (genreName: string) => {
    try {
      const success = await locationService.openMapSearch(genreName);
      if (!success) {
        Alert.alert(
          'エラー',
          'マップアプリを開けませんでした。'
        );
      }
    } catch (error) {
      Alert.alert('エラー', 'マップの起動に失敗しました。');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedGenre(null);
    setPlaces([]);
    setPlacesError(undefined);
  };

  if (results.length === 0) {
    return (
      <View style={styles.container}>
        <Text>結果を計算中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>あなたにおすすめ</Text>
        <Text style={styles.subtitle}>今の気分に合いそうな食事です</Text>
      </View>

      {results.map((result, index) => (
        <View key={index} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.genreName}>{result.genre.name}</Text>
            <Text style={styles.probability}>
              {Math.round(result.probability * 100)}%
            </Text>
          </View>
          <Text style={styles.reason}>{result.reason}</Text>

          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleSearchPlaces(result.genre.id, result.genre.name)}
          >
            <Text style={styles.mapButtonText}>近くで探す</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeButtonText}>ホームに戻る</Text>
      </TouchableOpacity>

      {/* 店舗リストモーダル */}
      <PlacesModal
        visible={modalVisible}
        genreName={selectedGenre?.name || ''}
        places={places}
        loading={placesLoading}
        error={placesError}
        onClose={handleCloseModal}
        onOpenMap={handleOpenMap}
      />
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
  mapButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 17,
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
