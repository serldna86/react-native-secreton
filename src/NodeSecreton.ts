import fs from 'node:fs';
import { execSync } from 'node:child_process';

export interface EnvEntry {
  key: string;
  value: string;
}

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

export function encrypt(value: string, key: string) {
  const cmd = `printf "%s" "${value}" | openssl enc -aes-256-gcm -a -A -pass pass:${key}`;
  return execSync(cmd).toString().trim();
}

async function fetchConsul({
  addr,
  path,
  token,
}: ConsulConfig): Promise<EnvEntry[]> {
  const headers: Record<string, string> = {};
  if (token) headers['X-Consul-Token'] = token;

  const res = await fetch(`${addr}/v1/kv/${path}?recurse=true`, { headers });
  if (!res.ok) throw new Error('Consul fetch failed');

  const data = await res.json();
  return data.map((item: any) => ({
    key: item.Key.replace(`${path}/`, ''),
    value: Buffer.from(item.Value, 'base64').toString('utf8'),
  }));
}

async function fetchVault({
  addr,
  path,
  token,
}: VaultConfig): Promise<EnvEntry[]> {
  const res = await fetch(`${addr}/v1/${path}`, {
    headers: { 'X-Vault-Token': token },
  });

  if (!res.ok) throw new Error('Vault fetch failed');

  const json = await res.json();
  return Object.entries(json.data.data).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

export async function generateEnv(options: GenerateEnvOptions) {
  const envFile = `.env.${options.envName}`;
  const { secretKey, fetchEnv = 'consul' } = options;

  let entries: EnvEntry[] = [];

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
