import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { SignalColor } from '../theme/colors';
import { resolveCaption, SignalCaptions } from './signalCopy';

export interface PartnerInfo {
  partnerUid: string | null;
  nickname: string;
  color: SignalColor;
  caption: string;
  updatedAt: Date | null;
}

// pairs/{pairId} 문서에서 상대 uid를 찾고, 그 uid의 users 문서를 구독한다.
export function usePartner(pairId: string, myUid: string | null): PartnerInfo {
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [color, setColor] = useState<SignalColor>('green');
  const [captions, setCaptions] = useState<Partial<SignalCaptions> | undefined>();
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!myUid) return;
    return onSnapshot(doc(db, 'pairs', pairId), (snap) => {
      const data = snap.data();
      if (!data) return;
      setPartnerUid(data.hostUid === myUid ? data.guestUid : data.hostUid);
    });
  }, [pairId, myUid]);

  useEffect(() => {
    if (!partnerUid) return;
    return onSnapshot(doc(db, 'users', partnerUid), (snap) => {
      const data = snap.data();
      if (!data) return;
      setNickname(data.nickname ?? '');
      setCaptions(data.captions as Partial<SignalCaptions> | undefined);
      const ts = data.colorUpdatedAt as Timestamp | undefined;
      setUpdatedAt(ts ? ts.toDate() : null);
      if (data.currentColor) setColor(data.currentColor as SignalColor);
    });
  }, [partnerUid]);

  return { partnerUid, nickname, color, caption: resolveCaption(captions, color), updatedAt };
}
