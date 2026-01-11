import Secreton from './NativeSecreton';

export function encrypt(value: string): string {
  return Secreton.encrypt(value);
}

export function decrypt(encrypted: string): string {
  return Secreton.decrypt(encrypted);
}
