/**
 * 回答の選択肢ID
 */
export type AnswerId = 'YES' | 'PROB_YES' | 'UNKNOWN' | 'PROB_NO' | 'NO';

/**
 * 回答の選択肢
 */
export interface AnswerOption {
  id: AnswerId;
  label: string;
  value: number; // 内部スコアリング用（-2 to 2）
}

/**
 * 質問グループ
 */
export type QuestionGroup = 
  | 'temperature'
  | 'soupiness'
  | 'richness'
  | 'spice_level'
  | 'staple'
  | 'texture'
  | 'flavor'
  | 'portion';

/**
 * 質問データ
 */
export interface Question {
  id: string;
  text: string;
  group: QuestionGroup;
  enabled: boolean;
}

/**
 * セッション内の回答記録
 */
export interface QuestionAnswer {
  questionId: string;
  answerId: AnswerId;
  timestamp: number;
}

/**
 * 質問セッションの設定
 */
export const QUESTION_CONFIG = {
  MAX_QUESTIONS: 12,
  CONFIDENCE_THRESHOLD: 0.65,
  RECENT_GROUP_AVOID: 2, // 直近N問で同じグループを避ける
} as const;

/**
 * 回答選択肢の定義
 */
export const ANSWER_OPTIONS: AnswerOption[] = [
  { id: 'YES', label: 'はい', value: 2 },
  { id: 'PROB_YES', label: 'たぶんはい', value: 1 },
  { id: 'UNKNOWN', label: 'わからない', value: 0 },
  { id: 'PROB_NO', label: 'たぶんいいえ', value: -1 },
  { id: 'NO', label: 'いいえ', value: -2 },
];
