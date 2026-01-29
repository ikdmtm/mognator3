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
   * フリーテキストで店舗を検索
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
