import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>モグネイター</Text>
      <Text style={styles.subtitle}>
        質問に答えて、今の気分にあった食事を見つけましょう
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Question')}
      >
        <Text style={styles.buttonText}>はじめる</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>設定</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  },
  settingsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  settingsButtonText: {
    color: '#FF6B35',
    fontSize: 16,
  },
});
