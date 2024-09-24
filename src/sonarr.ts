import { Config } from './config';
import { log, throwIfNotOkay } from './util';

export async function getTag(tagName: string) {
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

interface SonarrTag {
  id: number;
  label: string;
}

interface TvSeries {
  id: number;
  title: string;
  tags: number[];
}

interface Episode {
  id: number;
  episodeFileId: number | undefined;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
}

interface EpisodeFile {
  id: number;
  dateAdded: string;
}