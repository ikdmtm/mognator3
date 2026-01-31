import * as Location from 'expo-location';
import { Platform, Linking } from 'react-native';

export interface SearchLocation {
  latitude: number;
  longitude: number;
  name: string; // 「現在地」or 住所名
}

/**
 * 位置情報サービス
 */
export class LocationService {
  private currentLocation: Location.LocationObject | null = null;

  /**
   * 位置情報の取得を試みる
   * 拒否された場合でもエラーにせず、nullを返す
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      // パーミッション確認
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('位置情報のパーミッションが拒否されました');
        return null;
      }

      // 現在位置を取得
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      return null;
    }
  }

  /**
   * 住所や地名から緯度経度を取得
   */
  async geocodeAddress(address: string): Promise<SearchLocation | null> {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length === 0) {
        return null;
      }

      const location = results[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        name: address,
      };
    } catch (error) {
      console.error('ジオコーディングに失敗しました:', error);
      return null;
    }
  }

  /**
   * 現在地から SearchLocation を作成
   */
  async getCurrentSearchLocation(): Promise<SearchLocation | null> {
    const location = await this.getCurrentLocation();
    if (!location) {
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      name: '現在地',
    };
  }

  /**
   * キャッシュされた位置情報を返す
   */
  getCachedLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }

  /**
   * マップアプリで検索するディープリンクを開く
   */
  async openMapSearch(query: string): Promise<boolean> {
    try {
      // 位置情報を取得（拒否されてもOK）
      const location = await this.getCurrentLocation();
      
      const url = this.generateMapUrl(query, location);
      
      // URLを開く
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        console.error('マップURLを開けません:', url);
        return false;
      }
    } catch (error) {
      console.error('マップの起動に失敗しました:', error);
      return false;
    }
  }

  /**
   * プラットフォームに応じたマップURLを生成
   */
  private generateMapUrl(query: string, location: Location.LocationObject | null): string {
    const encodedQuery = encodeURIComponent(query);
    
    if (Platform.OS === 'ios') {
      // iOS: Apple Maps
      if (location) {
        const { latitude, longitude } = location.coords;
        return `maps://maps.apple.com/?q=${encodedQuery}&sll=${latitude},${longitude}`;
      } else {
        // 位置情報なしでも検索可能
        return `maps://maps.apple.com/?q=${encodedQuery}`;
      }
    } else {
      // Android: Google Maps
      if (location) {
        const { latitude, longitude } = location.coords;
        return `geo:${latitude},${longitude}?q=${encodedQuery}`;
      } else {
        // 位置情報なしでも検索可能
        return `geo:0,0?q=${encodedQuery}`;
      }
    }
  }
}

// シングルトンインスタンス
export const locationService = new LocationService();
