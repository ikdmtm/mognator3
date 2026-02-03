import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useI18n } from '../core/i18n';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
  GenreSearch: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Question')}
          >
            <Text style={styles.buttonText}>{t('home.answerQuestions')}</Text>
            <Text style={styles.buttonSubtext}>{t('home.answerQuestionsSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('GenreSearch')}
          >
            <Text style={styles.secondaryButtonText}>{t('home.searchByGenre')}</Text>
            <Text style={styles.secondaryButtonSubtext}>{t('home.searchByGenreSub')}</Text>
          </TouchableOpacity>

          <Text style={styles.algorithmNote}>{t('home.algorithmNote')}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>{t('home.settings')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    color: '#666',
    fontSize: 12,
    opacity: 0.9,
  },
  algorithmNote: {
    marginTop: 20,
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 32,
  },
  settingsButtonText: {
    color: '#FF6B35',
    fontSize: 16,
  },
});
