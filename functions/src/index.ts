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

// 상대가 색상을 바꾸면 파트너에게 FCM을 보낸다 (screen_spec.html 07).
export const onColorChanged = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.currentColor === after.currentColor) return;

  const pairId: string | undefined = after.pairId;
  if (!pairId) return;

  const pairSnap = await db.doc(`pairs/${pairId}`).get();
  const pair = pairSnap.data();
  if (!pair) return;

  const uid = event.params.uid;
  const partnerUid = pair.hostUid === uid ? pair.guestUid : pair.hostUid;
  if (!partnerUid) return;

  const partnerSnap = await db.doc(`users/${partnerUid}`).get();
  const partnerToken: string | undefined = partnerSnap.data()?.fcmToken;
  if (!partnerToken) return;

  const color: string = after.currentColor;
  const nickname: string = after.nickname ?? '상대';
  const caption = (after.captions?.[color] as string | undefined)?.trim() || captionByColor[color] || color;

  try {
    await messaging.send({
      token: partnerToken,
      notification: {
        title: nickname,
        body: caption,
      },
      data: {
        type: 'colorChanged',
        color,
        nickname,
        caption,
        updatedAt: String(Date.now()),
      },
      android: {
        priority: 'high',
      },
    });
  } catch (err) {
    console.error('FCM send failed', err);
  }
});
