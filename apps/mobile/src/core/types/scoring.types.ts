/**
 * スコアリング設定の型定義
 */

export interface ScoringWeights {
  rating: number;        // 評価（0-5）
  reviewCount: number;   // レビュー数
  openNow: number;       // 営業中
  distance: number;      // 距離
  priceLevel: number;    // 価格帯の適合度
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  rating: 0.30,        // 30% - 品質の最重要指標
  reviewCount: 0.20,   // 20% - 評価の信頼性
  openNow: 0.25,       // 25% - 今すぐ行ける利便性
  distance: 0.15,      // 15% - 近さの利便性
  priceLevel: 0.10,    // 10% - 価格帯の適合度
};

export interface ScoringSettings {
  weights: ScoringWeights;
  preferredPriceLevel?: 'INEXPENSIVE' | 'MODERATE' | 'EXPENSIVE' | 'ANY'; // 好みの価格帯
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  weights: DEFAULT_SCORING_WEIGHTS,
  preferredPriceLevel: 'ANY',
};
