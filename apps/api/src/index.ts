/**
 * Mognator API - Cloudflare Workers
 * Google Places API (New) のプロキシサーバー
 */

export interface Env {
  GOOGLE_PLACES_API_KEY: string;
}

// ジャンルIDからPlaces API typeへのマッピング
const GENRE_TO_PLACES_TYPE: Record<string, string[]> = {
  // ラーメン系
  'ramen_iekei': ['ramen_restaurant'],
  'ramen_tonkotsu': ['ramen_restaurant'],
  'ramen_shoyu': ['ramen_restaurant'],
  'ramen_miso': ['ramen_restaurant'],
  'ramen_shio': ['ramen_restaurant'],
  'ramen_tanmen': ['ramen_restaurant'],
  'ramen_tsukemen': ['ramen_restaurant'],
  'ramen_aburasoba': ['ramen_restaurant'],
  'ramen_jiro': ['ramen_restaurant'],
  'ramen_toripaitan': ['ramen_restaurant'],
  'ramen_tantanmen': ['ramen_restaurant'],
  
  // カレー系
  'curry_spice': ['restaurant'],
  'curry_katsu': ['restaurant'],
  'curry_regular': ['restaurant'],
  'curry_thai': ['thai_restaurant'],
  'curry_keema': ['indian_restaurant'],
  'curry_udon': ['japanese_restaurant'],
  
  // 寿司・海鮮
  'sushi': ['sushi_restaurant'],
  'kaisen_donburi': ['sushi_restaurant', 'japanese_restaurant'],
  
  // 焼肉・ステーキ
  'yakiniku': ['korean_restaurant', 'japanese_restaurant'],
  'steak': ['steak_house'],
  'yakitori': ['japanese_restaurant'],
  
  // 揚げ物
  'tonkatsu': ['japanese_restaurant'],
  'karaage': ['japanese_restaurant'],
  'tempura': ['japanese_restaurant'],
  'kushikatsu': ['japanese_restaurant'],
  'ten_donburi': ['japanese_restaurant'],
  'katsu_donburi': ['japanese_restaurant'],
  
  // 中華
  'gyoza': ['chinese_restaurant'],
  'mapo_tofu': ['chinese_restaurant'],
  'chahan': ['chinese_restaurant'],
  'chuka_teishoku': ['chinese_restaurant'],
  'xiaolongbao': ['chinese_restaurant'],
  
  // イタリアン
  'pasta': ['italian_restaurant'],
  'pizza': ['pizza_restaurant'],
  
  // 丼
  'gyudon': ['japanese_restaurant'],
  'butadon': ['japanese_restaurant'],
  'oyakodon': ['japanese_restaurant'],
  'unadon': ['japanese_restaurant'],
  
  // 定食
  'teishoku_fish': ['japanese_restaurant'],
  'teishoku_shogayaki': ['japanese_restaurant'],
  'teishoku_sashimi': ['japanese_restaurant'],
  'teishoku_hamburg': ['japanese_restaurant'],
  
  // 韓国料理
  'korean_jjigae': ['korean_restaurant'],
  'korean_bibimbap': ['korean_restaurant'],
  'korean_reimen': ['korean_restaurant'],
  
  // エスニック
  'thai': ['thai_restaurant'],
  'vietnam': ['vietnamese_restaurant'],
  'ethnic_other': ['restaurant'],
  
  // その他
  'udon': ['japanese_restaurant'],
  'soba': ['japanese_restaurant'],
  'hamburger': ['hamburger_restaurant'],
  'omurice': ['japanese_restaurant'],
  'doria_gratin': ['restaurant'],
  'okonomiyaki': ['japanese_restaurant'],
  'nabe': ['japanese_restaurant'],
};

