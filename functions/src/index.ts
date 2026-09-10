import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

const captionByColor: Record<string, string> = {
  red: '방해하지 마세요',
  amber: '바빠요',
  green: '괜찮아요',
};

async function sendPush(token: string | undefined, notification: { title: string; body: string }, data: Record<string, string>) {
  if (!token) return;
  try {
    await messaging.send({
      token,
      notification,
      data,
      android: { priority: 'high' },
    });
  } catch (err) {
    console.error('FCM send failed', err);
  }
}

// 상대가 색상을 바꾸면 연결된 모든 사람에게 FCM을 보낸다 (screen_spec.html 07).
export const onColorChanged = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.currentColor === after.currentColor) return;

  const pairIds: string[] = after.pairIds ?? [];
  if (pairIds.length === 0) return;

  const uid = event.params.uid;
  const color: string = after.currentColor;
  const nickname: string = after.nickname ?? '상대';
  const caption = (after.captions?.[color] as string | undefined)?.trim() || captionByColor[color] || color;

  const pairSnaps = await Promise.all(pairIds.map((pairId) => db.doc(`pairs/${pairId}`).get()));
  const partnerUids = new Set<string>();
  pairSnaps.forEach((snap) => {
    const pair = snap.data();
    if (!pair) return;
    const partnerUid = pair.hostUid === uid ? pair.guestUid : pair.hostUid;
    if (partnerUid) partnerUids.add(partnerUid);
  });
  if (partnerUids.size === 0) return;

  const partnerSnaps = await Promise.all(
    Array.from(partnerUids).map((partnerUid) => db.doc(`users/${partnerUid}`).get()),
  );

  await Promise.all(
    partnerSnaps.map((snap) =>
      sendPush(
        snap.data()?.fcmToken,
        { title: nickname, body: caption },
        { type: 'colorChanged', uid, color, nickname, caption, updatedAt: String(Date.now()) },
      ),
    ),
  );
});

// 초대 코드로 새로 연결되면 초대한 쪽(host)에게 알린다.
// 코드를 입력한 쪽(guest)은 이미 화면에서 연결 완료를 보고 있으므로 제외.
export const onPairConnected = onDocumentUpdated('pairs/{pairId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status || after.status !== 'active') return;

  const hostUid: string | undefined = after.hostUid;
  const guestUid: string | undefined = after.guestUid;
  if (!hostUid || !guestUid) return;

  const [hostSnap, guestSnap] = await Promise.all([
    db.doc(`users/${hostUid}`).get(),
    db.doc(`users/${guestUid}`).get(),
  ]);
  const hostData = hostSnap.data();
  const guestData = guestSnap.data();
  if (!hostData || !guestData) return;

  const guestNickname: string = guestData.nickname ?? '상대';

  await sendPush(
    hostData.fcmToken,
    { title: '새로운 연결', body: `${guestNickname}님과 연결되었어요` },
    { type: 'paired', partnerUid: guestUid },
  );
});
