import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { Platform } from 'react-native';
import { SignalColor } from '../theme/colors';
import { PartnerStatusWidget } from '../widgets/PartnerStatusWidget';

const PARTNERS_KEY = 'partnerStatuses';
const MY_STATUS_KEY = 'myStatus';

export interface PartnerStatus {
  uid: string;
  nickname: string;
  color: SignalColor;
  caption: string;
  updatedAt: number;
}

async function readPartners(): Promise<PartnerStatus[]> {
  const raw = await AsyncStorage.getItem(PARTNERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PartnerStatus[];
  } catch {
    return [];
  }
}

async function readMyStatus(): Promise<PartnerStatus | null> {
  const raw = await AsyncStorage.getItem(MY_STATUS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PartnerStatus;
  } catch {
    return null;
  }
}

async function updateWidget() {
  if (Platform.OS !== 'android') return;
  const statuses = await loadWidgetStatuses();
  await requestWidgetUpdate({
    widgetName: 'PartnerStatus',
    renderWidget: () => <PartnerStatusWidget statuses={statuses} />,
  });
}

// 위젯에 실제로 렌더링할 목록: 내 상태를 맨 위에, 그 아래로 연결된 사람들.
export async function loadWidgetStatuses(): Promise<PartnerStatus[]> {
  const [mine, partners] = await Promise.all([readMyStatus(), readPartners()]);
  return mine ? [mine, ...partners] : partners;
}

export async function updateMyStatus(status: PartnerStatus) {
  await AsyncStorage.setItem(MY_STATUS_KEY, JSON.stringify(status));
  await updateWidget();
}

export async function clearMyStatus() {
  await AsyncStorage.removeItem(MY_STATUS_KEY);
  await updateWidget();
}

export async function upsertPartnerStatus(status: PartnerStatus) {
  const list = await readPartners();
  const idx = list.findIndex((p) => p.uid === status.uid);
  if (idx >= 0) {
    list[idx] = status;
  } else {
    list.push(status);
  }
  await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(list));
  await updateWidget();
}

export async function removePartnerStatus(uid: string) {
  const list = (await readPartners()).filter((p) => p.uid !== uid);
  await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(list));
  await updateWidget();
}

export async function clearAllPartnerStatuses() {
  await AsyncStorage.removeItem(PARTNERS_KEY);
  await updateWidget();
}
