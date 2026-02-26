import 'dotenv/config';

const appJson = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

if (!googleMapsApiKey) {
  // eslint-disable-next-line no-console
  console.warn('[ENV] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing. Create qunarly-mobile/.env');
}

export default {
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    bundleIdentifier: appJson.expo.ios?.bundleIdentifier ?? 'com.qunarly.mobile',
    config: {
      ...(appJson.expo.ios?.config ?? {}),
      googleMapsApiKey,
    },
    infoPlist: {
      ...(appJson.expo.ios?.infoPlist ?? {}),
      NSLocationAlwaysAndWhenInUseUsageDescription:
        appJson.expo.ios?.infoPlist?.NSLocationAlwaysAndWhenInUseUsageDescription ??
        'Картада орналасуды көрсету үшін локация қажет.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...appJson.expo.android,
    package: appJson.expo.android?.package ?? 'com.qunarly.mobile',
    config: {
      ...(appJson.expo.android?.config ?? {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  plugins: [...(appJson.expo.plugins ?? []), 'expo-camera'],
  extra: {
    ...(appJson.expo.extra ?? {}),
    googleMapsApiKey,
    eas: {
      projectId: 'cf3907b9-0739-4961-a905-18e0d4a53c31',
    },
  },
};
