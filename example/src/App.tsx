import { useEffect, useState } from 'react';
import { SafeAreaView, Text, NativeModules } from 'react-native';
import * as RNSecreton from 'react-native-secreton';

const { Config } = NativeModules;

export default function App() {
  const [configText, setConfigText] = useState<string | null>(null);
  const [encrypted, setEncrypted] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<string | null>(null);

  useEffect(() => {
    Config.getEnv().then((env: Record<string, any>) => {
      setConfigText(env.SECRETON_KEY);
    });

    const enc = RNSecreton.encrypt("Hi, Secreton...");
    setEncrypted(enc);

    const dec = RNSecreton.decrypt(enc);
    setDecrypted(dec);
  }, []);

  return (
    <SafeAreaView style={{ padding: 24 }}>
      <Text>🔐 Encrypted:</Text>
      <Text selectable>{encrypted}</Text>

      <Text style={{ marginTop: 16 }}>🔓 Decrypted:</Text>
      <Text selectable>{decrypted}</Text>

      <Text style={{ marginTop: 16 }}>🔓 Config from Env:</Text>
      <Text selectable>{configText}</Text>
    </SafeAreaView>
  );
}
