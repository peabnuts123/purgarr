import 'dotenv/config'

export const Config = {
  /**
   * Whether the application should run in "dry run" mode.
   * In this mode the application runs as normal, but no destructive actions
   * are taken.
   */
  DryRun: Boolean(optionalEnv(`DRY_RUN`, `true`)),
  /**
   * Max age (as a number of days) that content can be before it is deleted.
   */
  MaxAgeDays: Number(optionalEnv('MAX_AGE_DAYS', `90`)),
  Radarr: {
    /**
     * Base address for Radarr.
     */
    BaseUri: requiredEnv('RADARR_BASE_URI'),
    /**
     * API Key for Radarr.
     */
    ApiKey: requiredEnv('RADARR_API_KEY'),
    /**
     * Name of the tag used to exclude items in Radarr from the purge.
     */
    ExclusionTagName: optionalEnv('RADARR_EXCLUSION_TAG_NAME', 'do-not-purge'),
  },
  Sonarr: {
    /**
     * Address for Sonarr.
     */
    BaseUri: requiredEnv('SONARR_BASE_URI'),
    /**
     * API Key for Sonarr.
     */
    ApiKey: requiredEnv('SONARR_API_KEY'),
    /**
     * Name of tag used to exclude items in Sonarr from the purge
     */
    ExclusionTagName: optionalEnv('SONARR_EXCLUSION_TAG_NAME', 'do-not-purge'),
  },
}

function requiredEnv(envName: string): string {
  const value = process.env[envName];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: '${envName}'`);
  }
  return value;
}

function optionalEnv(envName: string, defaultValue: string): string {
  const value = process.env[envName];
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  return value;
}
