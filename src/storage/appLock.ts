import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'finanzas_app_pin_v1';

export async function hasPinConfigured(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(PIN_KEY);
  return Boolean(pin && pin.length === 4);
}

export async function setPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('El PIN debe tener 4 dígitos.');
  }
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === pin;
}