/**
 * Places API サービス
 * Cloudflare Workers経由でGoogle Places APIを呼び出す
 */

// API設定（デプロイ後に更新）
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787'  // ローカル開発
  : 'https://mognator-api.YOUR_SUBDOMAIN.workers.dev';  // 本番URL（要更新）

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
  photoUrl?: string | null;
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
    radius: number = 1500
  ): Promise<PlacesSearchResult> {
    try {
      const params = new URLSearchParams({
        genre: genreId,
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radius.toString(),
      });

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