// ジャンルIDから検索キーワードへのマッピング（テキスト検索用）
const GENRE_TO_SEARCH_KEYWORD: Record<string, string> = {
  'ramen_iekei': '家系ラーメン',
  'ramen_tonkotsu': 'とんこつラーメン',
  'ramen_shoyu': '醤油ラーメン',
  'ramen_miso': '味噌ラーメン',
  'ramen_shio': '塩ラーメン',
  'ramen_tanmen': 'タンメン',
  'ramen_tsukemen': 'つけ麺',
  'ramen_aburasoba': '油そば',
  'ramen_jiro': '二郎系ラーメン',
  'ramen_toripaitan': '鶏白湯ラーメン',
  'ramen_tantanmen': '担々麺',
  'curry_spice': 'スパイスカレー',
  'curry_katsu': 'カツカレー',
  'curry_regular': 'カレーライス',
  'curry_thai': 'グリーンカレー タイカレー',
  'curry_keema': 'キーマカレー',
  'curry_udon': 'カレーうどん',
  'sushi': '寿司',
  'kaisen_donburi': '海鮮丼',
  'yakiniku': '焼肉',
  'steak': 'ステーキ',
  'yakitori': '焼き鳥',
  'tonkatsu': 'とんかつ',
  'karaage': '唐揚げ定食',
  'tempura': '天ぷら',
  'kushikatsu': '串カツ',
  'ten_donburi': '天丼',
  'katsu_donburi': 'カツ丼',
  'gyoza': '餃子',
  'mapo_tofu': '麻婆豆腐',
  'chahan': 'チャーハン',
  'chuka_teishoku': '中華料理',
  'xiaolongbao': '小籠包',
  'pasta': 'パスタ',
  'pizza': 'ピザ',
  'gyudon': '牛丼',
  'butadon': '豚丼',
  'oyakodon': '親子丼',
  'unadon': 'うなぎ',
  'teishoku_fish': '焼き魚定食',
  'teishoku_shogayaki': '生姜焼き定食',
  'teishoku_sashimi': '刺身定食',
  'teishoku_hamburg': 'ハンバーグ',
  'korean_jjigae': 'チゲ 韓国料理',
  'korean_bibimbap': 'ビビンバ',
  'korean_reimen': '冷麺',
  'thai': 'タイ料理',
  'vietnam': 'ベトナム料理 フォー',
  'ethnic_other': 'エスニック料理',
  'udon': 'うどん',
  'soba': 'そば',
  'hamburger': 'ハンバーガー',
  'omurice': 'オムライス',
  'doria_gratin': 'ドリア グラタン',
  'okonomiyaki': 'お好み焼き',
  'nabe': '鍋',
};

// CORS対応ヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface PlacesNearbyRequest {
  includedTypes?: string[];
  maxResultCount: number;
  languageCode: string;
  locationRestriction: {
    circle: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
  };
}

interface PlacesTextSearchRequest {
  textQuery: string;
  maxResultCount: number;
  locationBias: {
    circle: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
  };
  languageCode: string;
}

interface Place {
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
  photos?: Array<{ name: string }>;
}

interface PlacesResponse {
  places?: Place[];
}

// Nearby Search API (New)
async function searchNearby(
  env: Env,
  types: string[],
  lat: number,
  lng: number,
  radius: number = 1500
): Promise<PlacesResponse> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  
  const body: PlacesNearbyRequest = {
    includedTypes: types,
    maxResultCount: 10,
    languageCode: 'ja',
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
      },
    },
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.location,places.googleMapsUri,places.currentOpeningHours,places.photos',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Nearby Search error:', error);
    throw new Error(`Nearby Search failed: ${response.status}`);
  }
  
  return response.json();
}

// Text Search API (New)
async function searchText(
  env: Env,
  query: string,
  lat: number,
  lng: number,
  radius: number = 1500
): Promise<PlacesResponse> {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  
  const body: PlacesTextSearchRequest = {
    textQuery: query,
    maxResultCount: 10,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
      },
    },
    languageCode: 'ja',
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.location,places.googleMapsUri,places.currentOpeningHours,places.photos',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Text Search error:', error);
    throw new Error(`Text Search failed: ${response.status}`);
  }
  
  return response.json();
}

// 店舗写真のURLを生成
function getPhotoUrl(photoName: string, apiKey: string, maxWidth: number = 400): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
}

