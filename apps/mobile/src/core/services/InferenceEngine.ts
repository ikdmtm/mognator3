import { Genre, GenreResult, StatsMap, INFERENCE_CONFIG } from '../types/genre.types';
import { Question, QuestionAnswer, ANSWER_OPTIONS } from '../types/question.types';
import genresData from '../data/genres.seed.json';

/**
 * 推論エンジン
 * ベイズ更新によりジャンルの確率を計算
 */
export class InferenceEngine {
  private genres: Genre[];
  private stats: StatsMap;
  private genreLogScores: Map<string, number>;

  constructor() {
    this.genres = genresData as Genre[];
    this.stats = this.initializeStats();
    this.genreLogScores = new Map();
    this.resetScores();
  }

  /**
   * 統計データの初期化（一様分布 + スムージング）
   */
  private initializeStats(): StatsMap {
    const stats: StatsMap = {};
    
    // 初期値は一様分布（各ジャンル・質問・回答の組み合わせに α=1 のカウント）
    this.genres.forEach(genre => {
      stats[genre.id] = {};
    });

    return stats;
  }

  /**
   * ジャンルスコアのリセット（log空間で一様分布）
   */
  resetScores(): void {
    const uniformLogProb = Math.log(1.0 / this.genres.length);
    this.genres.forEach(genre => {
      this.genreLogScores.set(genre.id, uniformLogProb);
    });
  }

  /**
   * 回答に基づいてジャンルスコアを更新（ベイズ更新）
   */
  updateWithAnswer(question: Question, answerId: string): void {
    const answer = ANSWER_OPTIONS.find(opt => opt.id === answerId);
    if (!answer) return;

    this.genres.forEach(genre => {
      // P(answer | genre, question) を計算
      const likelihood = this.calculateLikelihood(genre.id, question.id, answerId);
      
      // log P(genre) += log P(answer | genre, question)
      const currentLogScore = this.genreLogScores.get(genre.id) || INFERENCE_CONFIG.MIN_LOG_PROB;
      const newLogScore = currentLogScore + Math.log(likelihood);
      
      this.genreLogScores.set(genre.id, Math.max(newLogScore, INFERENCE_CONFIG.MIN_LOG_PROB));
    });

    // 正規化
    this.normalizeScores();
  }

  /**
   * 尤度 P(answer | genre, question) の計算
   * 初期はシンプルなヒューリスティック
   */
  private calculateLikelihood(genreId: string, questionId: string, answerId: string): number {
    // stats から取得（学習データがある場合）
    const count = this.stats[genreId]?.[questionId]?.[answerId] || 0;
    
    // 全回答のカウント合計
    const totalCount = ANSWER_OPTIONS.reduce((sum, opt) => {
      return sum + (this.stats[genreId]?.[questionId]?.[opt.id] || 0);
    }, 0);

    // スムージング付き確率
    const alpha = INFERENCE_CONFIG.SMOOTHING_ALPHA;
    const numOptions = ANSWER_OPTIONS.length;
    
    return (count + alpha) / (totalCount + alpha * numOptions);
  }

  /**
   * logスコアの正規化
   */
  private normalizeScores(): void {
    // log-sum-exp トリック for numerical stability
    const logScores = Array.from(this.genreLogScores.values());
    const maxLogScore = Math.max(...logScores);
    
    // exp(log_score - max_log_score) の合計
    let sumExp = 0;
    this.genreLogScores.forEach((logScore) => {
      sumExp += Math.exp(logScore - maxLogScore);
    });
    
    const logSumExp = maxLogScore + Math.log(sumExp);
    
    // 正規化: log_score -= log_sum_exp
    this.genreLogScores.forEach((logScore, genreId) => {
      this.genreLogScores.set(genreId, logScore - logSumExp);
    });
  }

  /**
   * Top3ジャンルを計算
   */
  getTop3(): GenreResult[] {
    // logスコアから確率に変換
    const results: GenreResult[] = this.genres.map(genre => {
      const logScore = this.genreLogScores.get(genre.id) || INFERENCE_CONFIG.MIN_LOG_PROB;
      const probability = Math.exp(logScore);
      
      return {
        genre,
        probability,
        reason: this.generateReason(genre), // 後で実装
      };
    });

    // 確率でソート
    results.sort((a, b) => b.probability - a.probability);

    // Top3を返す
    return results.slice(0, 3);
  }

  /**
   * 理由生成（簡易版）
   */
  private generateReason(genre: Genre): string {
    // M2では簡易的な理由を返す
    // M3以降で回答履歴から詳細な理由を生成
    const reasons = [
      `${genre.name}っぽい`,
      `今の気分に合いそう`,
      `良さそう`,
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * 統計データの更新（学習用）
   */
  updateStats(genreId: string, questionId: string, answerId: string): void {
    if (!this.stats[genreId]) {
      this.stats[genreId] = {};
    }
    if (!this.stats[genreId][questionId]) {
      this.stats[genreId][questionId] = {};
    }
    
    const currentCount = this.stats[genreId][questionId][answerId] || 0;
    this.stats[genreId][questionId][answerId] = currentCount + 1;
  }

  /**
   * セッションのリセット
   */
  reset(): void {
    this.resetScores();
  }
}

// シングルトンインスタンス
export const inferenceEngine = new InferenceEngine();
