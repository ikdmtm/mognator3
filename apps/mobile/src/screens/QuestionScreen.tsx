import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { questionService } from '../core/services/QuestionService';
import { inferenceEngine } from '../core/services/InferenceEngine';
import { 
  Question, 
  QuestionAnswer, 
  ANSWER_OPTIONS, 
  ANSWER_LABEL_KEYS,
  AnswerId,
  QUESTION_CONFIG 
} from '../core/types/question.types';
import { useI18n } from '../core/i18n';

type RootStackParamList = {
  Home: undefined;
  Question: { answers?: QuestionAnswer[] };
  Result: { answers: QuestionAnswer[] };
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Question'>;
};

export default function QuestionScreen({ navigation }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [fadeAnim] = useState(new Animated.Value(1));

  // 初期化と次の質問のロード
  useEffect(() => {
    // セッション開始時にリセット
    questionService.reset();
    inferenceEngine.reset();
    setAnswers([]);
    loadNextQuestion();
    
    return () => {
      // クリーンアップ
      questionService.reset();
      inferenceEngine.reset();
    };
  }, []);

  const loadNextQuestion = (currentAnswers: QuestionAnswer[] = answers) => {
    // 情報ゲインを使った質問選択（inferenceEngineを渡す）
    const nextQuestion = questionService.getNextQuestion(currentAnswers, inferenceEngine);
    
    if (!nextQuestion) {
      // 質問がなくなった場合も結果へ
      navigation.navigate('Result', { answers: currentAnswers });
      return;
    }

    setCurrentQuestion(nextQuestion);
  };

  const handleAnswer = (answerId: AnswerId) => {
    if (!currentQuestion) return;

    // フェードアウトアニメーション
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // 回答を記録
      const newAnswer: QuestionAnswer = {
        questionId: currentQuestion.id,
        answerId,
        timestamp: Date.now(),
      };
      
      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);
      questionService.markAsAnswered(currentQuestion.id);
      
      // 推論エンジンを更新
      inferenceEngine.updateWithAnswer(currentQuestion, answerId);

      // 継続判定
      const shouldContinue = questionService.shouldContinue(newAnswers.length);
      const canTerminate = newAnswers.length >= QUESTION_CONFIG.MIN_QUESTIONS && 
                          inferenceEngine.canTerminateEarly();
      
      if (!shouldContinue || canTerminate) {
        navigation.navigate('Result', { answers: newAnswers });
        return;
      }

      // 次の質問へ（最新のanswersを渡す）
      loadNextQuestion(newAnswers);
      
      // フェードイン
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleBack = () => {
    if (answers.length === 0) return;

    // 最後の回答を取り消し
    const lastAnswer = answers[answers.length - 1];
    questionService.unmarkQuestion(lastAnswer.questionId);
    
    const newAnswers = answers.slice(0, -1);
    setAnswers(newAnswers);

    // 前の質問に戻る
    const previousQuestion = questionService.getQuestionById(lastAnswer.questionId);
    if (previousQuestion) {
      setCurrentQuestion(previousQuestion);
    }
  };

  const { t, locale } = useI18n();

  const handleCancel = () => {
    Alert.alert(
      t('question.cancelConfirmTitle'),
      t('question.cancelConfirmMessage'),
      [
        { text: t('question.cancelButton'), style: 'cancel' },
        {
          text: t('question.cancelConfirm'),
          style: 'destructive',
          onPress: () => {
            questionService.reset();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text>{t('question.loading')}</Text>
      </View>
    );
  }

  const progress = `${answers.length + 1}/${QUESTION_CONFIG.MAX_QUESTIONS}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progress}>{progress}</Text>
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.cancelText}>{t('question.cancel')}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {locale === 'en' && (currentQuestion as Question & { textEn?: string }).textEn
              ? (currentQuestion as Question & { textEn?: string }).textEn!
              : currentQuestion.text}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.answersContainer}>
        {ANSWER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.answerButton}
            onPress={() => handleAnswer(option.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.answerText}>{t(ANSWER_LABEL_KEYS[option.id])}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {answers.length > 0 && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>{t('question.back')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  progress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#F8F9FA',
    padding: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    lineHeight: 40,
  },
  answersContainer: {
    gap: 12,
    marginBottom: 12,
  },
  answerButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  answerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '500',
  },
});
