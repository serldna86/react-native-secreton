import Secreton from './NativeSecreton';

export function encrypt(value: string, key: string): string {
  return Secreton.encrypt(value, key);
}

export function decrypt(encrypted: string, key: string): string {
  return Secreton.decrypt(encrypted, key);
}
