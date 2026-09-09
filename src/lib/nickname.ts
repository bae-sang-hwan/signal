export const NICKNAME_MIN_LEN = 2;
export const NICKNAME_MAX_LEN = 10;

export function isValidNickname(trimmed: string): boolean {
  return trimmed.length >= NICKNAME_MIN_LEN && trimmed.length <= NICKNAME_MAX_LEN;
}
