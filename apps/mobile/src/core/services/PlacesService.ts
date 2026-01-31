/**
 * Places API サービス
 * Cloudflare Workers経由でGoogle Places APIを呼び出す
 */

import { ScoringSettings } from '../types/scoring.types';

// API設定
// 注: Expo Go は __DEV__ = true で動作するため、常に本番URLを使用
const API_BASE_URL = 'https://mognator-api.mognator.workers.dev';

export interface Review {
  name: string;
  rating: number;
  text?: { text: string; languageCode: string };
  originalText?: { text: string; languageCode: string };
  authorAttribution: { displayName: string; photoUri?: string };
  relativePublishTimeDescription: string;
}

export interface Place {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
  currentOpeningHours?: {
    openNow?: boolean;
  };
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  reviews?: Review[];
  photoUrl?: string | null;
  photoUrls?: string[];
  types?: string[];
}

export interface PlacesSearchResult {
  places: Place[];
  error?: string;
}

class PlacesService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * APIのベースURLを設定
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 現在のベースURLを取得
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 近くの店舗を検索
   */
  async searchNearby(
    genreId: string,
    latitude: number,
    longitude: number,
    radius: number = 1500,
    scoringSettings?: ScoringSettings
  ): Promise<PlacesSearchResult> {
    try {
      const params = new URLSearchParams({
        genre: genreId,
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radius.toString(),
      });

      // スコアリング設定をクエリパラメータに追加
      if (scoringSettings) {
        const { weights, preferredPriceLevel } = scoringSettings;
        params.append('w_rating', weights.rating.toString());
        params.append('w_reviewCount', weights.reviewCount.toString());
        params.append('w_openNow', weights.openNow.toString());
        params.append('w_distance', weights.distance.toString());
        params.append('w_priceLevel', weights.priceLevel.toString());
        if (preferredPriceLevel) {
          params.append('preferredPriceLevel', preferredPriceLevel);
        }
      }

      const response = await fetch(`${this.baseUrl}/places/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Places API error:', error);
        return { places: [], error: error.error || 'API error' };
      }

      const data = await response.json();
      return { places: data.places || [] };
    } catch (error) {
      console.error('Network error:', error);
      return { places: [], error: 'Network error' };
    }
  }

  /**
   * フリーテキストで店舗を検索（飲食店のみ）
   */
  async searchByKeyword(
    keyword: string,
    latitude: number,
    longitude: number,
    radius: number = 1500,
    scoringSettings?: ScoringSettings
  ): Promise<PlacesSearchResult> {
    try {
      const params = new URLSearchParams({
        keyword: keyword,
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radius.toString(),
        restaurant: 'true', // 飲食店のみに絞る
      });

      // スコアリング設定をクエリパラメータに追加
      if (scoringSettings) {
        const { weights, preferredPriceLevel } = scoringSettings;
        params.append('w_rating', weights.rating.toString());
        params.append('w_reviewCount', weights.reviewCount.toString());
        params.append('w_openNow', weights.openNow.toString());
        params.append('w_distance', weights.distance.toString());
        params.append('w_priceLevel', weights.priceLevel.toString());
        if (preferredPriceLevel) {
          params.append('preferredPriceLevel', preferredPriceLevel);
        }
      }

      const response = await fetch(`${this.baseUrl}/places/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Places API error:', error);
        return { places: [], error: error.error || 'API error' };
      }

      const data = await response.json();
      const places = data.places || [];
      
      // クライアント側でも飲食店かどうかをフィルタリング
      const filteredPlaces = places.filter((place: any) => {
        // types配列がない場合は通す（API側でフィルタ済みと判断）
        if (!place.types) return true;
        
        // 飲食店関連のタイプ
        const restaurantTypes = [
          'restaurant', 'food', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery',
          'bakery', 'fast_food', 'japanese_restaurant', 'chinese_restaurant',
          'italian_restaurant', 'french_restaurant', 'indian_restaurant',
          'mexican_restaurant', 'thai_restaurant', 'korean_restaurant',
          'vietnamese_restaurant', 'american_restaurant', 'spanish_restaurant',
          'greek_restaurant', 'turkish_restaurant', 'brazilian_restaurant',
          'seafood_restaurant', 'steak_house', 'sushi_restaurant',
          'pizza_restaurant', 'hamburger_restaurant', 'sandwich_shop',
          'ice_cream_shop', 'coffee_shop', 'tea_house', 'juice_bar',
          'dessert_shop', 'ramen_restaurant', 'noodle_house',
        ];
        
        // 除外すべきタイプ
        const excludedTypes = [
          'locality', 'political', 'country', 'administrative_area_level_1',
          'administrative_area_level_2', 'administrative_area_level_3',
          'geocode', 'sublocality', 'sublocality_level_1', 'neighborhood',
          'route', 'street_address', 'premise', 'subpremise',
        ];
        
        // 除外タイプが含まれている場合は除外
        if (place.types.some((type: string) => excludedTypes.includes(type))) {
          return false;
        }
        
        // 飲食店タイプが含まれているか確認
        return place.types.some((type: string) => restaurantTypes.includes(type));
      });
      
      return { places: filteredPlaces };
    } catch (error) {
      console.error('Network error:', error);
      return { places: [], error: 'Network error' };
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const placesService = new PlacesService();
