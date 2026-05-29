const path = require('node:path');
const dotenv = require('dotenv');
const staticConfig = require('./app.json');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

module.exports = ({ config }) => {
  const expo = {
    ...staticConfig.expo,
    ...config,
  };
  const androidGoogleMapsApiKey = (
    process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    ''
  ).trim();

  return {
    ...expo,
    extra: {
      ...(expo.extra ?? {}),
      hasAndroidGoogleMapsApiKey: Boolean(androidGoogleMapsApiKey),
    },
    plugins: [
      ...(expo.plugins ?? []),
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey,
        },
      ],
    ],
  };
};
