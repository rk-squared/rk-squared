import DesktopHomePage from '../containers/DesktopHomePage';
import DropTrackerPage from '../containers/DropTrackerPage';
import DungeonScoresPage from '../containers/DungeonScoresPage';
import DungeonsPage from '../containers/DungeonsPage';
import OptionsPage from '../containers/OptionsPage';
import RecordMateriaPage from '../containers/RecordMateriaPage';
import RelicDrawsPage from '../containers/RelicDrawsPage';
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
    component: RecordMateriaPage,
    description: 'Record Materia',
    path: '/recordMateria',
  },
  {
    component: SoulBreaksPage,
    description: 'Soul Breaks',
    path: '/soulBreaks',
  },
  {
    component: RelicDrawsPage,
    description: 'Relic Draws',
    path: '/relicDraws',
  },
  {
    component: OptionsPage,
    description: 'Options',
    path: '/options',
  },
  {
    component: DesktopHomePage,
    description: null,
    path: '/',
  },
];

export default routes;
