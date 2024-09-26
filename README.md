# Purgarr

Purgarr is a tool for regularly deleting old media from your media services (e.g. Sonarr, Radarr, etc). It is configurable and can run in Docker on a schedule.

Purgarr is not an "official" *arr application (like Sonarr, Radarr, etc.). It's just something I needed.

## Huh? What do you mean "delete"?

I know the "D word" is blasphemy in some circles, but to be honest, in my daily life, I find myself watching most things once and then never watching them again. This problem is made worse when you have multiple people who can access your media downloading setup.

In my experience, the amount of storage you'd need to avoid deleting anything is astronomical. That may be what you're aiming for and if that's the case, power to you. Practically however, I find that no matter how much storage I have it always fills up eventually, and once its full, you start playing the "what can I delete" game every time you want to download something.

This ruins all the fun of having an elaborate download setup with a huge amount of storage. If you can't just download whatever you want whenever you want, what's the point!

## How does it work?

Purgarr is designed to be run on a schedule (e.g. once a day). Purgarr scans other media services via their API and looks for content older than a certain age. It deletes anything matching this criteria. The way this works is slightly different depending on the type of content:

 - Movies
   - Movies are outright removed from Radarr along with the contents on disk.
   - The assumption is that if you want to watch a movie again you can simply re-download it.
 - TV Series
   - TV series are purged on a per-episode basis. Episodes that are older than X days are deleted and marked as "Unmonitored".
   - If the TV Series is empty after purging, it is NOT removed from Sonarr, under the assumption you may want to download future seasons or keep track of the show later.


### What if I want to keep some things?

You can give any content a label to have it excluded from the purge. For example, I add a label called `do-not-purge` to Movies and TV Series that I want to keep. The name of the tag is configurable in Purgarr's settings.

## How do I run it?

Its easiest to run in Docker because it automatically runs the script in a Node.js container on a schedule. However, I haven't pushed this image to DockerHub or anything, so you'll have to clone this repo.

If you don't want to use Docker, that's fine, you just have to call `npm start` against the project. Feel free to bind that into your own scheduling mechanisms.

I recommend you fork this repo and commit any configuration changes you want to make (e.g. to `crontab.properties`) to persist them. I also recommend you leave `DRY_RUN=true` for a few days until you are confident Purgarr will make the changes you expect.

## Configuration

There are 2 mechanisms for configuring the tool. You can either use a `.env` file, or expose the configuration as environment variables.

If you want to use a `.env` file, copy `sample.env` and rename it to `.env`, then fill in the values you want. Leaving a value blank will use its default value.

There is also a `crontab.properties` file which is the crontab used by the Docker image, which you can edit if you want to change the schedule (default is every day at 4AM).

Below is a list of all the configuration values.

| Variable name | Description | Default value |
| ------------- | ----------- | ------------- |
| RADARR_BASE_URI | URI for your Radarr instance, relative to wherever Purgarr is running. For example, if Purgarr is running in docker, it might be able to access Radarr directly using something like `http://radarr:7878`, or even `http://localhost:7878` if you are just running it locally. | This is a required variable. |
| RADARR_API_KEY | API key for accessing Radarr's API. You can find this in Radarr under `Settings > General`. | This is a required variable. |
| RADARR_EXCLUSION_TAG_NAME | Name of the tag in Radarr used to exclude movies from the purge. | This is a required variable. |
| SONARR_BASE_URI | URI for your Sonarr instance, relative to wherever Purgarr is running. For example, if Purgarr is running in docker, it might be able to access Sonarr directly using something like `http://sonarr:8989`, or even `http://localhost:8989` if you are just running it locally. | This is a required variable. |
| SONARR_API_KEY | API key for accessing Sonarr's API. You can find this in Sonarr under `Settings > General`. | This is a required variable. |
| SONARR_EXCLUSION_TAG_NAME | Name of the tag in Sonarr used to exclude tv series from the purge. | This is a required variable. |
| DRY_RUN | Whether Purgarr should perform a "dry run" when running. Dry runs do not delete any content, they just log what _would_ be deleted. <br>**Note: This setting is ENABLED unless you explicitly disable it.** Purgarr is designed to be failsafe. It won't delete anything until you turn this setting off. | True |
| MAX_AGE_DAYS | The maximum age (as a number of days) for content to be kept. Anything older than this will be purged. | 90 |

## Possible future changes
  - Support only enabling certain services
  - Separate MaxAge per service, with a default value for the rest
