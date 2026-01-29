import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { Place, Review } from '../core/services/PlacesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  place: Place | null;
  onClose: () => void;
}

export default function PlaceDetailModal({ visible, place, onClose }: Props) {
  if (!place) return null;

  const handleOpenMap = async () => {
    if (place.googleMapsUri) {
      try {
        await Linking.openURL(place.googleMapsUri);
      } catch {
        Alert.alert('エラー', 'マップを開けませんでした');
      }
    }
  };

  const handleCall = async () => {
    if (place.internationalPhoneNumber) {
      const phoneUrl = `tel:${place.internationalPhoneNumber.replace(/\s/g, '')}`;
      try {
        await Linking.openURL(phoneUrl);
      } catch {
        Alert.alert('エラー', '電話をかけられませんでした');
      }
    }
  };

  const handleOpenWebsite = async () => {
    if (place.websiteUri) {
      try {
        await Linking.openURL(place.websiteUri);
      } catch {
        Alert.alert('エラー', 'ウェブサイトを開けませんでした');
      }
    }
  };

  const renderPriceLevel = (priceLevel?: string) => {
    if (!priceLevel) return null;
    const levels: Record<string, { text: string; color: string }> = {
      PRICE_LEVEL_FREE: { text: '無料', color: '#34C759' },
      PRICE_LEVEL_INEXPENSIVE: { text: '¥ リーズナブル', color: '#34C759' },
      PRICE_LEVEL_MODERATE: { text: '¥¥ 普通', color: '#FFB800' },
      PRICE_LEVEL_EXPENSIVE: { text: '¥¥¥ やや高め', color: '#FF9500' },
      PRICE_LEVEL_VERY_EXPENSIVE: { text: '¥¥¥¥ 高級', color: '#FF3B30' },
    };
    return levels[priceLevel] || null;
  };

  const renderReview = (review: Review, index: number) => {
    const reviewText = review.text?.text || review.originalText?.text;
    if (!reviewText) return null;

    return (
      <View key={index} style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewAuthor}>{review.authorAttribution.displayName}</Text>
          <Text style={styles.reviewTime}>{review.relativePublishTimeDescription}</Text>
        </View>
        <View style={styles.reviewRating}>
          <Text style={styles.reviewStars}>
            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
          </Text>
        </View>
        <Text style={styles.reviewText} numberOfLines={4}>{reviewText}</Text>
      </View>
    );
  };

  const priceInfo = renderPriceLevel(place.priceLevel);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 写真 */}
          {place.photoUrl ? (
            <Image
              source={{ uri: place.photoUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.noImage]}>
              <Text style={styles.noImageText}>写真なし</Text>
            </View>
          )}

          {/* 店舗情報 */}
          <View style={styles.infoSection}>
            {/* 店名 */}
            <Text style={styles.placeName}>{place.displayName.text}</Text>

            {/* 評価 */}
            <View style={styles.ratingSection}>
              {place.rating && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingStars}>
                    {'★'.repeat(Math.round(place.rating))}
                    {'☆'.repeat(5 - Math.round(place.rating))}
                  </Text>
                  <Text style={styles.ratingNumber}>{place.rating.toFixed(1)}</Text>
                  {place.userRatingCount && (
                    <Text style={styles.reviewCount}>
                      ({place.userRatingCount.toLocaleString()}件のレビュー)
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 営業状況 & 価格帯 */}
            <View style={styles.statusRow}>
              {place.currentOpeningHours?.openNow !== undefined && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: place.currentOpeningHours.openNow
                        ? '#E8F5E9'
                        : '#FFEBEE',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: place.currentOpeningHours.openNow
                          ? '#2E7D32'
                          : '#C62828',
                      },
                    ]}
                  >
                    {place.currentOpeningHours.openNow ? '営業中' : '営業時間外'}
                  </Text>
                </View>
              )}

              {priceInfo && (
                <View style={[styles.statusBadge, { backgroundColor: '#FFF8E1' }]}>
                  <Text style={[styles.statusText, { color: priceInfo.color }]}>
                    {priceInfo.text}
                  </Text>
                </View>
              )}
            </View>

            {/* アクションボタン（電話・ウェブサイト） */}
            {(place.internationalPhoneNumber || place.websiteUri) && (
              <View style={styles.actionButtons}>
                {place.internationalPhoneNumber && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                    <Text style={styles.actionButtonIcon}>📞</Text>
                    <Text style={styles.actionButtonText}>電話</Text>
                  </TouchableOpacity>
                )}
                {place.websiteUri && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleOpenWebsite}>
                    <Text style={styles.actionButtonIcon}>🌐</Text>
                    <Text style={styles.actionButtonText}>ウェブサイト</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 住所 */}
            {place.formattedAddress && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>住所</Text>
                <Text style={styles.detailText}>{place.formattedAddress}</Text>
              </View>
            )}

            {/* 営業時間 */}
            {place.regularOpeningHours?.weekdayDescriptions && place.regularOpeningHours.weekdayDescriptions.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>営業時間</Text>
                {place.regularOpeningHours.weekdayDescriptions.map((desc, idx) => (
                  <Text key={idx} style={styles.hoursText}>{desc}</Text>
                ))}
              </View>
            )}

            {/* 電話番号 */}
            {place.internationalPhoneNumber && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>電話番号</Text>
                <TouchableOpacity onPress={handleCall}>
                  <Text style={[styles.detailText, styles.linkText]}>
                    {place.internationalPhoneNumber}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* レビュー */}
            {place.reviews && place.reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionLabel}>最新のレビュー</Text>
                {place.reviews.slice(0, 3).map((review, idx) => renderReview(review, idx))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* マップボタン */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
            <Text style={styles.mapButtonText}>マップで見る</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
    backgroundColor: '#E0E0E0',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 16,
  },
  infoSection: {
    padding: 20,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingStars: {
    fontSize: 18,
    color: '#FFB800',
    marginRight: 8,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  linkText: {
    color: '#FF6B35',
  },
  hoursText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  reviewsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  reviewCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewTime: {
    fontSize: 12,
    color: '#999',
  },
  reviewRating: {
    marginBottom: 6,
  },
  reviewStars: {
    fontSize: 12,
    color: '#FFB800',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  mapButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
