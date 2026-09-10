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

// HomeConnectedScreen mounts one PartnerCard per connection, and they can all
// resolve their Firestore snapshots around the same time - without this queue,
// concurrent upsert/remove calls do a non-atomic read-modify-write on the same
// AsyncStorage key and silently lose whichever one wrote last based on a stale
// read (one connection would randomly go missing from the widget).
let writeQueue = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
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

export function updateMyStatus(status: PartnerStatus) {
  return enqueue(async () => {
    await AsyncStorage.setItem(MY_STATUS_KEY, JSON.stringify(status));
    await updateWidget();
  });
}

export function clearMyStatus() {
  return enqueue(async () => {
    await AsyncStorage.removeItem(MY_STATUS_KEY);
    await updateWidget();
  });
}

export function upsertPartnerStatus(status: PartnerStatus) {
  return enqueue(async () => {
    const list = await readPartners();
    const idx = list.findIndex((p) => p.uid === status.uid);
    if (idx >= 0) {
      list[idx] = status;
    } else {
      list.push(status);
    }
    await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(list));
    await updateWidget();
  });
}

export function removePartnerStatus(uid: string) {
  return enqueue(async () => {
    const list = (await readPartners()).filter((p) => p.uid !== uid);
    await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(list));
    await updateWidget();
  });
}

export function clearAllPartnerStatuses() {
  return enqueue(async () => {
    await AsyncStorage.removeItem(PARTNERS_KEY);
    await updateWidget();
  });
}
