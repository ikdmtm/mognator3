import { Question, QuestionAnswer, QUESTION_CONFIG, AnswerId } from '../types/question.types';
import questionsData from '../data/questions.seed.json';

// 矛盾する質問のルール定義
// キー: 質問ID、値: その質問に「はい」と答えたら除外する質問IDリスト
const CONFLICT_RULES: Record<string, string[]> = {
  // 主食系（パン、麺、ご飯は互いに矛盾）
  'q_bread': ['q_noodles', 'q_rice', 'q_ramen_mood', 'q_curry_mood', 'q_sushi_mood', 'q_donburi_mood', 'q_nabe_mood'],
  'q_noodles': ['q_bread', 'q_rice', 'q_sushi_mood', 'q_donburi_mood', 'q_yakiniku_mood'],
  'q_rice': ['q_bread', 'q_noodles', 'q_ramen_mood'],
  
  // 直接的な質問（どれかに「はい」なら他を除外）
  'q_ramen_mood': ['q_curry_mood', 'q_sushi_mood', 'q_yakiniku_mood', 'q_donburi_mood', 'q_nabe_mood', 'q_bread'],
  'q_curry_mood': ['q_ramen_mood', 'q_sushi_mood', 'q_yakiniku_mood', 'q_donburi_mood', 'q_nabe_mood', 'q_bread'],
  'q_sushi_mood': ['q_ramen_mood', 'q_curry_mood', 'q_yakiniku_mood', 'q_nabe_mood', 'q_noodles', 'q_bread', 'q_warm'],
  'q_yakiniku_mood': ['q_ramen_mood', 'q_curry_mood', 'q_sushi_mood', 'q_donburi_mood', 'q_nabe_mood', 'q_noodles', 'q_bread'],
  'q_donburi_mood': ['q_ramen_mood', 'q_yakiniku_mood', 'q_nabe_mood', 'q_noodles', 'q_bread'],
  'q_nabe_mood': ['q_ramen_mood', 'q_curry_mood', 'q_sushi_mood', 'q_yakiniku_mood', 'q_donburi_mood', 'q_bread', 'q_cold', 'q_quick'],
  
  // 温度系
  'q_warm': ['q_cold'],
  'q_cold': ['q_warm', 'q_soupy', 'q_nabe_mood'],
  
  // こってり・さっぱり
  'q_rich': ['q_light', 'q_healthy'],
  'q_light': ['q_rich', 'q_indulgent'],
  
  // 辛さ
  'q_spicy': [],
  'q_very_spicy': [],  // 「激辛OK」は「辛いもの」の後に来るべき
  
  // 料理系統（複数選択可能だが、強い肯定の場合は絞る）
  'q_japanese': ['q_korean', 'q_italian', 'q_asian'],
  'q_korean': ['q_japanese', 'q_italian', 'q_chinese'],
  'q_italian': ['q_japanese', 'q_korean', 'q_chinese', 'q_asian'],
  'q_chinese': ['q_korean', 'q_italian'],
  'q_asian': ['q_japanese', 'q_italian', 'q_western'],
  'q_western': ['q_asian', 'q_korean', 'q_chinese'],
  
  // タンパク質（肉と魚は同時に強く望まない）
  'q_meat': ['q_raw_fish'],
  'q_fish': [],
  'q_raw_fish': ['q_meat', 'q_fried', 'q_grilled', 'q_warm'],
  
  // 気分
  'q_healthy': ['q_rich', 'q_indulgent', 'q_fried'],
  'q_indulgent': ['q_healthy', 'q_light', 'q_light_meal'],
};

/**
 * 質問管理サービス
 */
export class QuestionService {
  private questions: Question[];
  private answeredQuestions: Set<string>;
  private recentGroups: string[];
  private excludedQuestions: Set<string>;

  constructor() {
    this.questions = questionsData as Question[];
    this.answeredQuestions = new Set();
    this.recentGroups = [];
    this.excludedQuestions = new Set();
  }

