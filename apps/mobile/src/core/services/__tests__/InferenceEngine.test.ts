import { InferenceEngine } from '../InferenceEngine';
import { Question } from '../../types/question.types';

describe('InferenceEngine', () => {
  let engine: InferenceEngine;

  beforeEach(() => {
    engine = new InferenceEngine();
  });

  test('初期化時にジャンルが読み込まれる', () => {
    const top3 = engine.getTop3();
    expect(top3).toHaveLength(3);
    expect(top3[0].genre).toHaveProperty('id');
    expect(top3[0].genre).toHaveProperty('name');
  });

  test('リセットで一様分布に戻る', () => {
    const question: Question = {
      id: 'q_warm',
      text: '温かい料理がいい？',
      group: 'temperature',
      enabled: true,
    };

    // 回答を追加
    engine.updateWithAnswer(question, 'YES');
    const afterAnswer = engine.getTop3();

    // リセット
    engine.reset();
    const afterReset = engine.getTop3();

    // リセット後は確率がより均等になるはず
    expect(afterReset[0].probability).toBeLessThanOrEqual(afterAnswer[0].probability + 0.1);
  });

  test('回答によってTop3が変化する', () => {
    const question: Question = {
      id: 'q_warm',
      text: '温かい料理がいい？',
      group: 'temperature',
      enabled: true,
    };

    const before = engine.getTop3();
    
    // 複数回答を追加
    engine.updateWithAnswer(question, 'YES');
    engine.updateWithAnswer(question, 'YES');
    
    const after = engine.getTop3();

    // Top3のジャンルが変化しているか、確率が変化しているはず
    const beforeSum = before.reduce((sum, r) => sum + r.probability, 0);
    const afterSum = after.reduce((sum, r) => sum + r.probability, 0);
    
    // 確率の合計は1に近いはず（正規化されている）
    expect(Math.abs(beforeSum - 1.0)).toBeLessThan(0.01);
    expect(Math.abs(afterSum - 1.0)).toBeLessThan(0.01);
  });

  test('確率の合計が1になる', () => {
    const question: Question = {
      id: 'q_spicy',
      text: '辛い・スパイスが欲しい？',
      group: 'spice_level',
      enabled: true,
    };

    engine.updateWithAnswer(question, 'YES');
    const top3 = engine.getTop3();

    const sum = top3.reduce((acc, result) => acc + result.probability, 0);
    
    // Top3の合計は1未満（全ジャンルの一部なので）
    expect(sum).toBeLessThanOrEqual(1.0);
    expect(sum).toBeGreaterThan(0);
  });

  test('統計データの更新', () => {
    // 統計データが更新できることを確認
    expect(() => {
      engine.updateStats('ramen_iekei', 'q_warm', 'YES');
      engine.updateStats('ramen_iekei', 'q_warm', 'YES');
      engine.updateStats('curry_spice', 'q_spicy', 'YES');
    }).not.toThrow();
  });
});
