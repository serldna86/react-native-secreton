import fs from 'node:fs';
import { execSync } from 'node:child_process';
export function encrypt(value, key) {
    const cmd = `printf "%s" "${value}" | openssl enc -aes-256-cbc -a -A -salt -pbkdf2 -iter 100000 -pass pass:${key}`;
    return execSync(cmd).toString().trim();
}
export function readExistingEnv(envFile) {
    if (!fs.existsSync(envFile))
        return new Set();
    const content = fs.readFileSync(envFile, 'utf8');
    return new Set(content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => Boolean(line))
        .filter((line) => !line.startsWith('#'))
        .map((line) => line.split('=')[0])
        .filter((key) => typeof key === 'string' && key.length > 0));
}
async function fetchConsul({ addr, path, token, }) {
    const headers = {};
    if (token)
        headers['X-Consul-Token'] = token;
    const res = await fetch(`${addr}/v1/kv/${path}?recurse=true`, { headers });
    if (!res.ok)
        throw new Error('Consul fetch failed');
    const data = await res.json();
    return data
        .filter((item) => typeof item.Value === 'string')
        .map((item) => ({
        key: item.Key.replace(`${path}/`, ''),
        value: Buffer.from(item.Value, 'base64').toString('utf8'),
    }));
}
async function fetchVault({ addr, path, token, }) {
    const res = await fetch(`${addr}/v1/${path}`, {
        headers: { 'X-Vault-Token': token },
    });
    if (!res.ok)
        throw new Error('Vault fetch failed');
    const json = await res.json();
    return Object.entries(json.data.data).map(([key, value]) => ({
        key,
        value: String(value),
    }));
}
export async function generateEnv(options) {
    const { envFile, secretKey, fetchEnv = 'consul', } = options;
    const existingKeys = readExistingEnv(envFile);
    let entries = [];
    if (fetchEnv === 'vault' && options.vault) {
        entries = await fetchVault(options.vault);
    }
    else if (options.consul) {
        entries = await fetchConsul(options.consul);
    }
    else {
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
    console.log(`✅ [Node] Secreton updated safely → ${envFile}`);
}
