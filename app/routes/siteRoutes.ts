import { AppMoreInfoPage } from '../containers/AppMoreInfoPage';
import DungeonsPage from '../containers/DungeonsPage';
import RecordMateriaPage from '../containers/RecordMateriaPage';
import SiteHomePage from '../containers/SiteHomePage';
import SoulBreaksPage from '../containers/SoulBreaksPage';
import { RouteItem } from './types';

const routes: RouteItem[] = [
  {
    component: DungeonsPage,
    description: 'Dungeons',
    path: '/dungeons',
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
    component: AppMoreInfoPage,
    description: null,
    path: '/appMoreInfo',
  },
  {
    component: SiteHomePage,
    description: null,
    path: '/',
  },
];

export default routes;
