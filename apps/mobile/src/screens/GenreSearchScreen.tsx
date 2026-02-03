import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Genre } from '../core/types/genre.types';
import genresData from '../core/data/genres.seed.json';
import { useI18n } from '../core/i18n';
import { placesService, Place } from '../core/services/PlacesService';
import { locationService, SearchLocation } from '../core/services/LocationService';
import { storageService } from '../core/services/StorageService';
import PlacesModal from '../components/PlacesModal';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
  GenreSearch: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GenreSearch'>;
};

export default function GenreSearchScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGenres, setFilteredGenres] = useState<Genre[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{ id: string; name: string } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | undefined>();
  
  // 場所選択機能
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  const { t, locale } = useI18n();
  const genres: Genre[] = genresData as Genre[];
  const enabledGenres = genres.filter(g => g.enabled);
  const getGenreName = (g: Genre) => (locale === 'en' && (g as Genre & { nameEn?: string }).nameEn)
    ? (g as Genre & { nameEn?: string }).nameEn!
    : g.name;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredGenres([]);
    } else {
      const q = query.toLowerCase();
      const filtered = enabledGenres.filter(genre => {
        const name = genre.name.toLowerCase();
        const nameEn = (genre as Genre & { nameEn?: string }).nameEn?.toLowerCase();
        return name.includes(q) || (nameEn && nameEn.includes(q));
      });
      setFilteredGenres(filtered);
    }
  };

  const handleUseCurrentLocation = async () => {
    setAddressLoading(true);
    try {
      const location = await locationService.getCurrentSearchLocation();
      if (location) {
        setSearchLocation(location);
        setLocationModalVisible(false);
        setAddressInput('');
      } else {
        Alert.alert(t('error.generic'), t('error.locationFailed'));
      }
    } catch (error) {
      Alert.alert(t('error.generic'), t('error.locationFailedMessage'));
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!addressInput.trim()) {
      Alert.alert(t('error.addressRequired'), t('error.addressRequiredMessage'));
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
        Alert.alert(t('error.searchFailed'), t('error.searchFailedMessage'));
      }
    } catch (error) {
      Alert.alert(t('error.generic'), t('error.searchFailedGeneric'));
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

  const handleGenreSelect = async (genre: Genre) => {
    setSelectedGenre({ id: genre.id, name: getGenreName(genre) });
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
          genre.id,
          coords.latitude,
          coords.longitude,
          1500,
          scoringSettings,
          locale
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

  const handleFreeTextSearch = async () => {
    if (searchQuery.trim() === '') {
      return;
    }

    setSelectedGenre({ id: 'custom', name: searchQuery.trim() });
    setPlaces([]);
    setPlacesError(undefined);
    setPlacesLoading(true);
    setModalVisible(true);

    // 位置情報とスコアリング設定を取得してフリーテキスト検索
    try {
      const [coords, scoringSettings] = await Promise.all([
        getSearchCoords(),
        storageService.getScoringSettings(),
      ]);

      if (coords) {
        const result = await placesService.searchByKeyword(
          searchQuery.trim(),
          coords.latitude,
          coords.longitude,
          1500,
          scoringSettings,
          locale
        );

        setPlaces(result.places);
        setPlacesError(result.error);
      } else {
        setPlacesError(t('error.locationNotAvailable'));
      }
    } catch (error) {
      console.error('Places search error:', error);
      setPlacesError(t('error.searchError'));
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleOpenMap = async (genreName: string) => {
    try {
      await locationService.openMapSearch(genreName);
    } catch (error) {
      console.log('マップ起動エラー:', error);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedGenre(null);
    setPlaces([]);
    setPlacesError(undefined);
  };

  const renderGenre = ({ item }: { item: Genre }) => (
    <TouchableOpacity
      style={styles.genreItem}
      onPress={() => handleGenreSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.genreName}>{getGenreName(item)}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const displayGenres = searchQuery.trim() === '' ? enabledGenres : filteredGenres;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>{t('question.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('genreSearch.title')}</Text>
      </View>

      <View style={styles.locationContainer}>
        <Text style={styles.locationLabel}>{t('result.searchLocation')}</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setLocationModalVisible(true)}
        >
          <Text style={styles.locationButtonText}>
            {searchLocation?.isCurrentLocation ? t('result.currentLocation') : (searchLocation?.name ?? t('result.currentLocation'))}
          </Text>
          <Text style={styles.locationButtonIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('genreSearch.searchPlaceholder')}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleFreeTextSearch}
        />
        {searchQuery.trim() !== '' && (
          <TouchableOpacity
            style={styles.freeTextSearchButton}
            onPress={handleFreeTextSearch}
          >
            <Text style={styles.freeTextSearchButtonText}>
              {t('genreSearch.searchFor', { query: searchQuery.trim() })}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {displayGenres.length > 0 ? (
        <FlatList
          data={displayGenres}
          renderItem={renderGenre}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() === ''
              ? t('genreSearch.emptyPrompt')
              : t('genreSearch.noResults')}
          </Text>
        </View>
      )}

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
                  <Text style={styles.locationModalTitle}>{t('result.locationModalTitle')}</Text>

                  <TouchableOpacity
                    style={styles.locationOption}
                    onPress={handleUseCurrentLocation}
                    disabled={addressLoading}
                  >
                    <Text style={styles.locationOptionText}>{t('result.currentLocationOption')}</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <Text style={styles.addressLabel}>{t('result.addressLabel')}</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder={t('result.addressPlaceholder')}
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
                      <Text style={styles.addressSearchButtonText}>{t('result.searchThisLocation')}</Text>
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
                    <Text style={styles.cancelButtonText}>{t('question.cancelButton')}</Text>
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
        locationName={searchLocation?.isCurrentLocation ? t('places.currentLocation') : (searchLocation?.name || t('places.currentLocation'))}
        places={places}
        loading={placesLoading}
        error={placesError}
        onClose={handleCloseModal}
        onOpenMap={handleOpenMap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  locationContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  freeTextSearchButton: {
    marginTop: 12,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  freeTextSearchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  genreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  genreName: {
    fontSize: 17,
    color: '#333',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#CCC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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
