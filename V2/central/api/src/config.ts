export interface AppConfig {
  mongodbUri: string;
  sessionSecret: string;
  nodeEnv: 'development' | 'test' | 'production';
  httpPort: number;
  firmwareGen1Dir: string;
  otaMaxConcurrency: number;
  bootstrapAdminPassword?: string;
  bootstrapAdminEasyPass?: boolean;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new ConfigurationError(`Missing required environment variable: ${name}`);
  }

  return value;
}

function positiveInteger(value: string, name: string, maximum?: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    throw new ConfigurationError(`Environment variable ${name} must be a positive integer.`);
  }

  return parsed;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const mongodbUri = required(environment, 'MONGODB_URI');
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongodbUri)) {
    throw new ConfigurationError('Environment variable MONGODB_URI must be a MongoDB URI.');
  }

  const nodeEnv = required(environment, 'NODE_ENV');
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new ConfigurationError(
      'Environment variable NODE_ENV must be development, test, or production.',
    );
  }

  const bootstrapAdminPassword = environment.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const bootstrapAdminEasyPass = ['1', 'true', 'yes', 'on'].includes(
    environment.BOOTSTRAP_ADMIN_EASYPASS?.trim().toLowerCase() ?? '',
  );

  return {
    mongodbUri,
    sessionSecret: required(environment, 'SESSION_SECRET'),
    nodeEnv,
    httpPort: positiveInteger(required(environment, 'HTTP_PORT'), 'HTTP_PORT', 65535),
    firmwareGen1Dir: required(environment, 'AUTOHOME_FIRMWARE_GEN1_DIR'),
    otaMaxConcurrency: positiveInteger(
      required(environment, 'OTA_MAX_CONCURRENCY'),
      'OTA_MAX_CONCURRENCY',
    ),
    ...(bootstrapAdminPassword ? { bootstrapAdminPassword } : {}),
    bootstrapAdminEasyPass,
  };
}
