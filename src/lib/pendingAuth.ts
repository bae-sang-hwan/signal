import type { ConfirmationResult } from '@react-native-firebase/auth';

// react-navigation params must stay serializable, so the confirmation
// handle (a class instance) is kept here instead and looked up by screens.
let pendingConfirmation: ConfirmationResult | null = null;

export function setPendingConfirmation(confirmation: ConfirmationResult) {
  pendingConfirmation = confirmation;
}

export function getPendingConfirmation(): ConfirmationResult | null {
  return pendingConfirmation;
}

export function clearPendingConfirmation() {
  pendingConfirmation = null;
}
