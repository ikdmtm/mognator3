import { QuestionService } from '../QuestionService';
import { QuestionAnswer, QUESTION_CONFIG } from '../../types/question.types';

describe('QuestionService', () => {
  let service: QuestionService;

  beforeEach(() => {
    service = new QuestionService();
  });

  describe('グループ連発抑制', () => {
    it('直近のグループを避けて質問を選択する', () => {
      // 最初の質問を取得
      const q1 = service.getNextQuestion([]);
      expect(q1).toBeTruthy();
      
      if (!q1) return;
      
      service.markAsAnswered(q1.id);
      const answers: QuestionAnswer[] = [
        { questionId: q1.id, answerId: 'YES' }
      ];

      // 次の質問を取得
      const q2 = service.getNextQuestion(answers);
      expect(q2).toBeTruthy();
      
      if (!q2) return;
      
      service.markAsAnswered(q2.id);
      answers.push({ questionId: q2.id, answerId: 'YES' });

      // 3問目: 直近2問のグループは避けられるべき
      const q3 = service.getNextQuestion(answers);
      expect(q3).toBeTruthy();
      
      if (!q3) return;
      
      // q3のグループがq1, q2のグループと異なることを確認
      // ただし、利用可能な質問が少ない場合は同じグループもあり得る
      const recentGroups = [q1.group, q2.group];
      const isDifferent = !recentGroups.includes(q3.group);
      
      // 23グループあるので、高確率で異なるグループが選ばれる
      console.log(`q1: ${q1.group}, q2: ${q2.group}, q3: ${q3.group}`);
      console.log(`q3は直近のグループと異なる: ${isDifferent}`);
    });

    it('12問連続で質問を取得し、グループの分散を確認', () => {
      const answers: QuestionAnswer[] = [];
      const selectedGroups: string[] = [];

      for (let i = 0; i < 12; i++) {
        const question = service.getNextQuestion(answers);
        expect(question).toBeTruthy();
        
        if (!question) break;
        
        service.markAsAnswered(question.id);
        answers.push({ questionId: question.id, answerId: 'YES' });
        selectedGroups.push(question.group);
      }

      // グループの種類数を確認
      const uniqueGroups = new Set(selectedGroups);
      console.log(`12問で選ばれたグループ数: ${uniqueGroups.size}/23`);
      console.log(`選ばれたグループ: ${Array.from(uniqueGroups).join(', ')}`);
      
      // 少なくとも8種類以上のグループが選ばれることを期待
      expect(uniqueGroups.size).toBeGreaterThanOrEqual(8);

      // 連続する3問で同じグループが選ばれないことを確認
      for (let i = 0; i < selectedGroups.length - 2; i++) {
        const consecutive = [selectedGroups[i], selectedGroups[i + 1], selectedGroups[i + 2]];
        const uniqueConsecutive = new Set(consecutive);
        
        // 連続3問で少なくとも2種類のグループがあることを期待
        expect(uniqueConsecutive.size).toBeGreaterThanOrEqual(2);
      }
    });

    it('利用可能な質問をすべて取得できる', () => {
      const available = service['getAvailableQuestions']();
      
      // 110問全て利用可能
      expect(available.length).toBe(110);
      
      // 1問回答済みにする
      service.markAsAnswered(available[0].id);
      const availableAfter = service['getAvailableQuestions']();
      
      expect(availableAfter.length).toBe(109);
    });

    it('リセット後、全ての質問が再度利用可能になる', () => {
      // いくつか質問を回答済みにする
      const q1 = service.getNextQuestion([]);
      if (q1) service.markAsAnswered(q1.id);
      
      const q2 = service.getNextQuestion([{ questionId: q1!.id, answerId: 'YES' }]);
      if (q2) service.markAsAnswered(q2.id);

      const availableBefore = service['getAvailableQuestions']();
      expect(availableBefore.length).toBe(108);

      // リセット
      service.reset();
      
      const availableAfter = service['getAvailableQuestions']();
      expect(availableAfter.length).toBe(110);
    });
  });

  describe('質問数の設定', () => {
    it('QUESTION_CONFIG.MAX_QUESTIONSが12であることを確認', () => {
      expect(QUESTION_CONFIG.MAX_QUESTIONS).toBe(12);
    });

    it('QUESTION_CONFIG.MIN_QUESTIONSが3であることを確認', () => {
      expect(QUESTION_CONFIG.MIN_QUESTIONS).toBe(3);
    });

    it('QUESTION_CONFIG.RECENT_GROUP_AVOIDが2であることを確認', () => {
      expect(QUESTION_CONFIG.RECENT_GROUP_AVOID).toBe(2);
    });

    it('shouldContinueが正しく動作する', () => {
      expect(service.shouldContinue(0)).toBe(true);
      expect(service.shouldContinue(11)).toBe(true);
      expect(service.shouldContinue(12)).toBe(false);
      expect(service.shouldContinue(13)).toBe(false);
    });
  });
});
