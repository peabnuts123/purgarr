import { Config } from './config';
import { purgeMovies } from './radarr';
import { purgeSeries } from './sonarr';
import { log, logWarning } from './util';

if (Config.DryRun) {
  log(`=================`);
  logWarning("NOTE: 'Config.DryRun' is enabled - Logs will appear destructive but NO actions will be taken");
  log(`=================`);
} else {
  throw new Error(`Wet run not yet allowed.`)
}

log();
log(`=================`);
log(`PROCESSING MOVIES`);
log(`=================`);
await purgeMovies();

log();
log(`====================`);
log(`PROCESSING TV SERIES`);
log(`====================`);
await purgeSeries();
