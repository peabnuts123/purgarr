import { Config } from './config';
import { log, throwIfNotOkay } from './util';

export async function getTag(tagName: string) {
  const response = await fetch(`${Config.Radarr.BaseUri}/api/v3/tag`, {
    method: 'GET',
    headers: {
      'X-Api-Key': Config.Radarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to fetch tags from Radarr`);

  const tags = await response.json() as RadarrTag[];
  const tag = tags.find((tag: any) => tag.label === tagName);

  if (!tag) {
    throw new Error(`Could not find tag with name: '${tagName}'`);
  }

  return tag;
}

export async function getMovies(): Promise<RadarrMovie[]> {
  const response = await fetch(`${Config.Radarr.BaseUri}/api/v3/movie`, {
    method: 'GET',
    headers: {
      'X-Api-Key': Config.Radarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to fetch movies from Radarr`);

  return await response.json() as RadarrMovie[];
}

export async function deleteMovie(movieId: number): Promise<void> {
  if (Config.DryRun) return;

  const response = await fetch(`${Config.Radarr.BaseUri}/api/v3/movie/${movieId}?deleteFiles=true&addImportExclusion=false`, {
    method: 'DELETE',
    headers: {
      'X-Api-Key': Config.Radarr.ApiKey,
    },
  });

  await throwIfNotOkay(response, `Failed to delete movie`);
}

export async function purgeMovies() {
  const exclusionTag = await getTag(Config.Radarr.ExclusionTagName);
  const movies = await getMovies();

  let deleteCount = 0;
  for (const movie of movies) {
    const isExcluded = movie.tags.includes(exclusionTag.id);
    if (isExcluded) {
      log(`Skipping movie with tag '${Config.Radarr.ExclusionTagName}': "${movie.title}"`);
    } else {
      const dateAdded = new Date(movie.added);
      const ageDays = (Date.now() - dateAdded.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > Config.MaxAgeDays) {
        log(`PURGING Movie: "${movie.title}" (id: ${movie.id}) Age: ${~~ageDays} days`);
        deleteCount++;

        await deleteMovie(movie.id);
      } else {
        log(`Keeping Movie: "${movie.title}" (id: ${movie.id}) Age: ${~~ageDays} days`)
      }
    }
  }

  log(`Deleted ${deleteCount} movies`);
}

interface RadarrTag {
  id: number;
  label: string;
}

interface RadarrMovie {
  id: number;
  title: string;
  added: string;
  tags: number[];
}
