import { getCollection } from 'astro:content';
import { aircraftRules, controllerOptions, goalRules, rankMatches } from '../../../lib/controllerMatches';
import { formatSettingsType } from '../../../utils/controllerSettings';

export async function getStaticPaths() {
  const configs = await getCollection('controllers');
  const videos = await getCollection('videos');
  const configData = configs.map(({ id, data }) => ({ ...data, detailUrl: `/controllers/download/xml/${id}/` }));
  const videoData = videos.map(({ id, data }) => ({ ...data, detailUrl: `/videos/${id}/` }));
  return controllerOptions(configs).flatMap(({ controller, key }) =>
    Object.keys(aircraftRules).flatMap((aircraftType) => Object.keys(goalRules).map((goal) => {
      const results = rankMatches(configData, videoData, { controller, aircraftType, goal });
      return {
        params: { match: `${key}--${aircraftType}--${goal}` },
        props: { results: {
          configs: results.configs.map(({ config, score }) => ({ score, config: {
            controller: config.controller, settingsType: formatSettingsType(config.settingsType),
            aircraft: config.aircraft || '', filename: config.filename, detailUrl: config.detailUrl,
          } })),
          videos: results.videos.map(({ video, score }) => ({ score, video: {
            title: video.title, thumbnail: video.thumbnail, detailUrl: video.detailUrl, publishedAt: video.publishedAt,
          } })),
        } },
      };
    }))
  );
}

export function GET({ props }: { props: { results: unknown } }) {
  return Response.json(props.results);
}