import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import type { ScoredRoute } from '@walking-app/shared';

export async function openExternalUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error('No app is available to open this link.');
  await Linking.openURL(url);
}

export async function shareGpx(route: ScoredRoute) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('File sharing is not available on this device.');

  const file = new File(Paths.cache, `${route.id}.gpx`);
  if (file.exists) file.delete();
  file.create();
  file.write(route.exportLinks.gpx);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/gpx+xml',
    dialogTitle: `Share ${route.label}`,
    UTI: 'public.xml',
  });
}
