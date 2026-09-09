// 0/O, 1/I/L처럼 헷갈리는 문자를 뺀 5자리 초대 코드.
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}
