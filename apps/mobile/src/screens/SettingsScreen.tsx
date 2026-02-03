import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storageService } from '../core/services/StorageService';
import { ScoringSettings, DEFAULT_SCORING_SETTINGS } from '../core/types/scoring.types';
import { useI18n } from '../core/i18n';

type RootStackParamList = {
  Home: undefined;
  Question: undefined;
  Result: undefined;
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const { t, locale, setLocale } = useI18n();
  const [recordCount, setRecordCount] = useState(0);
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(DEFAULT_SCORING_SETTINGS);

  useEffect(() => {
    loadRecordCount();
    loadScoringSettings();
  }, []);

  const loadRecordCount = async () => {
    const count = await storageService.getRecordCount();
    setRecordCount(count);
  };

  const loadScoringSettings = async () => {
    const settings = await storageService.getScoringSettings();
    setScoringSettings(settings);
  };

  const handleResetLearning = () => {
    Alert.alert(
      t('settings.resetLearningConfirmTitle'),
      t('settings.resetLearningConfirmMessage'),
      [
        { text: t('question.cancelButton'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.resetLearningData();
              await loadRecordCount();
              Alert.alert(t('settings.done'), t('settings.resetLearningDone'));
            } catch (error) {
              Alert.alert(t('error.generic'), t('settings.resetLearningFailed'));
            }
          },
        },
      ]
    );
  };

  const handlePriceLevelChange = async (priceLevel: 'INEXPENSIVE' | 'MODERATE' | 'EXPENSIVE' | 'ANY') => {
    const newSettings = { ...scoringSettings, preferredPriceLevel: priceLevel };
    setScoringSettings(newSettings);
    await storageService.saveScoringSettings(newSettings);
  };

  const handleWeightChange = async (
    key: 'rating' | 'reviewCount' | 'openNow' | 'distance' | 'priceLevel',
    delta: number
  ) => {
    const currentWeight = scoringSettings.weights[key];
    let newWeight = Math.max(0, Math.min(1, currentWeight + delta));
    
    // 小数点第2位で丸める
    newWeight = Math.round(newWeight * 100) / 100;
    
    const newSettings = {
      ...scoringSettings,
      weights: {
        ...scoringSettings.weights,
        [key]: newWeight,
      },
    };
    
    setScoringSettings(newSettings);
    await storageService.saveScoringSettings(newSettings);
  };

  const handleResetScoring = async () => {
    Alert.alert(
      t('settings.resetScoringConfirmTitle'),
      t('settings.resetScoringConfirmMessage'),
      [
        { text: t('question.cancelButton'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            setScoringSettings(DEFAULT_SCORING_SETTINGS);
            await storageService.saveScoringSettings(DEFAULT_SCORING_SETTINGS);
            Alert.alert(t('settings.done'), t('settings.resetScoringDone'));
          },
        },
      ]
    );
  };

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t('error.generic'), t('settings.linkOpenFailed'));
    }
  };

  const priceLevelOptions = [
    { value: 'ANY', label: t('settings.priceAny') },
    { value: 'INEXPENSIVE', label: t('settings.priceInexpensive') },
    { value: 'MODERATE', label: t('settings.priceModerate') },
    { value: 'EXPENSIVE', label: t('settings.priceExpensive') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.languageTitle')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.optionButton, locale === 'ja' && styles.optionButtonActive]}
                onPress={() => setLocale('ja')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    locale === 'ja' && styles.optionButtonTextActive,
                  ]}
                >
                  {t('settings.languageJa')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, locale === 'en' && styles.optionButtonActive]}
                onPress={() => setLocale('en')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    locale === 'en' && styles.optionButtonTextActive,
                  ]}
                >
                  {t('settings.languageEn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.scoringTitle')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.scoringDescription')}</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.preferredPrice')}</Text>
            <View style={styles.buttonGroup}>
              {priceLevelOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    scoringSettings.preferredPriceLevel === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => handlePriceLevelChange(option.value as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      scoringSettings.preferredPriceLevel === option.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.weightTotalHeader}>
              <Text style={styles.settingText}>{t('settings.weightAdjust')}</Text>
              <Text style={styles.weightTotal}>
                {t('settings.weightTotal')}: {((scoringSettings.weights.rating + 
                         scoringSettings.weights.reviewCount + 
                         scoringSettings.weights.openNow + 
                         scoringSettings.weights.distance + 
                         scoringSettings.weights.priceLevel) * 100).toFixed(0)}%
              </Text>
            </View>
            <Text style={styles.settingDescription}>{t('settings.weightDescription')}</Text>
          </View>

          <View style={styles.weightItem}>
            <View style={styles.weightHeader}>
              <Text style={styles.weightLabel}>{t('settings.rating')}</Text>
              <Text style={styles.weightValue}>
                {(scoringSettings.weights.rating * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('rating', -0.05)}
              >
                <Text style={styles.weightButtonText}>-5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('rating', 0.05)}
              >
                <Text style={styles.weightButtonText}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weightItem}>
            <View style={styles.weightHeader}>
              <Text style={styles.weightLabel}>{t('settings.reviewCount')}</Text>
              <Text style={styles.weightValue}>
                {(scoringSettings.weights.reviewCount * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('reviewCount', -0.05)}
              >
                <Text style={styles.weightButtonText}>-5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('reviewCount', 0.05)}
              >
                <Text style={styles.weightButtonText}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 営業中 */}
          <View style={styles.weightItem}>
            <View style={styles.weightHeader}>
              <Text style={styles.weightLabel}>営業中</Text>
              <Text style={styles.weightValue}>
                {(scoringSettings.weights.openNow * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('openNow', -0.05)}
              >
                <Text style={styles.weightButtonText}>-5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('openNow', 0.05)}
              >
                <Text style={styles.weightButtonText}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weightItem}>
            <View style={styles.weightHeader}>
              <Text style={styles.weightLabel}>{t('settings.distance')}</Text>
              <Text style={styles.weightValue}>
                {(scoringSettings.weights.distance * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('distance', -0.05)}
              >
                <Text style={styles.weightButtonText}>-5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('distance', 0.05)}
              >
                <Text style={styles.weightButtonText}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weightItem}>
            <View style={styles.weightHeader}>
              <Text style={styles.weightLabel}>{t('settings.priceLevelFit')}</Text>
              <Text style={styles.weightValue}>
                {(scoringSettings.weights.priceLevel * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('priceLevel', -0.05)}
              >
                <Text style={styles.weightButtonText}>-5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => handleWeightChange('priceLevel', 0.05)}
              >
                <Text style={styles.weightButtonText}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetScoring}
          >
            <Text style={styles.settingText}>{t('settings.resetScoring')}</Text>
            <Text style={styles.settingDescription}>{t('settings.resetScoringToDefault')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataManagement')}</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.learningRecords')}</Text>
            <Text style={styles.settingValue}>{t('settings.recordsCount', { count: String(recordCount) })}</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetLearning}
          >
            <Text style={[styles.settingText, styles.dangerText]}>
              {t('settings.resetLearning')}
            </Text>
            <Text style={styles.settingDescription}>{t('settings.resetLearningDescription')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('settings.version')}</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.linksContainer}>
            <TouchableOpacity 
              onPress={() => handleOpenLink('https://ikdmtm.github.io/mognator-docs/privacy.html')}
            >
              <Text style={styles.linkText}>{t('settings.privacyPolicy')}</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>・</Text>
            <TouchableOpacity 
              onPress={() => handleOpenLink('https://ikdmtm.github.io/mognator-docs/support.html')}
            >
              <Text style={styles.linkText}>{t('settings.support')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.backButtonText}>{t('settings.backHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  settingItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  dangerText: {
    color: '#FF3B30',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  weightTotalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weightTotal: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  weightItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weightLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  weightValue: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  weightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  weightButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  weightButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  settingValue: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  backButton: {
    margin: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 12,
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 8,
  },
});
