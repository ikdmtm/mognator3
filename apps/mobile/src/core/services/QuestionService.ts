import { Question, QuestionAnswer, QUESTION_CONFIG } from '../types/question.types';
import questionsData from '../data/questions.seed.json';

/**
 * 質問管理サービス
 */
export class QuestionService {
  private questions: Question[];
  private answeredQuestions: Set<string>;
  private recentGroups: string[];

  constructor() {
    this.questions = questionsData as Question[];
    this.answeredQuestions = new Set();
    this.recentGroups = [];
  }

  /**
   * 利用可能な質問を取得
   */
  getAvailableQuestions(): Question[] {
    return this.questions.filter(q => q.enabled && !this.answeredQuestions.has(q.id));
  }

  /**
   * 次の質問を選択（情報ゲインベース + グループ連発抑制）
   */
  getNextQuestion(
    answers: QuestionAnswer[],
    inferenceEngine?: { getTopGenres(k: number): any[]; calculateQuestionScore(q: Question, genres: any[]): number }
  ): Question | null {
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
