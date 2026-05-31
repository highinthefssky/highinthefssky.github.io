import type { CommunityPackage } from '../lib/community-folder';

export const communityFolderSamples: CommunityPackage[] = [
  {
    id: 'a320-clean-livery',
    name: 'A320 Clean Livery',
    folder: 'Community/A320 Clean Livery',
    files: [
      'SimObjects/Airplanes/Asobo_A320_NEO/TEXTURE/ALBD.PNG.DDS',
      'SimObjects/Airplanes/Asobo_A320_NEO/TEXTURE/roughness.PNG.DDS',
    ],
    notes: 'A typical livery package.',
  },
  {
    id: 'a320-weathered-livery',
    name: 'A320 Weathered Livery',
    folder: 'Community/A320 Weathered Livery',
    files: [
      'SimObjects/Airplanes/Asobo_A320_NEO/TEXTURE/ALBD.PNG.DDS',
      'SimObjects/Airplanes/Asobo_A320_NEO/TEXTURE/specular.PNG.DDS',
    ],
    notes: 'Shares a texture path with the clean livery and will trigger a conflict.',
  },
  {
    id: 'airport-lighting-fix',
    name: 'Airport Lighting Fix',
    folder: 'Community/Airport Lighting Fix',
    files: [
      'Scenery/Global/Lighting/lightmap.xml',
      'Scenery/Global/Lighting/lightmap.bgl',
    ],
  },
  {
    id: 'panel-audio-pack',
    name: 'Panel Audio Pack',
    folder: 'Community/Panel Audio Pack',
    files: [
      'html_ui/Pages/VCockpit/Instruments/AudioPanel.js',
      'Sound/voice-override.wav',
    ],
  },
];
