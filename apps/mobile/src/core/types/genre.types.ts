/**
 * ジャンル定義
 */
export interface Genre {
  id: string;
  name: string;
  enabled: boolean;
}

/**
 * ジャンルの推論結果
 */
export interface GenreResult {
  genre: Genre;
  probability: number;
  reason: string;
}

/**
 * 統計データ (genre, question, answer) のカウント
 * stats[genreId][questionId][answerId] = count
 */
export type StatsMap = Record<string, Record<string, Record<string, number>>>;

/**
 * 推論エンジンの設定
 */
export const INFERENCE_CONFIG = {
  SMOOTHING_ALPHA: 1.0, // Dirichlet prior α
  TOP_K_GENRES: 30, // 上位K件に絞って計算
  MIN_LOG_PROB: -100, // 最小log確率（アンダーフロー防止）
} as const;
