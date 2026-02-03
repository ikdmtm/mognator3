import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Place } from '../core/services/PlacesService';
import { useI18n } from '../core/i18n';
import PlaceDetailModal from './PlaceDetailModal';

interface Props {
  visible: boolean;
  genreName: string;
  locationName?: string; // 検索場所名（「現在地」or 住所）
  places: Place[];
  loading: boolean;
  error?: string;
  onClose: () => void;
  onOpenMap: (genreName: string) => void;
}

export default function PlacesModal({
  visible,
  genreName,
  locationName,
  places,
  loading,
  error,
  onClose,
  onOpenMap,
}: Props) {
  const { t } = useI18n();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const getSubtitle = () => {
    if (!locationName) {
      return t('places.nearby');
    }
    const currentLabel = t('places.currentLocation');
    if (locationName === currentLabel) {
      return t('places.nearby');
    }
    return t('places.nearbyFormat', { location: locationName });
  };

  const handlePlacePress = (place: Place) => {
    setSelectedPlace(place);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedPlace(null);
  };

  const renderPriceLevel = (priceLevel?: string) => {
    if (!priceLevel) return null;
    const levels: Record<string, string> = {
      PRICE_LEVEL_FREE: t('places.priceFree'),
      PRICE_LEVEL_INEXPENSIVE: '¥',
      PRICE_LEVEL_MODERATE: '¥¥',
      PRICE_LEVEL_EXPENSIVE: '¥¥¥',
      PRICE_LEVEL_VERY_EXPENSIVE: '¥¥¥¥',
    };
    return levels[priceLevel] || null;
  };

  const renderPlace = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.placeCard}
      onPress={() => handlePlacePress(item)}
      activeOpacity={0.7}
    >
      {item.photoUrl && (
        <Image
          source={{ uri: item.photoUrl }}
          style={styles.placeImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.displayName.text}
        </Text>
        
        <View style={styles.placeDetails}>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
              {item.userRatingCount && (
                <Text style={styles.ratingCount}>({item.userRatingCount})</Text>
              )}
            </View>
          )}
          
          {renderPriceLevel(item.priceLevel) && (
            <Text style={styles.priceLevel}>{renderPriceLevel(item.priceLevel)}</Text>
          )}
          
          {item.currentOpeningHours?.openNow !== undefined && (
            <Text style={[
              styles.openStatus,
              { color: item.currentOpeningHours.openNow ? '#34C759' : '#FF3B30' }
            ]}>
              {item.currentOpeningHours.openNow ? t('places.openNow') : t('places.closed')}
            </Text>
          )}
        </View>
        
        {item.formattedAddress && (
          <Text style={styles.address} numberOfLines={1}>
            {item.formattedAddress}
          </Text>
        )}
      </View>
      
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>{t('places.searching')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{t('places.searchFailed')}</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity
            style={styles.fallbackButton}
            onPress={() => onOpenMap(genreName)}
          >
            <Text style={styles.fallbackButtonText}>{t('places.searchOnMap')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('places.noPlaces')}</Text>
        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={() => onOpenMap(genreName)}
        >
          <Text style={styles.fallbackButtonText}>{t('places.searchOnMap')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{genreName}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={places}
          renderItem={renderPlace}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
        />

        {places.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => onOpenMap(genreName)}
            >
              <Text style={styles.mapButtonText}>{t('places.viewAllOnMap')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 店舗詳細モーダル */}
        <PlaceDetailModal
          visible={detailVisible}
          place={selectedPlace}
          onClose={handleCloseDetail}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  placeImage: {
    width: 80,
    height: 80,
    backgroundColor: '#E0E0E0',
  },
  placeInfo: {
    flex: 1,
    padding: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  placeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FFB800',
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
  },
  priceLevel: {
    fontSize: 14,
    color: '#666',
  },
  openStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  address: {
    fontSize: 12,
    color: '#999',
  },
  chevron: {
    fontSize: 24,
    color: '#CCC',
    paddingRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  fallbackButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  fallbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  mapButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
