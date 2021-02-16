import AbilitiesPage from '../containers/AbilitiesPage';
import ChainSoulBreaksPage from '../containers/ChainSoulBreaksPage';
import DesktopHomePage from '../containers/DesktopHomePage';
import DropTrackerPage from '../containers/DropTrackerPage';
import DungeonScoresPage from '../containers/DungeonScoresPage';
import DungeonsPage from '../containers/DungeonsPage';
import FutureAbilitiesPage from '../containers/FutureAbilitiesPage';
import OptionsPage from '../containers/OptionsPage';
import RecordMateriaPage from '../containers/RecordMateriaPage';
import RelicDrawsPage from '../containers/RelicDrawsPage';
import SharedSoulBreaksPage from '../containers/SharedSoulBreaksPage';
import SoulBreaksPage from '../containers/SoulBreaksPage';
import { RouteItem } from './types';

const routes: RouteItem[] = [
  {
    component: DropTrackerPage,
    description: 'Drops',
    path: '/dropTracker',
  },
  {
    component: DungeonsPage,
    description: 'Dungeons',
    path: '/dungeons',
  },
  {
    component: DungeonScoresPage,
    description: 'Scores',
    path: '/dungeonScores',
  },
  {
    component: AbilitiesPage,
    description: 'Abilities',
    path: '/abilities',
    children: [
      {
        component: FutureAbilitiesPage,
        description: 'Future',
        path: '/abilities/future',
      },
    ],
  },
  {
    component: RecordMateriaPage,
    description: 'Record Materia',
    path: '/recordMateria',
  },
  {
    component: SoulBreaksPage,
    description: 'Soul Breaks',
    path: '/soulBreaks',
    children: [
      {
        component: ChainSoulBreaksPage,
        description: 'Chains',
        path: '/soulBreaks/chains',
      },
      {
        component: SharedSoulBreaksPage,
        description: 'Shared',
        path: '/soulBreaks/shared',
      },
    ],
  },
  {
    component: RelicDrawsPage,
    description: 'Relic Draws',
    path: '/relicDraws',
  },
  {
    component: OptionsPage,
    description: 'Options',
    // NOTE: Duplicated in CertWarningsDisplay
    path: '/options',
  },
  {
    component: DesktopHomePage,
    description: null,
    path: '/',
  },
];

export default routes;
