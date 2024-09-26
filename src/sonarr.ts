import { Config } from './config';
import { log, throwIfNotOkay } from './util';

/**
 * Fetch the full DTO of a tag, by name.
 * @param tagName Name of the tag to look up.
 */
export async function getTag(tagName: string): Promise<SonarrTag> {
  const response = await fetch(`${Config.Sonarr.BaseUri}/api/v3/tag`, {
    method: 'GET',
    headers: {
      'X-Api-Key': Config.Sonarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to fetch tags from Sonarr`);

  const tags = await response.json() as SonarrTag[];
  const tag = tags.find((tag: any) => tag.label === tagName);

  if (!tag) {
    throw new Error(`Could not find tag with name: '${tagName}'`);
  }

  return tag;
}

/**
 * Get all TV series from the Sonarr API
 */
export async function getSeries(): Promise<TvSeries[]> {
  const response = await fetch(`${Config.Sonarr.BaseUri}/api/v3/series`, {
    method: 'GET',
    headers: {
      'X-Api-Key': Config.Sonarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to fetch TV series from Sonarr`);

  return await response.json() as TvSeries[];
}

/**
 * Get all the episodes of a TV series. These are present in Sonarr
 * whether they have been downloaded or not.
 * @param seriesId ID of the TV series to query.
 */
export async function getAllEpisodes(seriesId: number): Promise<Episode[]> {
  const response = await fetch(`${Config.Sonarr.BaseUri}/api/v3/episode?seriesId=${seriesId}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': Config.Sonarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to get all episodes for series (id='${seriesId}') from Sonarr`);

  return await response.json() as Episode[];
}

/**
 * Get all the episode files associated with a TV series.
 * @param seriesId ID of the TV series to query.
 */
export async function getAllEpisodeFiles(seriesId: number): Promise<EpisodeFile[]> {
  const response = await fetch(`${Config.Sonarr.BaseUri}/api/v3/episodefile?seriesId=${seriesId}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': Config.Sonarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to get all episode files for series (id='${seriesId}') from Sonarr`);

  return await response.json() as EpisodeFile[];
}

/**
 * Mark a batch of episodes as monitored/unmonitored.
 * @param episodeIds Array of Episode IDs to update.
 * @param monitored The monitored status to set.
 */
export async function setEpisodesMonitored(episodeIds: number[], monitored: boolean): Promise<void> {
  if (Config.DryRun) return;

  const payload = {
    episodeIds,
    monitored
  };

  const response = await fetch(`${Config.Sonarr.BaseUri}/api/v3/episode/monitor`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'X-Api-Key': Config.Sonarr.ApiKey,
      'Content-Type': 'application/json',
    }
  });

  await throwIfNotOkay(response, `Failed to set monitored status for episodes`);
}

/**
 * Delete a batch of episode files from disk.
 * @param episodeFileIds IDs of episode files to delete.
 */
export async function deleteEpisodeFiles(episodeFileIds: number[]): Promise<void> {
  if (Config.DryRun) return;

  const payload = {
    episodeFileIds,
  };

  const response = await fetch(`${Config.Sonarr.BaseUri}/api/v3/episodefile/bulk`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
    headers: {
      'X-Api-Key': Config.Sonarr.ApiKey,
      'Content-Type': 'application/json',
    }
  });

  await throwIfNotOkay(response, `Failed to delete episode files`);
}

/**
 * Run the purge against Sonarr.
 */
export async function purgeSeries() {
  const exclusionTag = await getTag(Config.Sonarr.ExclusionTagName);
  const allSeries = await getSeries();

  const deletedEpisodeIds: number[] = [];
  for (const series of allSeries) {
    log(`Processing TV series: "${series.title}"...`);

    const isExcluded = series.tags.includes(exclusionTag.id);
    if (isExcluded) {
      log(`Skipping TV series with tag '${Config.Sonarr.ExclusionTagName}': "${series.title}"`);
    } else {
      const episodes = await getAllEpisodes(series.id);
      const episodeFiles = await getAllEpisodeFiles(series.id);
      for (const episode of episodes) {
        if (!episode.episodeFileId) continue;

        const episodeFile = episodeFiles.find((file) => file.id === episode.episodeFileId);

        if (episodeFile === undefined) {
          throw new Error(`Could not find matching episode file with ID: ${episode.episodeFileId}. (series='${series.title}') (title='${episode.title}') (seasonNumber='${episode.seasonNumber}') (episodeNumber='${episode.episodeNumber}')`);
        }

        const episodeDateAdded = new Date(episodeFile.dateAdded);
        const episodeFileAgeDays = (Date.now() - episodeDateAdded.getTime()) / (1000 * 60 * 60 * 24);
        if (episodeFileAgeDays > Config.MaxAgeDays) {
          log(`PURGING TV episode: "${episode.title}" (id: ${episode.id}) (episodeFileId='${episodeFile.id}') (series='${series.title}') (seasonNumber='${episode.seasonNumber}') (episodeNumber='${episode.episodeNumber}') Age: ${~~episodeFileAgeDays} days`);

          deletedEpisodeIds.push(episode.id);
        } else {
          log(`Keeping TV episode: "${episode.title}" (id: ${episode.id}) (episodeFileId='${episodeFile.id}') (series='${series.title}') (seasonNumber='${episode.seasonNumber}') (episodeNumber='${episode.episodeNumber}') Age: ${~~episodeFileAgeDays} days`);
        }
      }
    }
  }

  log(`Deleted ${deletedEpisodeIds.length} TV episodes`);

  await setEpisodesMonitored(deletedEpisodeIds, false);
  await deleteEpisodeFiles(deletedEpisodeIds);
}

// @NOTE Types are non-exhaustive. They only have the properties that are actually used on them.

interface SonarrTag {
  id: number;
  label: string;
}

interface TvSeries {
  id: number;
  title: string;
  tags: number[];
}

/**
 * An episode of a TV series in Sonarr.
 * Represents the entry in Sonarr, not the file on disk.
 */
interface Episode {
  id: number;
  episodeFileId: number | undefined;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
}

/**
 * The physical file on a disk for an Episode.
 */
interface EpisodeFile {
  id: number;
  dateAdded: string;
}