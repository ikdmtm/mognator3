import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Genre } from '../core/types/genre.types';
import genresData from '../core/data/genres.seed.json';
import { placesService, Place } from '../core/services/PlacesService';
import { locationService } from '../core/services/LocationService';
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

  const genres: Genre[] = genresData as Genre[];
  const enabledGenres = genres.filter(g => g.enabled);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredGenres([]);
    } else {
      const filtered = enabledGenres.filter(genre =>
        genre.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredGenres(filtered);
    }
  };

  const handleGenreSelect = async (genre: Genre) => {
    setSelectedGenre({ id: genre.id, name: genre.name });
    setPlaces([]);
    setPlacesError(undefined);
    setPlacesLoading(true);
    setModalVisible(true);

    // 位置情報とスコアリング設定を取得して店舗検索
    try {
      const [location, scoringSettings] = await Promise.all([
        locationService.getCurrentLocation(),
        storageService.getScoringSettings(),
      ]);

      if (location && location.coords) {
        const result = await placesService.searchNearby(
          genre.id,
          location.coords.latitude,
          location.coords.longitude,
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
      <Text style={styles.genreName}>{item.name}</Text>
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
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ジャンルから探す</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ジャンルを検索（例: ラーメン、寿司）"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
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
              ? 'ジャンルを検索してください'
              : '該当するジャンルが見つかりません'}
          </Text>
        </View>
      )}

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
    paddingTop: 16,
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
});
