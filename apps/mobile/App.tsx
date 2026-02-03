import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from './src/core/i18n';
import HomeScreen from './src/screens/HomeScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import ResultScreen from './src/screens/ResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GenreSearchScreen from './src/screens/GenreSearchScreen';

export type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
  GenreSearch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <I18nProvider>
      <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="GenreSearch" component={GenreSearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </I18nProvider>
  );
}
