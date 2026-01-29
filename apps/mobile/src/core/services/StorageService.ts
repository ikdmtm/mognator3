import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionAnswer } from '../types/question.types';
import { ScoringSettings, DEFAULT_SCORING_SETTINGS } from '../types/scoring.types';

/**
 * 学習履歴の記録
 */
interface LearningRecord {
  id?: number;
  genreId: string;
  questionId: string;
  answerId: string;
  timestamp: number;
}

/**
 * ストレージサービス（SQLite）
 * 学習データを端末内に保存
 */
export class StorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * データベースの初期化
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mognator.db');
      
      // テーブル作成
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS learning_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          genre_id TEXT NOT NULL,
          question_id TEXT NOT NULL,
          answer_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_genre_question 
        ON learning_records(genre_id, question_id);
      `);
      
      console.log('データベース初期化完了');
    } catch (error) {
      console.error('データベース初期化エラー:', error);
      throw error;
    }
  }

  /**
   * 学習データを保存
   * セッション中の回答をすべて記録
   */
  async saveLearningData(
    genreId: string,
    answers: QuestionAnswer[]
  ): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const timestamp = Date.now();
      
      // トランザクションで一括挿入
      for (const answer of answers) {
        await this.db!.runAsync(
          'INSERT INTO learning_records (genre_id, question_id, answer_id, timestamp) VALUES (?, ?, ?, ?)',
          [genreId, answer.questionId, answer.answerId, timestamp]
        );
      }
      
      console.log(`学習データ保存完了: ${genreId}, ${answers.length}件`);
    } catch (error) {
      console.error('学習データ保存エラー:', error);
      throw error;
    }
  }

  /**
   * 統計データを取得
   * stats[genreId][questionId][answerId] = count
   */
  async getStats(): Promise<Record<string, Record<string, Record<string, number>>>> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const rows = await this.db!.getAllAsync<{
        genre_id: string;
        question_id: string;
        answer_id: string;
        count: number;
      }>(
        `SELECT 
          genre_id, 
          question_id, 
          answer_id, 
          COUNT(*) as count 
        FROM learning_records 
        GROUP BY genre_id, question_id, answer_id`
      );

      const stats: Record<string, Record<string, Record<string, number>>> = {};
      
      for (const row of rows) {
        if (!stats[row.genre_id]) {
          stats[row.genre_id] = {};
        }
        if (!stats[row.genre_id][row.question_id]) {
          stats[row.genre_id][row.question_id] = {};
        }
        stats[row.genre_id][row.question_id][row.answer_id] = row.count;
      }

      return stats;
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      return {};
    }
  }

  /**
   * 学習データをリセット
   */
  async resetLearningData(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.execAsync('DELETE FROM learning_records');
      console.log('学習データリセット完了');
    } catch (error) {
      console.error('学習データリセットエラー:', error);
      throw error;
    }
  }

  /**
   * 学習レコード数を取得
   */
  async getRecordCount(): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM learning_records'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('レコード数取得エラー:', error);
      return 0;
    }
  }

  /**
   * スコアリング設定を保存
   */
  async saveScoringSettings(settings: ScoringSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('scoring_settings', JSON.stringify(settings));
      console.log('スコアリング設定保存完了');
    } catch (error) {
      console.error('スコアリング設定保存エラー:', error);
      throw error;
    }
  }

  /**
   * スコアリング設定を取得
   */
  async getScoringSettings(): Promise<ScoringSettings> {
    try {
      const data = await AsyncStorage.getItem('scoring_settings');
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_SCORING_SETTINGS;
    } catch (error) {
      console.error('スコアリング設定取得エラー:', error);
      return DEFAULT_SCORING_SETTINGS;
    }
  }
}

// シングルトンインスタンス
export const storageService = new StorageService();
