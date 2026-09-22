import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { Platform } from 'react-native';
import { SignalColor } from '../theme/colors';
import { getWidgetTranslation } from '../i18n';
import { PartnerStatusWidget } from '../widgets/PartnerStatusWidget';

const PARTNERS_KEY = 'partnerStatuses';
const MY_STATUS_KEY = 'myStatus';
const WIDGET_OPACITY_KEY = 'widgetOpacity';
const CACHE_CLEARED_ONCE_KEY = 'localCacheClearedOnce';

export const DEFAULT_WIDGET_OPACITY = 1;

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

export async function getWidgetOpacity(): Promise<number> {
  const raw = await AsyncStorage.getItem(WIDGET_OPACITY_KEY);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : DEFAULT_WIDGET_OPACITY;
}

export async function setWidgetOpacity(opacity: number) {
  await AsyncStorage.setItem(WIDGET_OPACITY_KEY, String(opacity));
  await updateWidget();
}

export async function updateWidget() {
  if (Platform.OS !== 'android') return;
  const [statuses, opacity, emptyText] = await Promise.all([
    loadWidgetStatuses(),
    getWidgetOpacity(),
    getWidgetTranslation('widget.empty'),
  ]);
  await requestWidgetUpdate({
    widgetName: 'PartnerStatus',
    renderWidget: () => (
      <PartnerStatusWidget statuses={statuses} emptyText={emptyText} opacity={opacity} />
    ),
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

// 위젯/파트너 캐시 전체를 비운다. 위젯 불투명도 설정까지 포함해서 로컬 상태를
// 완전히 초기화할 때 쓴다 (예: 서버 데이터를 초기화한 뒤 기기 쪽 잔여 캐시 정리).
export function clearLocalCache() {
  return enqueue(async () => {
    await AsyncStorage.multiRemove([PARTNERS_KEY, MY_STATUS_KEY, WIDGET_OPACITY_KEY]);
    await updateWidget();
  });
}

// 앱을 새로 설치했을 때(=기기에 이 플래그가 없을 때) 딱 한 번만 캐시를 비운다.
// 재설치 시 AsyncStorage 자체가 비워지므로 사실상 매 설치마다 한 번 실행되고,
// 이후로는 앱을 지우지 않는 한 다시 실행되지 않는다.
export async function clearLocalCacheOnce() {
  const already = await AsyncStorage.getItem(CACHE_CLEARED_ONCE_KEY);
  if (already) return;
  await clearLocalCache();
  await AsyncStorage.setItem(CACHE_CLEARED_ONCE_KEY, '1');
}
