import AbilitiesPage from '../containers/AbilitiesPage';
import { AppMoreInfoPage } from '../containers/AppMoreInfoPage';
import ChainSoulBreaksPage from '../containers/ChainSoulBreaksPage';
import DungeonsPage from '../containers/DungeonsPage';
import FutureAbilitiesPage from '../containers/FutureAbilitiesPage';
import RecordMateriaPage from '../containers/RecordMateriaPage';
import RelicDrawsPage from '../containers/RelicDrawsPage';
import SharedSoulBreaksPage from '../containers/SharedSoulBreaksPage';
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
