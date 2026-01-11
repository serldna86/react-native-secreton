import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  encrypt(value: string, key: string): string;
  decrypt(encrypted: string, key: string): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Secreton');