// 2点間の距離を計算（ハーバーサイン公式、メートル単位）
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 店舗スコアリング
 * 
 * 評価基準と重み：
 * - 評価（rating）: 35% - 品質の最重要指標
 * - レビュー数（userRatingCount）: 20% - 評価の信頼性
 * - 営業中（openNow）: 25% - 今すぐ行ける利便性
 * - 距離: 20% - 近さの利便性
 */
function calculatePlaceScore(
  place: Place,
  userLat: number,
  userLng: number,
  radius: number
): number {
  const WEIGHT_RATING = 0.35;
  const WEIGHT_REVIEW_COUNT = 0.20;
  const WEIGHT_OPEN_NOW = 0.25;
  const WEIGHT_DISTANCE = 0.20;

  // 評価スコア: 0-5 を 0-1 に正規化
  const ratingScore = (place.rating ?? 3.0) / 5.0;

  // レビュー数スコア: 対数変換で正規化（1-1000件を想定）
  // log(count+1) / log(1001) で 0-1 に正規化
  const reviewCount = place.userRatingCount ?? 0;
  const reviewScore = Math.log(reviewCount + 1) / Math.log(1001);

  // 営業中スコア: 営業中なら1、それ以外は0.3（閉店でも候補として残す）
  let openScore = 0.5; // 不明の場合
  if (place.currentOpeningHours?.openNow === true) {
    openScore = 1.0;
  } else if (place.currentOpeningHours?.openNow === false) {
    openScore = 0.3;
  }

  // 距離スコア: 近いほど高スコア（radius内で線形減衰）
  let distanceScore = 1.0;
  if (place.location) {
    const distance = calculateDistance(
      userLat,
      userLng,
      place.location.latitude,
      place.location.longitude
    );
    distanceScore = Math.max(0, 1 - distance / radius);
  }

  // 総合スコア計算
  const totalScore =
    WEIGHT_RATING * ratingScore +
    WEIGHT_REVIEW_COUNT * reviewScore +
    WEIGHT_OPEN_NOW * openScore +
    WEIGHT_DISTANCE * distanceScore;

  return totalScore;
}

// メインハンドラー
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const url = new URL(request.url);
    
    // ヘルスチェック
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 近くの店舗検索
    if (url.pathname === '/places/search') {
      try {
        const genreId = url.searchParams.get('genre');
        const lat = parseFloat(url.searchParams.get('lat') || '');
        const lng = parseFloat(url.searchParams.get('lng') || '');
        const radius = parseInt(url.searchParams.get('radius') || '1500');
        
        if (!genreId || isNaN(lat) || isNaN(lng)) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters: genre, lat, lng' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        let result: PlacesResponse;
        
        // まずNearby Searchを試す
        const placeTypes = GENRE_TO_PLACES_TYPE[genreId];
        if (placeTypes && placeTypes.length > 0) {
          result = await searchNearby(env, placeTypes, lat, lng, radius);
        } else {
          result = { places: [] };
        }
        
        // 結果が少なければText Searchで補完
        if (!result.places || result.places.length < 5) {
          const keyword = GENRE_TO_SEARCH_KEYWORD[genreId] || genreId;
          const textResult = await searchText(env, keyword, lat, lng, radius);
          
          if (textResult.places) {
            // 重複を除いて結果をマージ
            const existingIds = new Set(result.places?.map(p => p.id) || []);
            const newPlaces = textResult.places.filter(p => !existingIds.has(p.id));
            result.places = [...(result.places || []), ...newPlaces].slice(0, 10);
          }
        }
        
        // スコアリングして並び替え
        const scoredPlaces = (result.places || []).map(place => ({
          ...place,
          score: calculatePlaceScore(place, lat, lng, radius),
        }));
        
        // スコア降順でソート
        scoredPlaces.sort((a, b) => b.score - a.score);
        
        // 写真URLを付与（上位10件）
        const placesWithPhotos = scoredPlaces.slice(0, 10).map(place => ({
          ...place,
          photoUrl: place.photos?.[0]?.name 
            ? getPhotoUrl(place.photos[0].name, env.GOOGLE_PLACES_API_KEY)
            : null,
        }));
        
        return new Response(
          JSON.stringify({ places: placesWithPhotos }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Search error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error', details: String(error) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // 404
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};
