const generateEnvMock = jest.fn();

jest.mock('../NodeSecreton', () => ({
  generateEnv: (...args: any[]) => generateEnvMock(...args),
}));

describe('CLISecreton', () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;
  const originalExit = process.exit;

  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.argv = ['node', 'cli.js', 'test.env'];

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-ignore
    process.exit = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
    process.exit = originalExit;

    logSpy.mockRestore();
    errorSpy.mockRestore();
    generateEnvMock.mockReset();
  });

  // --------------------------------------------------

  it('runs successfully with consul config', async () => {
    process.env.ENV_SECRET_KEY = 'secret';
    process.env.FETCH_ENV = 'consul';

    generateEnvMock.mockResolvedValue(undefined);

    await import('../CLISecreton');

    expect(generateEnvMock).toHaveBeenCalledWith(
      expect.objectContaining({
        envFile: 'test.env',
        secretKey: 'secret',
        fetchEnv: 'consul',
        consul: expect.objectContaining({
          addr: expect.any(String),
          path: expect.any(String),
        }),
      })
    );

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('✅ [CLI] Secreton updated safely')
    );

    expect(process.exit).not.toHaveBeenCalled();
  });

  // --------------------------------------------------

  it('fails when ENV_SECRET_KEY is missing', async () => {
    delete process.env.ENV_SECRET_KEY;

    await import('../CLISecreton');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ENV_SECRET_KEY is required')
    );

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // --------------------------------------------------

  it('handles generateEnv error correctly', async () => {
    process.env.ENV_SECRET_KEY = 'secret';

    generateEnvMock.mockRejectedValue(
      new Error('Generate failed')
    );

    await import('../CLISecreton');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generate failed')
    );

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // --------------------------------------------------

  it('runs with vault config', async () => {
    process.env.ENV_SECRET_KEY = 'secret';
    process.env.FETCH_ENV = 'vault';
    process.env.VAULT_TOKEN = 'vault-token';

    generateEnvMock.mockResolvedValue(undefined);

    await import('../CLISecreton');

    expect(generateEnvMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchEnv: 'vault',
        vault: expect.objectContaining({
          token: 'vault-token',
        }),
      })
    );
  });

  it('uses ENV_FILE from process.env when argv is empty', async () => {
    process.env.ENV_SECRET_KEY = 'secret';
    process.env.ENV_FILE = 'from-env.env';

    process.argv = ['node', 'cli.js'];

    generateEnvMock.mockResolvedValue(undefined);

    await import('../CLISecreton');

    expect(generateEnvMock).toHaveBeenCalledWith(
      expect.objectContaining({
        envFile: 'from-env.env',
      })
    );
  });
  it('uses default vault config when env vars are missing', async () => {
    process.env.ENV_SECRET_KEY = 'secret';
    process.env.FETCH_ENV = 'vault';

    delete process.env.VAULT_ADDR;
    delete process.env.VAULT_PATH;
    delete process.env.VAULT_TOKEN;

    generateEnvMock.mockResolvedValue(undefined);

    await import('../CLISecreton');

    expect(generateEnvMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchEnv: 'vault',
        vault: {
          addr: 'http://localhost:8200',
          path: 'secret/data/mobile/project-example',
          token: '',
        },
      })
    );
  });
  it('handles non-Error thrown value correctly', async () => {
    process.env.ENV_SECRET_KEY = 'secret';

    generateEnvMock.mockRejectedValue({
      reason: 'something bad',
      code: 500,
    });

    await import('../CLISecreton');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"reason": "something bad"')
    );

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
