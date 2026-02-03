const appJson = require('./app.json');
const { IOSConfig, AndroidConfig } = require('@expo/config-plugins');

/**
 * アイコン下の表示名を言語別に設定
 * - 日本語: モグネイター
 * - その他: Mognator
 * デフォルト（app.name）は Mognator にし、ja のときだけ上書きする。
 */
module.exports = () => {
  const config = {
    ...appJson.expo,
    // デフォルト表示名（英語など）は Mognator
    name: 'Mognator',
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        CFBundleAllowMixedLocalizations: true,
      },
    },
    locales: {
      ja: {
        ios: { CFBundleDisplayName: 'モグネイター' },
        android: { app_name: 'モグネイター' },
      },
      en: {
        ios: { CFBundleDisplayName: 'Mognator' },
        android: { app_name: 'Mognator' },
      },
    },
    plugins: [
      ['expo-localization', { supportedLocales: { ios: ['en', 'ja'], android: ['en', 'ja'] } }],
      IOSConfig.Locales.withLocales,
      AndroidConfig.Locales.withLocales,
    ],
  };
  return { expo: config };
};
