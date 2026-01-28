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
  getHeuristicScore(genreId: string, questionId: string, answerId: string): number {
    const answer = ANSWER_OPTIONS.find(opt => opt.id === answerId);
    if (!answer) return 0.2; // デフォルト
    
    const answerValue = answer.value; // -2 to 2
    
    // ジャンル別の特性マッピング（108ジャンル × 44質問）
    // 新しい質問IDに合わせて全面的に再設計
    const genreTraits: Record<string, Record<string, number>> = {
      // ラーメン系（12種）
      'ramen_iekei': { q_warm: 2, q_soupy: 2, q_rich: 2, q_noodles: 2, q_pork: 2, q_garlic: 2, q_large: 2, q_quick: 1, q_japanese: 2, q_comfort: 2, q_ramen_mood: 2 },
      'ramen_tonkotsu': { q_warm: 2, q_soupy: 2, q_rich: 2, q_noodles: 2, q_pork: 2, q_garlic: 1, q_large: 1, q_quick: 1, q_japanese: 2, q_comfort: 2, q_ramen_mood: 2 },
      'ramen_shoyu': { q_warm: 2, q_soupy: 2, q_light: 1, q_noodles: 2, q_pork: 1, q_chicken: 1, q_quick: 2, q_japanese: 2, q_comfort: 2, q_ramen_mood: 2 },
      'ramen_miso': { q_warm: 2, q_soupy: 2, q_rich: 1, q_noodles: 2, q_pork: 1, q_veggie: 1, q_large: 1, q_japanese: 2, q_comfort: 2, q_ramen_mood: 2 },
      'ramen_shio': { q_warm: 2, q_soupy: 2, q_light: 2, q_noodles: 2, q_quick: 2, q_japanese: 2, q_healthy: 1, q_comfort: 1, q_ramen_mood: 2 },
      'ramen_tanmen': { q_warm: 2, q_soupy: 2, q_light: 2, q_noodles: 2, q_veggie: 2, q_healthy: 2, q_chinese: 1, q_comfort: 1, q_ramen_mood: 2 },
      'ramen_tsukemen': { q_warm: 2, q_soupy: 1, q_rich: 2, q_noodles: 2, q_large: 1, q_japanese: 2, q_ramen_mood: 2 },
      'ramen_aburasoba': { q_warm: 2, q_rich: 2, q_noodles: 2, q_garlic: 2, q_large: 1, q_japanese: 2, q_indulgent: 1, q_ramen_mood: 2 },
      'ramen_jiro': { q_warm: 2, q_soupy: 2, q_rich: 2, q_noodles: 2, q_pork: 2, q_veggie: 2, q_garlic: 2, q_large: 2, q_indulgent: 2, q_ramen_mood: 2 },
      'ramen_toripaitan': { q_warm: 2, q_soupy: 2, q_rich: 2, q_noodles: 2, q_chicken: 2, q_japanese: 2, q_comfort: 2, q_ramen_mood: 2 },
      'ramen_niboshi': { q_warm: 2, q_soupy: 2, q_noodles: 2, q_fish: 1, q_japanese: 2, q_ramen_mood: 2 },
      'ramen_hiyashi': { q_cold: 2, q_light: 2, q_noodles: 2, q_veggie: 2, q_egg: 1, q_chinese: 2, q_healthy: 1, q_ramen_mood: 1 },

      // カレー系（9種）
      'curry_spice': { q_warm: 2, q_rich: 1, q_spicy: 2, q_very_spicy: 1, q_rice: 2, q_veggie: 1, q_asian: 2, q_curry_mood: 2 },
      'curry_katsu': { q_warm: 2, q_rich: 2, q_spicy: 1, q_rice: 2, q_fried: 2, q_pork: 2, q_large: 2, q_indulgent: 2, q_curry_mood: 2 },
      'curry_chicken': { q_warm: 2, q_rich: 1, q_spicy: 1, q_rice: 2, q_chicken: 2, q_comfort: 2, q_curry_mood: 2 },
      'curry_beef': { q_warm: 2, q_rich: 2, q_spicy: 1, q_rice: 2, q_beef: 2, q_indulgent: 1, q_western: 1, q_curry_mood: 2 },
      'curry_european': { q_warm: 2, q_rich: 2, q_rice: 2, q_beef: 1, q_western: 2, q_comfort: 2, q_curry_mood: 2 },
      'curry_thai': { q_warm: 2, q_rich: 2, q_spicy: 2, q_very_spicy: 1, q_rice: 2, q_chicken: 1, q_asian: 2, q_curry_mood: 2 },
      'curry_keema': { q_warm: 2, q_spicy: 2, q_rice: 2, q_meat: 2, q_beef: 1, q_asian: 2, q_curry_mood: 2 },
      'curry_dry': { q_warm: 2, q_spicy: 1, q_rice: 2, q_meat: 1, q_quick: 1, q_curry_mood: 2 },
      'curry_udon': { q_warm: 2, q_soupy: 2, q_spicy: 1, q_noodles: 2, q_japanese: 2, q_comfort: 2, q_curry_mood: 2, q_ramen_mood: 1 },

      // 寿司系（7種）
      'sushi': { q_cold: 2, q_light: 2, q_rice: 1, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_indulgent: 1, q_sushi_mood: 2 },
      'sushi_kaiten': { q_cold: 2, q_light: 2, q_rice: 1, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_quick: 1, q_sushi_mood: 2 },
      'sushi_nigiri': { q_cold: 2, q_light: 2, q_rice: 1, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_indulgent: 2, q_sushi_mood: 2 },
      'sushi_chirashi': { q_cold: 2, q_light: 2, q_rice: 2, q_fish: 2, q_raw_fish: 2, q_egg: 1, q_japanese: 2, q_sushi_mood: 2, q_donburi_mood: 1 },
      'donburi_kaisen': { q_cold: 2, q_light: 2, q_rice: 2, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_quick: 1, q_sushi_mood: 2, q_donburi_mood: 2 },
      'donburi_tekka': { q_cold: 2, q_light: 2, q_rice: 2, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_sushi_mood: 2, q_donburi_mood: 2 },
      'donburi_salmon': { q_cold: 2, q_light: 2, q_rice: 2, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_sushi_mood: 2, q_donburi_mood: 2 },

      // 焼肉・焼き系（8種）
      'yakiniku': { q_warm: 2, q_rich: 1, q_grilled: 2, q_meat: 2, q_beef: 2, q_large: 2, q_share: 2, q_indulgent: 2, q_drink: 2, q_yakiniku_mood: 2 },
      'yakiniku_korean': { q_warm: 2, q_rich: 1, q_spicy: 1, q_grilled: 2, q_meat: 2, q_beef: 2, q_pork: 1, q_garlic: 2, q_large: 2, q_share: 2, q_korean: 2, q_drink: 2, q_yakiniku_mood: 2 },
      'yakitori': { q_warm: 2, q_grilled: 2, q_chicken: 2, q_light_meal: 1, q_share: 1, q_japanese: 2, q_drink: 2 },
      'kushiyaki': { q_warm: 2, q_grilled: 2, q_meat: 2, q_light_meal: 1, q_share: 1, q_japanese: 2, q_drink: 2 },
      'horumon': { q_warm: 2, q_rich: 2, q_grilled: 2, q_meat: 2, q_share: 1, q_japanese: 2, q_indulgent: 1, q_drink: 2, q_yakiniku_mood: 1 },
      'jingisukan': { q_warm: 2, q_grilled: 2, q_meat: 2, q_veggie: 1, q_large: 2, q_share: 2, q_japanese: 2, q_drink: 2, q_yakiniku_mood: 1 },
      'steak': { q_warm: 2, q_rich: 2, q_grilled: 2, q_meat: 2, q_beef: 2, q_large: 2, q_western: 2, q_indulgent: 2, q_yakiniku_mood: 1 },
      'teppanyaki': { q_warm: 2, q_grilled: 2, q_meat: 2, q_beef: 2, q_veggie: 1, q_share: 1, q_japanese: 1, q_indulgent: 2, q_yakiniku_mood: 1 },

      // 揚げ物系（8種）
      'tonkatsu': { q_warm: 2, q_rich: 2, q_fried: 2, q_meat: 2, q_pork: 2, q_large: 1, q_japanese: 2, q_indulgent: 1 },
      'karaage': { q_warm: 2, q_rich: 2, q_fried: 2, q_chicken: 2, q_garlic: 1, q_share: 1, q_japanese: 2, q_quick: 1, q_drink: 1 },
      'tempura': { q_warm: 2, q_fried: 2, q_light: 1, q_fish: 1, q_veggie: 1, q_japanese: 2, q_indulgent: 1 },
      'fry_teishoku': { q_warm: 2, q_rich: 2, q_fried: 2, q_meat: 1, q_fish: 1, q_large: 1, q_japanese: 2 },
      'korokke': { q_warm: 2, q_fried: 2, q_light_meal: 1, q_veggie: 1, q_japanese: 2, q_quick: 1, q_comfort: 2 },
      'kushikatsu': { q_warm: 2, q_rich: 2, q_fried: 2, q_meat: 1, q_veggie: 1, q_share: 2, q_japanese: 2, q_drink: 2 },
      'donburi_ten': { q_warm: 2, q_rich: 2, q_fried: 2, q_rice: 2, q_fish: 1, q_veggie: 1, q_japanese: 2, q_donburi_mood: 2 },
      'donburi_katsu': { q_warm: 2, q_rich: 2, q_fried: 2, q_rice: 2, q_pork: 2, q_egg: 2, q_japanese: 2, q_comfort: 2, q_donburi_mood: 2 },

      // 中華系（12種）
      'gyoza': { q_warm: 2, q_fried: 1, q_meat: 2, q_pork: 2, q_veggie: 1, q_garlic: 2, q_chinese: 2, q_share: 1, q_drink: 2 },
      'mapo_tofu': { q_warm: 2, q_rich: 2, q_spicy: 2, q_very_spicy: 1, q_rice: 2, q_garlic: 1, q_chinese: 2 },
      'tantanmen': { q_warm: 2, q_soupy: 2, q_rich: 2, q_spicy: 2, q_very_spicy: 1, q_noodles: 2, q_meat: 1, q_garlic: 1, q_chinese: 2, q_ramen_mood: 2 },
      'chahan': { q_warm: 2, q_rice: 2, q_egg: 2, q_meat: 1, q_veggie: 1, q_garlic: 1, q_chinese: 2, q_quick: 2 },
      'yakisoba': { q_warm: 2, q_noodles: 2, q_meat: 1, q_veggie: 1, q_chinese: 1, q_japanese: 1, q_quick: 2 },
      'happosai': { q_warm: 2, q_light: 1, q_veggie: 2, q_fish: 1, q_meat: 1, q_chinese: 2, q_healthy: 2 },
      'subuta': { q_warm: 2, q_fried: 1, q_meat: 2, q_pork: 2, q_veggie: 1, q_chinese: 2 },
      'hoikoro': { q_warm: 2, q_rich: 1, q_meat: 2, q_pork: 2, q_veggie: 2, q_garlic: 1, q_chinese: 2 },
      'chinjaorosi': { q_warm: 2, q_light: 1, q_meat: 2, q_beef: 2, q_veggie: 2, q_chinese: 2, q_healthy: 1 },
      'ebi_chili': { q_warm: 2, q_rich: 2, q_spicy: 1, q_fish: 2, q_chinese: 2, q_indulgent: 1 },
      'harumaki': { q_warm: 2, q_fried: 2, q_light_meal: 1, q_veggie: 2, q_chinese: 2, q_share: 1 },
      'xiaolongbao': { q_warm: 2, q_soupy: 1, q_meat: 2, q_pork: 2, q_chinese: 2, q_share: 1, q_indulgent: 1 },

      // パスタ・イタリアン系（11種）
      'pasta_tomato': { q_warm: 2, q_light: 1, q_noodles: 1, q_veggie: 1, q_italian: 2, q_western: 2, q_healthy: 1 },
      'pasta_cream': { q_warm: 2, q_rich: 2, q_noodles: 1, q_cheese: 1, q_italian: 2, q_western: 2, q_indulgent: 2, q_comfort: 2 },
      'pasta_carbonara': { q_warm: 2, q_rich: 2, q_noodles: 1, q_pork: 1, q_egg: 2, q_cheese: 2, q_italian: 2, q_western: 2, q_indulgent: 2 },
      'pasta_peperoncino': { q_warm: 2, q_light: 2, q_spicy: 1, q_noodles: 1, q_garlic: 2, q_italian: 2, q_western: 2, q_quick: 2, q_healthy: 1 },
      'pasta_bolognese': { q_warm: 2, q_rich: 2, q_noodles: 1, q_meat: 2, q_beef: 2, q_italian: 2, q_western: 2, q_large: 1, q_comfort: 2 },
      'pasta_genovese': { q_warm: 2, q_light: 1, q_noodles: 1, q_veggie: 1, q_italian: 2, q_western: 2, q_healthy: 1 },
      'pasta_mentaiko': { q_warm: 2, q_rich: 2, q_spicy: 1, q_noodles: 1, q_fish: 1, q_japanese: 1, q_western: 1, q_indulgent: 1 },
      'pasta_wafu': { q_warm: 2, q_light: 2, q_noodles: 1, q_veggie: 1, q_japanese: 2, q_western: 1, q_healthy: 2 },
      'lasagna': { q_warm: 2, q_rich: 2, q_meat: 1, q_cheese: 2, q_italian: 2, q_western: 2, q_indulgent: 2, q_large: 1, q_comfort: 2 },
      'risotto': { q_warm: 2, q_rich: 2, q_rice: 2, q_cheese: 1, q_italian: 2, q_western: 2, q_indulgent: 2, q_comfort: 2 },
      'pizza': { q_warm: 2, q_rich: 1, q_bread: 2, q_cheese: 2, q_share: 2, q_italian: 2, q_western: 2, q_indulgent: 1 },

      // 丼系（8種）
      'donburi_gyudon': { q_warm: 2, q_rich: 1, q_rice: 2, q_beef: 2, q_japanese: 2, q_quick: 2, q_large: 1, q_comfort: 2, q_donburi_mood: 2 },
      'donburi_butadon': { q_warm: 2, q_rich: 1, q_rice: 2, q_pork: 2, q_japanese: 2, q_quick: 1, q_donburi_mood: 2 },
      'donburi_una': { q_warm: 2, q_rice: 2, q_fish: 2, q_japanese: 2, q_indulgent: 2, q_donburi_mood: 2 },
      'oyakodon': { q_warm: 2, q_rice: 2, q_chicken: 2, q_egg: 2, q_japanese: 2, q_quick: 2, q_comfort: 2, q_donburi_mood: 2 },
      'donburi_chuka': { q_warm: 2, q_soupy: 1, q_rice: 2, q_meat: 1, q_veggie: 2, q_chinese: 2, q_quick: 2, q_donburi_mood: 2 },
      'loco_moco': { q_warm: 2, q_rich: 2, q_rice: 2, q_beef: 2, q_egg: 2, q_western: 2, q_large: 2, q_indulgent: 2, q_donburi_mood: 2 },
      'bibimbap': { q_warm: 2, q_spicy: 1, q_rice: 2, q_beef: 1, q_veggie: 2, q_egg: 2, q_korean: 2, q_healthy: 1, q_donburi_mood: 2 },
      'donburi_soboro': { q_warm: 2, q_rice: 2, q_chicken: 1, q_egg: 2, q_veggie: 1, q_japanese: 2, q_comfort: 2, q_donburi_mood: 2 },

      // 定食系（6種）
      'teishoku_yakizakana': { q_warm: 2, q_light: 2, q_grilled: 2, q_fish: 2, q_japanese: 2, q_healthy: 2 },
      'teishoku_shogayaki': { q_warm: 2, q_rich: 1, q_meat: 2, q_pork: 2, q_japanese: 2, q_large: 1 },
      'teishoku_saba': { q_warm: 2, q_grilled: 2, q_fish: 2, q_japanese: 2, q_healthy: 1 },
      'teishoku_sashimi': { q_cold: 2, q_light: 2, q_fish: 2, q_raw_fish: 2, q_japanese: 2, q_indulgent: 1, q_drink: 1, q_sushi_mood: 1 },
      'teishoku_hamburg': { q_warm: 2, q_rich: 2, q_meat: 2, q_beef: 1, q_japanese: 1, q_western: 1, q_large: 1, q_comfort: 2 },
      'teishoku_tonjiru': { q_warm: 2, q_soupy: 2, q_light: 1, q_pork: 2, q_veggie: 2, q_japanese: 2, q_healthy: 1, q_comfort: 2 },

      // 韓国料理系（6種）
      'korean_samgyeopsal': { q_warm: 2, q_rich: 2, q_grilled: 2, q_pork: 2, q_garlic: 2, q_large: 2, q_share: 2, q_korean: 2, q_indulgent: 2, q_drink: 2, q_yakiniku_mood: 1 },
      'korean_kimchi_jjigae': { q_warm: 2, q_soupy: 2, q_spicy: 2, q_pork: 1, q_veggie: 1, q_korean: 2, q_comfort: 2 },
      'korean_bulgogi': { q_warm: 2, q_grilled: 2, q_meat: 2, q_beef: 2, q_garlic: 1, q_share: 1, q_korean: 2, q_yakiniku_mood: 1 },
      'korean_jjim': { q_warm: 2, q_fried: 1, q_veggie: 2, q_korean: 2, q_share: 1, q_drink: 1 },
      'korean_reimen': { q_cold: 2, q_soupy: 2, q_light: 2, q_spicy: 1, q_noodles: 2, q_korean: 2, q_healthy: 1 },
      'korean_bibimbap': { q_warm: 2, q_spicy: 2, q_rice: 2, q_beef: 1, q_veggie: 2, q_egg: 2, q_korean: 2, q_healthy: 1, q_donburi_mood: 1 },

      // エスニック系（6種）
      'ethnic_pad_thai': { q_warm: 2, q_spicy: 1, q_noodles: 2, q_fish: 1, q_veggie: 1, q_asian: 2, q_quick: 1 },
      'ethnic_tom_yum': { q_warm: 2, q_soupy: 2, q_spicy: 2, q_very_spicy: 1, q_fish: 2, q_veggie: 1, q_asian: 2 },
      'ethnic_pho': { q_warm: 2, q_soupy: 2, q_light: 2, q_noodles: 2, q_beef: 1, q_veggie: 2, q_asian: 2, q_healthy: 2, q_comfort: 2 },
      'ethnic_banh_mi': { q_cold: 1, q_bread: 2, q_spicy: 1, q_pork: 1, q_veggie: 2, q_asian: 2, q_quick: 2, q_healthy: 1 },
      'ethnic_nasi_goreng': { q_warm: 2, q_spicy: 1, q_rice: 2, q_meat: 1, q_veggie: 1, q_egg: 1, q_asian: 2, q_quick: 1 },
      'ethnic_gapao': { q_warm: 2, q_spicy: 2, q_rice: 2, q_chicken: 1, q_veggie: 1, q_egg: 1, q_garlic: 1, q_asian: 2, q_quick: 1 },

      // その他（10種）
      'udon': { q_warm: 2, q_soupy: 2, q_light: 1, q_noodles: 2, q_japanese: 2, q_quick: 2, q_healthy: 1, q_comfort: 2 },
      'soba': { q_cold: 1, q_warm: 1, q_soupy: 1, q_light: 2, q_noodles: 2, q_japanese: 2, q_quick: 2, q_healthy: 2 },
      'hamburger': { q_warm: 2, q_rich: 2, q_bread: 2, q_meat: 2, q_beef: 2, q_veggie: 1, q_western: 2, q_quick: 2, q_large: 1, q_indulgent: 1 },
      'omurice': { q_warm: 2, q_rich: 1, q_rice: 2, q_chicken: 1, q_egg: 2, q_western: 1, q_japanese: 1, q_comfort: 2, q_donburi_mood: 1 },
      'doria': { q_warm: 2, q_rich: 2, q_rice: 2, q_cheese: 2, q_western: 2, q_indulgent: 2, q_comfort: 2 },
      'gratin': { q_warm: 2, q_rich: 2, q_cheese: 2, q_western: 2, q_indulgent: 2, q_comfort: 2 },
      'sandwich': { q_cold: 1, q_light: 1, q_bread: 2, q_meat: 1, q_veggie: 1, q_egg: 1, q_western: 2, q_quick: 2, q_light_meal: 2, q_healthy: 1 },
      'okonomiyaki': { q_warm: 2, q_rich: 2, q_meat: 1, q_veggie: 1, q_share: 1, q_japanese: 2, q_indulgent: 1, q_comfort: 2 },
      'takoyaki': { q_warm: 2, q_fish: 1, q_light_meal: 2, q_share: 2, q_japanese: 2, q_quick: 2, q_comfort: 1 },
      'monjayaki': { q_warm: 2, q_veggie: 1, q_share: 2, q_japanese: 2, q_indulgent: 1, q_comfort: 1 },
    };
    
    const traits = genreTraits[genreId] || {};
    const traitValue = traits[questionId] || 0; // -2 to 2
    
    // 回答値とジャンル特性の一致度を計算（強化版）
    // answerValue と traitValue が近いほど高スコア
    const diff = Math.abs(answerValue - traitValue);
    
    // より強いシグナルを与える
    let likelihood: number;
    if (diff === 0) {
      // 完全一致: 90%
      likelihood = 0.90;
    } else if (diff === 1) {
      // 部分一致: 60%
      likelihood = 0.60;
    } else if (diff === 2) {
      // 中立: 30%
      likelihood = 0.30;
    } else {
      // 逆: 10%
      likelihood = 0.10;
    }
    
    return likelihood;
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
   * Top1の確信度を取得
   */
  getTopConfidence(): number {
    const results = this.getTopResults(1);
    return results.length > 0 ? results[0].probability : 0;
  }

  /**
   * Top1とTop2の確率差を取得
   */
  getTop1Top2Gap(): number {
    const results = this.getTopResults(2);
    if (results.length < 2) return 1.0;
    return results[0].probability - results[1].probability;
  }

  /**
   * 早期終了可能かチェック
   */
  canTerminateEarly(): boolean {
    const topConfidence = this.getTopConfidence();
    const gap = this.getTop1Top2Gap();
    
    // Top1が35%以上、またはTop1とTop2の差が15%以上
    return topConfidence >= INFERENCE_CONFIG.CONFIDENCE_THRESHOLD || gap >= INFERENCE_CONFIG.GAP_THRESHOLD;
  }

  /**
   * Top Nジャンルを取得
   */
  private getTopResults(n: number): GenreResult[] {
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

    // Top Nを返す
    return results.slice(0, n);
  }

  /**
   * Top3ジャンルを計算
   */
  getTop3(): GenreResult[] {
    return this.getTopResults(3);
  }

  /**
   * Top Kジャンルを取得（質問選択用）
   */
  getTopGenres(k: number = 30): Genre[] {
    const results = this.getTopResults(k);
    return results.map(r => r.genre);
  }

  /**
   * 質問の期待情報ゲインを計算
   * Top候補ジャンルでヒューリスティックスコアの分散が大きい質問ほど高スコア
   */
  calculateQuestionScore(question: Question, topGenres: Genre[]): number {
    const scores: number[] = [];

    // 各回答オプションについて、Top候補ジャンルでのスコア分散を計算
    ANSWER_OPTIONS.forEach(option => {
      const genreScores = topGenres.map(genre => {
        return this.getHeuristicScore(genre.id, question.id, option.id);
      });

      // 分散を計算
      const mean = genreScores.reduce((sum, s) => sum + s, 0) / genreScores.length;
      const variance = genreScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / genreScores.length;
      
      scores.push(variance);
    });

    // 全回答オプションの平均分散を返す
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
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
