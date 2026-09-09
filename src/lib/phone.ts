// 국내 휴대폰 번호(010/011/016~019, 10~11자리) 포맷팅 및 검증.

export function formatKoreanPhone(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  const middleLen = digits.length - 7;
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middleLen)}-${digits.slice(3 + middleLen)}`;
}

export function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 11);
}

export function isValidKoreanPhone(digits: string): boolean {
  return /^01[016789]\d{7,8}$/.test(digits);
}

export function toE164(digits: string): string {
  return `+82${digits.slice(1)}`;
}
