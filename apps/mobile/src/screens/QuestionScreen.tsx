import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Question'>;
};

const DUMMY_QUESTIONS = [
  '温かい料理がいい？',
  '汁ものが欲しい？',
  'こってり・脂っこい方がいい？',
  '辛い・スパイスが欲しい？',
  '今日はご飯ものがいい？',
];

const MAX_QUESTIONS = 12;

const ANSWER_OPTIONS = [
  { label: 'はい', value: 'YES' },
  { label: 'たぶんはい', value: 'PROB_YES' },
  { label: 'わからない', value: 'UNKNOWN' },
  { label: 'たぶんいいえ', value: 'PROB_NO' },
  { label: 'いいえ', value: 'NO' },
];

export default function QuestionScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const currentQuestion = DUMMY_QUESTIONS[currentIndex % DUMMY_QUESTIONS.length];
  const progress = `${currentIndex + 1}/${MAX_QUESTIONS}`;

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentIndex + 1 >= MAX_QUESTIONS) {
      // 最後の質問
      navigation.navigate('Result');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const handleCancel = () => {
    Alert.alert(
      '中断',
      '質問を中断してホームに戻りますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '中断する',
          style: 'destructive',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progress}>{progress}</Text>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>中断</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion}</Text>
      </View>

      <View style={styles.answersContainer}>
        {ANSWER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.answerButton}
            onPress={() => handleAnswer(option.value)}
          >
            <Text style={styles.answerText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentIndex > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  progress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 20,
  },
  answerButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  answerText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
