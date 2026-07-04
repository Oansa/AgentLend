import dotenv from 'dotenv';
import { z } from 'zod';

let configInstance: z.infer<typeof envSchema> | null = null;

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(true),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // Ethereum
  CHAIN_ID: z.coerce.number().default(84532),
  RPC_URL: z.string().url().default('https://sepolia.base.org'),
  PRIVATE_KEY: z.string().optional(),
  ORACLE_SIGNER_ADDRESS: z.string().optional(),

  // Contracts
  ACS_ORACLE_ADDRESS: z.string().optional(),
  COLLATERAL_MANAGER_ADDRESS: z.string().optional(),
  LENDING_POOL_ADDRESS: z.string().optional(),
  USDC_ADDRESS: z.string().default('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),

  // ACS Scoring
  SCORE_VALIDITY_SECONDS: z.coerce.number().default(600),
  MIN_SCORE: z.coerce.number().default(300),
  MAX_SCORE: z.coerce.number().default(900),

  // External APIs
  COINGECKO_API_KEY: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  MORALIS_API_KEY: z.string().optional(),

  // CROO CAP Integration
  CAP_API_URL: z.string().url().optional(),
  CAP_WS_URL: z.string().url().optional(),
  CAP_API_KEY: z.string().optional(),
  CROO_API_KEY: z.string().optional(),
  CROO_AGENT_DID: z.string().optional(),
  CROO_API_URL: z.string().url().optional(),
  CROO_WS_URL: z.string().url().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Metrics
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().default(9090),
});

function loadConfig(): z.infer<typeof envSchema> {
  dotenv.config();

  if (!configInstance) {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error('❌ Invalid environment configuration:');
      console.error(parsed.error.flatten().fieldErrors);
      process.exit(1);
    }

    configInstance = parsed.data;
  }

  return configInstance;
}

const getConfig = () => loadConfig();

export const config = {
  get PORT() { return getConfig().PORT; },
  get HOST() { return getConfig().HOST; },
  get NODE_ENV() { return getConfig().NODE_ENV; },
  get LOG_LEVEL() { return getConfig().LOG_LEVEL; },
  get LOG_PRETTY() { return getConfig().LOG_PRETTY; },
  get REDIS_HOST() { return getConfig().REDIS_HOST; },
  get REDIS_PORT() { return getConfig().REDIS_PORT; },
  get REDIS_PASSWORD() { return getConfig().REDIS_PASSWORD; },
  get REDIS_DB() { return getConfig().REDIS_DB; },
  get CHAIN_ID() { return getConfig().CHAIN_ID; },
  get RPC_URL() { return getConfig().RPC_URL; },
  get PRIVATE_KEY() { return getConfig().PRIVATE_KEY; },
  get ORACLE_SIGNER_ADDRESS() { return getConfig().ORACLE_SIGNER_ADDRESS; },
  get ACS_ORACLE_ADDRESS() { return getConfig().ACS_ORACLE_ADDRESS; },
  get COLLATERAL_MANAGER_ADDRESS() { return getConfig().COLLATERAL_MANAGER_ADDRESS; },
  get LENDING_POOL_ADDRESS() { return getConfig().LENDING_POOL_ADDRESS; },
  get USDC_ADDRESS() { return getConfig().USDC_ADDRESS; },
  get SCORE_VALIDITY_SECONDS() { return getConfig().SCORE_VALIDITY_SECONDS; },
  get MIN_SCORE() { return getConfig().MIN_SCORE; },
  get MAX_SCORE() { return getConfig().MAX_SCORE; },
  get COINGECKO_API_KEY() { return getConfig().COINGECKO_API_KEY; },
  get ALCHEMY_API_KEY() { return getConfig().ALCHEMY_API_KEY; },
  get MORALIS_API_KEY() { return getConfig().MORALIS_API_KEY; },
  get CAP_API_URL() { return getConfig().CAP_API_URL; },
  get CAP_WS_URL() { return getConfig().CAP_WS_URL; },
  get CAP_API_KEY() { return getConfig().CAP_API_KEY; },
  get CROO_AGENT_DID() { return getConfig().CROO_AGENT_DID; },
  get CROO_API_KEY() { return getConfig().CROO_API_KEY; },
  get CROO_API_URL() { return getConfig().CROO_API_URL; },
  get CROO_WS_URL() { return getConfig().CROO_WS_URL; },
  get RATE_LIMIT_MAX() { return getConfig().RATE_LIMIT_MAX; },
  get RATE_LIMIT_WINDOW_MS() { return getConfig().RATE_LIMIT_WINDOW_MS; },
  get METRICS_ENABLED() { return getConfig().METRICS_ENABLED; },
  get METRICS_PORT() { return getConfig().METRICS_PORT; },
};

export type Config = z.infer<typeof envSchema>;