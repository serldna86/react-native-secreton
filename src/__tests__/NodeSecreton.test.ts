import fs from 'node:fs';
import path from 'node:path';
import * as child from 'node:child_process';
import { encrypt, decrypt, readExistingEnv, generateEnv } from '../NodeSecreton';

beforeEach(() => {
  jest.clearAllMocks();
  
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

jest.mock('node:child_process');

global.fetch = jest.fn();

describe('crypto', () => {
  const key = 'test-key';

  beforeEach(() => {
    jest.spyOn(child, 'execSync').mockReturnValue(
      Buffer.from('MOCKED_ENCRYPT')
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('encrypt -> decrypt roundtrip', () => {
    const value = 'MOCKED_ENCRYPT';
    const encrypted = encrypt(value, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(value);
  });

  it('encrypt uses openssl', () => {
    const v = encrypt('A', 'B');
    expect(v).toBe('MOCKED_ENCRYPT');
  });
});

describe('readExistingEnv', () => {
  const tmpFile = path.join(__dirname, '.env.test');

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('should read keys from env file', () => {
    fs.writeFileSync(
      tmpFile,
      `
# comment
FOO=bar
HELLO=world
`
    );

    const keys = readExistingEnv(tmpFile);

    expect(keys.has('FOO')).toBe(true);
    expect(keys.has('HELLO')).toBe(true);
  });

  it('should return empty set if file not exists', () => {
    const keys = readExistingEnv('not-exist.env');
    expect(keys.size).toBe(0);
  });
});

describe('generateEnv', () => {
  const tmpEnv = path.join(__dirname, '.env.gen');
  const secretKey = 'secret';

  beforeEach(() => {
    jest.spyOn(child, 'execSync').mockReturnValue(Buffer.from('ENCRYPTED'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (fs.existsSync(tmpEnv)) fs.unlinkSync(tmpEnv);
  });

  it('should append encrypted env from consul', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Key: 'app/FOO',
          Value: Buffer.from('bar').toString('base64'),
        },
      ],
    });

    await generateEnv({
      envFile: tmpEnv,
      secretKey,
      fetchEnv: 'consul',
      consul: {
        addr: 'http://localhost:8500',
        path: 'app',
      },
    });

    const content = fs.readFileSync(tmpEnv, 'utf8');

    expect(content).toContain('FOO=secreton:ENCRYPTED');
  });

  it('should not overwrite existing keys', async () => {
    fs.writeFileSync(tmpEnv, 'FOO=existing\n');

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Key: 'app/FOO',
          Value: Buffer.from('bar').toString('base64'),
        },
      ],
    });

    await generateEnv({
      envFile: tmpEnv,
      secretKey,
      consul: {
        addr: 'http://localhost:8500',
        path: 'app',
      },
    });

    const content = fs.readFileSync(tmpEnv, 'utf8');
    expect(content.trim()).toBe('FOO=existing');
  });

  it('fetches from vault when fetchEnv=vault', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          data: {
            API_KEY: 'secret',
          },
        },
      }),
    });

    await generateEnv({
      envFile: tmpEnv,
      secretKey: 'key',
      fetchEnv: 'vault',
      vault: {
        addr: 'http://vault',
        path: 'kv/app',
        token: 'token',
      },
    });

    const content = fs.readFileSync(tmpEnv, 'utf8');
    expect(content).toContain('API_KEY=secreton:ENCRYPTED');
  });

  it('does nothing when no new env keys', async () => {
    fs.writeFileSync(tmpEnv, 'FOO=existing');

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Key: 'app/FOO',
          Value: Buffer.from('bar').toString('base64'),
        },
      ],
    });

    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await generateEnv({
      envFile: tmpEnv,
      secretKey: 'key',
      consul: {
        addr: 'http://consul',
        path: 'app',
      },
    });

    expect(logSpy).toHaveBeenCalledWith(
      'ℹ️ [Node] Secreton no new env keys to add'
    );

    logSpy.mockRestore();
  });

  it('creates env file if it does not exist', async () => {
    if (fs.existsSync(tmpEnv)) fs.unlinkSync(tmpEnv);

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Key: 'app/HELLO',
          Value: Buffer.from('world').toString('base64'),
        },
      ],
    });

    await generateEnv({
      envFile: tmpEnv,
      secretKey: 'key',
      consul: {
        addr: 'http://consul',
        path: 'app',
      },
    });

    const content = fs.readFileSync(tmpEnv, 'utf8');
    expect(content.startsWith('HELLO=secreton:')).toBe(true);
  });

  it('throws error when no config source is provided', async () => {
    await expect(
      generateEnv({
        envFile: 'test.env',
        secretKey: 'secret-key',
        // ❌ no consul
        // ❌ no vault
      })
    ).rejects.toThrow('No config source provided');
  });

  it('fetches env from consul', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Key: 'app/FOO',
          Value: Buffer.from('bar').toString('base64'),
        },
      ],
    });

    await generateEnv({
      envFile: tmpEnv,
      secretKey: 'secret',
      fetchEnv: 'consul',
      consul: {
        addr: 'http://localhost:8500',
        path: 'app',
      },
    });

    const content = fs.readFileSync(tmpEnv, 'utf8');
    expect(content).toContain('FOO=secreton:ENCRYPTED');
  });
  
  it('fetches env from vault', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          data: {
            HELLO: 'world',
          },
        },
      }),
    });

    await generateEnv({
      envFile: tmpEnv,
      secretKey: 'secret',
      fetchEnv: 'vault',
      vault: {
        addr: 'http://localhost:8200',
        path: 'secret/data/app',
        token: 'token',
      },
    });

    const content = fs.readFileSync(tmpEnv, 'utf8');
    expect(content).toContain('HELLO=secreton:ENCRYPTED');
  });
  
  it('logs when no new env keys to add', async () => {
    fs.writeFileSync(tmpEnv, 'FOO=secreton:ENCRYPTED');

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Key: 'app/FOO',
          Value: Buffer.from('bar').toString('base64'),
        },
      ],
    });

    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await generateEnv({
      envFile: tmpEnv,
      secretKey: 'secret',
      fetchEnv: 'consul',
      consul: {
        addr: 'http://localhost:8500',
        path: 'app',
      },
    });

    expect(logSpy).toHaveBeenCalledWith(
      'ℹ️ [Node] Secreton no new env keys to add'
    );

    logSpy.mockRestore();
  });
  
  it('throws when consul fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(
      generateEnv({
        envFile: tmpEnv,
        secretKey: 'secret',
        fetchEnv: 'consul',
        consul: {
          addr: 'http://localhost:8500',
          path: 'app',
        },
      })
    ).rejects.toThrow('Consul fetch failed');
  });
  
  it('throws when vault fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(
      generateEnv({
        envFile: tmpEnv,
        secretKey: 'secret',
        fetchEnv: 'vault',
        vault: {
          addr: 'http://localhost:8200',
          path: 'secret/data/app',
          token: 'token',
        },
      })
    ).rejects.toThrow('Vault fetch failed');
  });
});
