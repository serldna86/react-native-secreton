import { useEffect, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import * as RNSecreton from 'react-native-secreton';

export default function App() {
  const [encrypted, setEncrypted] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<string | null>(null);

  useEffect(() => {
    const secretKey = 'secret-key-32-bytes';
    const plainText = 'Hello Secreton';

    const enc = RNSecreton.encrypt(plainText, secretKey);
    const dec = RNSecreton.decrypt(enc, secretKey);

    setEncrypted(enc);
    setDecrypted(dec);
  }, []);

  return (
    <SafeAreaView style={{ padding: 24 }}>
      <Text>🔐 Encrypted:</Text>
      <Text selectable>{encrypted}</Text>

      <Text style={{ marginTop: 16 }}>🔓 Decrypted:</Text>
      <Text selectable>{decrypted}</Text>
    </SafeAreaView>
  );
}
