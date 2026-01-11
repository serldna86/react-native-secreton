import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  encrypt(value: string): string;
  decrypt(encrypted: string): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Secreton');
