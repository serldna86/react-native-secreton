import fs from 'fs';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

export interface ConsulConfig {
  addr: string;
  path: string;
  token?: string;
}

export interface VaultConfig {
  addr: string;
  path: string;
  token: string;
}

export interface GenerateEnvOptions {
  envName: string;
  secretKey: string;
  consul?: ConsulConfig;
  vault?: VaultConfig;
  fetchEnv?: 'consul' | 'vault';
}

function encrypt(value: string, key: string): string {
  const cmd = `printf "%s" "${value}" | openssl enc -aes-256-gcm -a -A -pass pass:${key}`;
  return execSync(cmd).toString().trim();
}

async function fetchConsul({ addr, path, token }: ConsulConfig) {
  const headers: Record<string, string> = {};
  if (token) headers['X-Consul-Token'] = token;

  const res = await fetch(`${addr}/v1/kv/${path}?recurse=true`, { headers });
  if (!res.ok) throw new Error('Consul fetch failed');
  const data = await res.json();
  return data.map((item: any) => {
    const key = item.Key.replace(`${path}/`, '');
    const value = Buffer.from(item.Value, 'base64').toString('utf8');
    return { key, value };
  });
}

async function fetchVault({ addr, path, token }: VaultConfig) {
  const res = await fetch(`${addr}/v1/${path}`, {
    headers: { 'X-Vault-Token': token },
  });
  if (!res.ok) throw new Error('Vault fetch failed');
  const json = await res.json();
  return Object.entries(json.data.data).map(([key, value]) => ({
    key,
    value: value as string,
  }));
}

export async function generateEnv(options: GenerateEnvOptions): Promise<void> {
  const envFile = `.env.${options.envName}`;
  const { secretKey, fetchEnv = 'consul' } = options;

  let entries: { key: string; value: string }[] = [];
  if (fetchEnv === 'vault' && options.vault) {
    entries = await fetchVault(options.vault);
  } else if (options.consul) {
    entries = await fetchConsul(options.consul);
  } else {
    throw new Error('No config source provided');
  }

  const lines = entries.map(
    ({ key, value }) => `${key}=enc:${encrypt(value, secretKey)}`
  );
  fs.writeFileSync(envFile, lines.join('\n'));
}
