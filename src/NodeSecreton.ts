import path from "node:path";
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

export type ConsulKV = {
  Key: string;
  Value: string | null;
};

export interface VaultConfig {
  addr: string;
  path: string;
  token: string;
}

export interface GenerateEnvOptions {
  envFile: string;
  secretKey: string;
  consul?: ConsulConfig;
  vault?: VaultConfig;
  fetchEnv?: 'consul' | 'vault';
}

export function encrypt(value: string, key: string) {
  const cmd = `printf "%s" "${value}" | openssl enc -aes-256-cbc -a -A -salt -pbkdf2 -iter 100000 -pass pass:${key}`;
  return execSync(cmd).toString().trim();
}

export function readExistingEnv(envFile: string): Set<string> {
  if (!fs.existsSync(envFile)) return new Set();

  const content = fs.readFileSync(envFile, 'utf8');

  return new Set(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line): line is string => Boolean(line))
      .filter((line) => !line.startsWith('#'))
      .map((line) => line.split('=')[0])
      .filter((key): key is string => typeof key === 'string' && key.length > 0)
  );
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

  const data: ConsulKV[] = await res.json();
  return data
    .filter((item: any) => typeof item.Value === 'string')
    .map((item: any) => ({
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
  const {
    envFile,
    secretKey,
    fetchEnv = 'consul',
  } = options;

  const fileName = path.basename(envFile);
  const existingKeys = readExistingEnv(envFile);

  let entries: EnvEntry[] = [];

  if (fetchEnv === 'vault' && options.vault) {
    entries = await fetchVault(options.vault);
  } else if (options.consul) {
    entries = await fetchConsul(options.consul);
  } else {
    throw new Error('No config source provided');
  }

  const newLines = entries
    .filter(({ key }) => !existingKeys.has(key))
    .map(({ key, value }) => `${key}=enc:${encrypt(value, secretKey)}`);

  if (newLines.length === 0) {
    console.log('ℹ️ [Node] Secreton no new env keys to add');
    return;
  }

  fs.appendFileSync(envFile, (fs.existsSync(envFile) ? '\n' : '') + newLines.join('\n'));

  console.log(`✅ [Node] Secreton updated safely → ${fileName}`);
}
