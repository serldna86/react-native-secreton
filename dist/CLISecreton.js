#!/usr/bin/env node
import { generateEnv } from './NodeSecreton.js';
const args = process.argv.slice(2);
const envName = args[0] || process.env.ENV;
(async () => {
    try {
        const secretKey = process.env.ENV_SECRET_KEY;
        if (!secretKey) {
            throw new Error('ENV_SECRET_KEY is required');
        }
        const fetchEnv = process.env.FETCH_ENV || 'consul';
        await generateEnv({
            envName,
            secretKey,
            fetchEnv,
            consul: fetchEnv === 'consul'
                ? {
                    addr: process.env.CONSUL_ADDR || 'http://localhost:8500',
                    path: process.env.CONSUL_PATH || 'mobile/project-example',
                    token: process.env.CONSUL_TOKEN,
                }
                : undefined,
            vault: fetchEnv === 'vault'
                ? {
                    addr: process.env.VAULT_ADDR || 'http://localhost:8200',
                    path: process.env.VAULT_PATH || 'secret/data/mobile/project-example',
                    token: process.env.VAULT_TOKEN || '',
                }
                : undefined,
        });
        console.log(`✅ Secreton updated safely → .env.${envName}`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : JSON.stringify(err, null, 2);
        console.error(`❌ Secreton failed: ${message}`);
        process.exit(1);
    }
})();
