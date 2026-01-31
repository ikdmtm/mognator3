import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inferenceEngine } from '../core/services/InferenceEngine';
import { locationService, SearchLocation } from '../core/services/LocationService';
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
  
  // 場所選択機能
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    // 推論エンジンからTop3を取得
    const top3 = inferenceEngine.getTop3();
    setResults(top3);
  }, []);

  const handleUseCurrentLocation = async () => {
    setAddressLoading(true);
    try {
      const location = await locationService.getCurrentSearchLocation();
      if (location) {
        setSearchLocation(location);
        setLocationModalVisible(false);
        setAddressInput('');
      } else {
        Alert.alert('エラー', '現在地を取得できませんでした');
      }
    } catch (error) {
      Alert.alert('エラー', '現在地の取得に失敗しました');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!addressInput.trim()) {
      Alert.alert('入力エラー', '住所または地名を入力してください');
      return;
    }

    setAddressLoading(true);
    try {
      const location = await locationService.geocodeAddress(addressInput.trim());
      if (location) {
        setSearchLocation(location);
        setLocationModalVisible(false);
        setAddressInput('');
      } else {
        Alert.alert('検索失敗', '指定された場所が見つかりませんでした');
      }
    } catch (error) {
      Alert.alert('エラー', '場所の検索に失敗しました');
    } finally {
      setAddressLoading(false);
    }
  };

  const getSearchCoords = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (searchLocation) {
      return { latitude: searchLocation.latitude, longitude: searchLocation.longitude };
    }
    
    // デフォルトは現在地
    const location = await locationService.getCurrentLocation();
    if (location && location.coords) {
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    }
    
    return null;
  };

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

    // 位置情報とスコアリング設定を取得して店舗検索
    try {
      const [coords, scoringSettings] = await Promise.all([
        getSearchCoords(),
        storageService.getScoringSettings(),
      ]);
      
      if (coords) {
        const result = await placesService.searchNearby(
          genreId,
          coords.latitude,
          coords.longitude,
          1500,
          scoringSettings
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

      <View style={styles.locationContainer}>
        <Text style={styles.locationLabel}>検索場所</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setLocationModalVisible(true)}
        >
          <Text style={styles.locationButtonText}>
            {searchLocation ? searchLocation.name : '現在地周辺'}
          </Text>
          <Text style={styles.locationButtonIcon}>📍</Text>
        </TouchableOpacity>
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
            <Text style={styles.mapButtonText}>
              {searchLocation ? '指定した場所で探す' : '近くで探す'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeButtonText}>ホームに戻る</Text>
      </TouchableOpacity>

      {/* 場所選択モーダル */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setLocationModalVisible(false);
          setAddressInput('');
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.locationModalContent}>
              <TouchableWithoutFeedback>
                <View pointerEvents="auto">
                  <Text style={styles.locationModalTitle}>検索場所を選択</Text>

                  <TouchableOpacity
                    style={styles.locationOption}
                    onPress={handleUseCurrentLocation}
                    disabled={addressLoading}
                  >
                    <Text style={styles.locationOptionText}>📍 現在地周辺</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <Text style={styles.addressLabel}>または住所・地名を入力</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="例: 東京駅、渋谷区神南1-1-1"
                    value={addressInput}
                    onChangeText={setAddressInput}
                    editable={!addressLoading}
                  />

                  <TouchableOpacity
                    style={[styles.addressSearchButton, addressLoading && styles.buttonDisabled]}
                    onPress={handleSearchAddress}
                    disabled={addressLoading}
                  >
                    {addressLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.addressSearchButtonText}>この場所で検索</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setLocationModalVisible(false);
                      setAddressInput('');
                    }}
                    disabled={addressLoading}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 店舗リストモーダル */}
      <PlacesModal
        visible={modalVisible}
        genreName={selectedGenre?.name || ''}
        locationName={searchLocation?.name || '現在地'}
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
    marginBottom: 8,
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
  locationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  locationLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B0D4FF',
  },
  locationButtonText: {
    fontSize: 15,
    color: '#0066CC',
    fontWeight: '500',
  },
  locationButtonIcon: {
    fontSize: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationOption: {
    backgroundColor: '#F0F8FF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B0D4FF',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  addressInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  addressSearchButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  addressSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666',
  },
});
