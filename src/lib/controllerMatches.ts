export const aircraftRules: Record<string, string[]> = {
  airliner: ['airliner', 'a320', 'a321', 'a330', 'a350', 'a380', 'boeing', 'airbus', 'jetliner'],
  general: ['ga', 'general aviation', 'cessna', 'piper', 'beech', 'bonanza', 'comanche'],
  fighter: ['fighter', 'military', 'combat', 'f-14', 'f-18', 'f18', 'f-16', 'f16', 'jet fighter'],
  turboprop: ['turboprop', 'tbm', 'king air', 'pc-12', 'pc12', 'atr', 'dash', 'q400'],
  'multi-engine': ['2 engines', '4 engines', 'multi', 'twin engine', 'four engine'],
  custom: ['custom', 'generic', 'msfs custom'],
};

export const goalRules: Record<string, string[]> = {
  setup: ['setup', 'install', 'configuration', 'controls', 'bindings', 'calibration', 'throttle issue', 'workaround'],
  'airliner-ops': ['airliner', 'a320', 'a321', 'boeing', 'fms', 'mcdu', 'cold and dark', 'liner'],
  navigation: ['ifr', 'vor', 'ndb', 'lnav', 'rnav', 'ils', 'sid', 'star', 'navigraph', 'flight plan', 'autopilot'],
  landing: ['landing', 'takeoff', 'flare', 'approach', 'touchdown', 'taxi', 'crosswind'],
  sightseeing: ['sightseeing', 'poi', 'landmark', 'bush trip', 'world update', 'scenery', 'vfr'],
};

interface Selection { controller: string; aircraftType: string; goal: string }
interface Config { controller: string; settingsType: string; aircraft?: string; tags: string[]; description: string }
interface Video { title: string; description: string; tags: string[]; publishedAt: Date | string }

const keywordPatterns = new Map<string, RegExp>();

export function controllerOptions(entries: Array<{ id: string; data: { controller: string } }>) {
  const sorted = [...entries].sort((first, second) => first.id.localeCompare(second.id));
  return Array.from(new Set(sorted.map((entry) => entry.data.controller))).sort()
    .map((controller) => ({ controller, key: sorted.find((entry) => entry.data.controller === controller)!.id }));
}

function hits(text: string, words: string[]): number {
  return words.filter((word) => {
    if (!keywordPatterns.has(word)) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keywordPatterns.set(word, new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i'));
    }
    return keywordPatterns.get(word)!.test(text);
  }).length;
}

export function scoreConfig(config: Config, selected: Selection): number {
  if (config.controller.toLowerCase() !== selected.controller.toLowerCase()) return 0;
  const text = [config.settingsType, config.aircraft, ...config.tags, config.description].join(' ');
  const aircraftScore = hits(text, aircraftRules[selected.aircraftType] || []) ? 6 : 0;
  const goalHits = hits(text, goalRules[selected.goal] || []);
  return 10 + aircraftScore + (goalHits ? Math.min(5, goalHits + 1) : 0);
}

export function scoreVideo(video: Video, selected: Selection): number {
  const text = [video.title, video.description, ...video.tags].join(' ');
  const tokens = selected.controller.toLowerCase().replace(/[^a-z0-9.\s-]/g, ' ').split(/\s+/)
    .filter((token) => token.length > 2 && !['flight', 'controls'].includes(token));
  const aircraftHits = hits(text, aircraftRules[selected.aircraftType] || []);
  const goalHits = hits(text, goalRules[selected.goal] || []);
  return (hits(text, tokens) ? 3 : 0) + (aircraftHits ? Math.min(6, aircraftHits + 1) : 0) + (goalHits ? Math.min(7, goalHits + 2) : 0);
}

export function rankMatches<ConfigType extends Config, VideoType extends Video>(configs: ConfigType[], videos: VideoType[], selected: Selection) {
  return {
    configs: configs.map((config) => ({ config, score: scoreConfig(config, selected) }))
      .filter((entry) => entry.score > 0).sort((first, second) => second.score - first.score).slice(0, 6),
    videos: videos.map((video) => ({ video, score: scoreVideo(video, selected) }))
      .filter((entry) => entry.score > 0)
      .sort((first, second) => second.score - first.score || new Date(second.video.publishedAt).getTime() - new Date(first.video.publishedAt).getTime()).slice(0, 8),
  };
}