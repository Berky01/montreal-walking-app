jest.mock('@react-native-async-storage/async-storage', () => (
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = ({ name }: { name?: string }) => React.createElement(Text, null, name ?? 'icon');
  MockIcon.glyphMap = {};
  return { Ionicons: MockIcon };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(View, props, children);
  MockMap.Marker = (props: object) => React.createElement(View, props);
  MockMap.Polyline = (props: object) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMap.Marker,
    Polyline: MockMap.Polyline,
  };
});
