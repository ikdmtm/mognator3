import { Genre, GenreResult, StatsMap, INFERENCE_CONFIG } from '../types/genre.types';
import { Question, QuestionAnswer, ANSWER_OPTIONS } from '../types/question.types';
import genresData from '../data/genres.seed.json';
import { storageService } from './StorageService';

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
    this.loadStatsFromStorage();
  }

  /**
   * ストレージから統計データを読み込み
   */
  private async loadStatsFromStorage(): Promise<void> {
    try {
      const storedStats = await storageService.getStats();
      // 既存のstatsとマージ
      Object.keys(storedStats).forEach(genreId => {
        if (!this.stats[genreId]) {
          this.stats[genreId] = {};
        }
        Object.keys(storedStats[genreId]).forEach(questionId => {
          if (!this.stats[genreId][questionId]) {
            this.stats[genreId][questionId] = {};
          }
          Object.keys(storedStats[genreId][questionId]).forEach(answerId => {
            this.stats[genreId][questionId][answerId] = 
              storedStats[genreId][questionId][answerId];
          });
        });
      });
      console.log('統計データをストレージから読み込みました');
    } catch (error) {
      console.error('統計データ読み込みエラー:', error);
    }
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
   * ヒューリスティックなルールベース
   */
  private calculateLikelihood(genreId: string, questionId: string, answerId: string): number {
    // ヒューリスティックスコアを計算
    const heuristicScore = this.getHeuristicScore(genreId, questionId, answerId);
    
    // stats から取得（学習データがある場合）
    const count = this.stats[genreId]?.[questionId]?.[answerId] || 0;
    const totalCount = ANSWER_OPTIONS.reduce((sum, opt) => {
      return sum + (this.stats[genreId]?.[questionId]?.[opt.id] || 0);
    }, 0);

    // 学習データがある場合はそれを使用、ない場合はヒューリスティック
    if (totalCount > 0) {
      const alpha = INFERENCE_CONFIG.SMOOTHING_ALPHA;
      const numOptions = ANSWER_OPTIONS.length;
      return (count + alpha) / (totalCount + alpha * numOptions);
    }
    
    return heuristicScore;
  }

  /**
   * ヒューリスティックスコアの計算
   * ジャンルと質問・回答の関連性をルールベースで評価
   */
  private getHeuristicScore(genreId: string, questionId: string, answerId: string): number {
    const answer = ANSWER_OPTIONS.find(opt => opt.id === answerId);
    if (!answer) return 0.2; // デフォルト
    
    const answerValue = answer.value; // -2 to 2
    
    // ジャンル別の特性マッピング
    const genreTraits: Record<string, Record<string, number>> = {
      // ラーメン系
      'ramen_iekei': { q_warm: 2, q_soupy: 2, q_rich: 2, q_noodles: 2, q_savory: 2, q_large: 1 },
      'ramen_tonkotsu': { q_warm: 2, q_soupy: 2, q_rich: 2, q_noodles: 2, q_savory: 2 },
      'ramen_shoyu': { q_warm: 2, q_soupy: 2, q_rich: 0, q_noodles: 2, q_savory: 1, q_japanese: 2 },
      'ramen_miso': { q_warm: 2, q_soupy: 2, q_rich: 1, q_noodles: 2, q_savory: 2 },
      'ramen_tanmen': { q_warm: 2, q_soupy: 2, q_rich: -1, q_noodles: 2, q_veggie: 2, q_light: 1 },
      
      // カレー系
      'curry_spice': { q_warm: 2, q_spicy: 2, q_rice: 2, q_rich: 1, q_very_spicy: 1 },
      'curry_katsu': { q_warm: 2, q_rice: 2, q_rich: 2, q_meat: 2, q_large: 2, q_crispy: 1 },
      
      // 寿司
      'sushi': { q_cold: 2, q_fish: 2, q_light: 2, q_rice: 1, q_japanese: 2, q_umami: 2, q_no_soup: 2 },
      
      // 焼肉
      'yakiniku': { q_warm: 2, q_meat: 2, q_rich: 1, q_savory: 2, q_large: 2, q_no_soup: 2 },
      
      // とんかつ
      'tonkatsu': { q_warm: 2, q_meat: 2, q_rich: 2, q_crispy: 2, q_rice: 1, q_large: 1, q_japanese: 1 },
      
      // 餃子
      'gyoza': { q_warm: 1, q_meat: 1, q_savory: 2, q_chinese: 2, q_crispy: 1, q_quick: 1 },
      
      // 麻婆豆腐
      'mapo_tofu': { q_warm: 2, q_spicy: 2, q_rice: 2, q_rich: 1, q_chinese: 2, q_savory: 2 },
      
      // 担々麺
      'tantanmen': { q_warm: 2, q_spicy: 2, q_noodles: 2, q_rich: 2, q_soupy: 1, q_chinese: 2 },
      
      // パスタ
      'pasta_tomato': { q_warm: 2, q_noodles: 1, q_light: 1, q_western: 2, q_sour: 1 },
      'pasta_cream': { q_warm: 2, q_noodles: 1, q_rich: 2, q_western: 2 },
      
      // ファストフード
      'hamburger': { q_warm: 1, q_meat: 1, q_bread: 2, q_rich: 1, q_western: 2, q_quick: 2 },
      'pizza': { q_warm: 2, q_bread: 2, q_rich: 1, q_western: 2, q_large: 1 },
      
      // 和食
      'udon': { q_warm: 2, q_noodles: 2, q_soupy: 2, q_light: 1, q_japanese: 2, q_umami: 2, q_soft: 2 },
      'soba': { q_warm: 1, q_cold: 1, q_noodles: 2, q_light: 2, q_japanese: 2, q_umami: 2 },
      'oyakodon': { q_warm: 2, q_rice: 2, q_meat: 1, q_japanese: 2, q_umami: 2, q_soft: 2, q_quick: 1 },
    };
    
    const traits = genreTraits[genreId] || {};
    const traitValue = traits[questionId] || 0; // -2 to 2
    
    // 回答値とジャンル特性の一致度を計算
    // answerValue と traitValue が近いほど高スコア
    const alignment = 2 - Math.abs(answerValue - traitValue) / 2; // 0 to 2
    
    // 0-1 の範囲に正規化（0.1 〜 0.9）
    const normalized = 0.1 + (alignment / 2) * 0.8;
    
    return normalized;
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
