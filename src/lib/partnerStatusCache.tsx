import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { Platform } from 'react-native';
import { SignalColor } from '../theme/colors';
import { PartnerStatusWidget } from '../widgets/PartnerStatusWidget';

const STORAGE_KEY = 'partnerStatus';

export interface PartnerStatus {
  nickname: string;
  color: SignalColor;
  caption: string;
  updatedAt: number;
}

export async function savePartnerStatus(status: PartnerStatus) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  if (Platform.OS !== 'android') return;
  await requestWidgetUpdate({
    widgetName: 'PartnerStatus',
    renderWidget: () => <PartnerStatusWidget status={status} />,
  });
}

export async function loadPartnerStatus(): Promise<PartnerStatus | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PartnerStatus;
  } catch {
    return null;
  }
}

export async function clearPartnerStatus() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  if (Platform.OS !== 'android') return;
  await requestWidgetUpdate({
    widgetName: 'PartnerStatus',
    renderWidget: () => <PartnerStatusWidget status={null} />,
  });
}