  /**
   * 利用可能な質問を取得（矛盾する質問を除外）
   */
  getAvailableQuestions(): Question[] {
    return this.questions.filter(q => 
      q.enabled && 
      !this.answeredQuestions.has(q.id) &&
      !this.excludedQuestions.has(q.id)
    );
  }

  /**
   * 回答に基づいて矛盾する質問を除外リストに追加
   */
  private updateExcludedQuestions(questionId: string, answerId: AnswerId): void {
    // 「はい」または「たぶんはい」の場合のみ矛盾ルールを適用
    if (answerId === 'YES' || answerId === 'PROB_YES') {
      const conflictingQuestions = CONFLICT_RULES[questionId] || [];
      conflictingQuestions.forEach(q => this.excludedQuestions.add(q));
    }
  }

  /**
   * 次の質問を選択（矛盾除外 + 情報ゲインベース + グループ連発抑制）
   */
  getNextQuestion(
    answers: QuestionAnswer[],
    inferenceEngine?: { getTopGenres(k: number): any[]; calculateQuestionScore(q: Question, genres: any[]): number }
  ): Question | null {
    // 最新の回答に基づいて除外リストを更新
    if (answers.length > 0) {
      const lastAnswer = answers[answers.length - 1];
      this.updateExcludedQuestions(lastAnswer.questionId, lastAnswer.answerId as AnswerId);
    }

    const available = this.getAvailableQuestions();
    
    if (available.length === 0) {
      return null;
    }

    // 直近のグループを更新
    this.updateRecentGroups(answers);

    // 最近使われていないグループの質問を優先
    const preferredQuestions = available.filter(
      q => !this.recentGroups.includes(q.group)
    );

    const candidates = preferredQuestions.length > 0 ? preferredQuestions : available;
    
    // 情報ゲインによる質問選択
    if (inferenceEngine && answers.length > 0) {
      const topGenres = inferenceEngine.getTopGenres(30);
      
      // 各質問の情報ゲインスコアを計算
      const scoredQuestions = candidates.map(q => ({
        question: q,
        score: inferenceEngine.calculateQuestionScore(q, topGenres),
      }));

      // スコアが高い順にソート
      scoredQuestions.sort((a, b) => b.score - a.score);

      // 上位3つからランダムに選択（多様性を保つ）
      const top3 = scoredQuestions.slice(0, Math.min(3, scoredQuestions.length));
      const selected = top3[Math.floor(Math.random() * top3.length)];
      
      return selected.question;
    }
    
    // 初回またはinferenceEngineがない場合はランダム
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * 質問を回答済みとしてマーク
   */
  markAsAnswered(questionId: string): void {
    this.answeredQuestions.add(questionId);
  }

  /**
   * 質問の回答を取り消し
   */
  unmarkQuestion(questionId: string): void {
    this.answeredQuestions.delete(questionId);
  }

  /**
   * 直近のグループ履歴を更新
   */
  private updateRecentGroups(answers: QuestionAnswer[]): void {
    const recentAnswers = answers.slice(-QUESTION_CONFIG.RECENT_GROUP_AVOID);
    this.recentGroups = recentAnswers
      .map(a => {
        const q = this.questions.find(q => q.id === a.questionId);
        return q?.group;
      })
      .filter((g): g is string => g !== undefined);
  }

  /**
   * セッションをリセット
   */
  reset(): void {
    this.answeredQuestions.clear();
    this.recentGroups = [];
    this.excludedQuestions.clear();
  }

  /**
   * 質問IDから質問を取得
   */
  getQuestionById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * セッション継続の判定
   */
  shouldContinue(answerCount: number): boolean {
    return answerCount < QUESTION_CONFIG.MAX_QUESTIONS;
  }
}

// シングルトンインスタンス
export const questionService = new QuestionService();
