import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { Dungeon } from '../actions/dungeons';
import {
  compareScore,
  DungeonScore,
  estimateScore,
  shouldUseEstimatedScore,
} from '../actions/dungeonScores';
import { getSorter, World, WorldCategory } from '../actions/worlds';
import { DarkOdinWorldId } from '../api/schemas/dungeons';
import { IState } from '../reducers';
import { DungeonState, getDungeonsForWorld } from '../reducers/dungeons';
import { DungeonScoreState } from '../reducers/dungeonScores';
import { WorldState } from '../reducers/worlds';
import { compareWithUndefined } from '../utils/typeUtils';

export interface DungeonWithScore extends Dungeon {
  score: DungeonScore | undefined;
  estimatedScore: DungeonScore | undefined;
}

export interface MagiciteDungeonWithScore extends DungeonWithScore {
  stars: number | undefined;
  element: string;
  worldId: number; // useful for sorting
}

export interface TormentWorldWithScore extends World {
  d240?: DungeonWithScore;
  d280?: DungeonWithScore;
  dUnknown?: DungeonWithScore;
}

function getWorlds(worldsState: WorldState, category: WorldCategory) {
  return getSorter(category)(_.values(worldsState.worlds).filter(i => i.category === category));
}

function getDungeonsWithScoreForWorld(
  dungeonState: DungeonState,
  scoresState: DungeonScoreState,
  world: World,
): DungeonWithScore[] {
  const dungeons = getDungeonsForWorld(dungeonState, world.id);
  if (!dungeons) {
    return [];
  }
  return dungeons.map(d => ({
    ...d,
    score: scoresState.scores[d.id],
    estimatedScore: estimateScore(d, world) || undefined,
  }));
}

const magiciteStarsByDifficulty: { [difficulty: number]: number } = {
  250: 3,
  300: 4,
  400: 5,
};

function getHighestUnlocked(dungeons: MagiciteDungeonWithScore[]): number | null {
  for (let stars = 5; stars >= 3; stars--) {
    if (_.some(dungeons, i => i.stars && i.stars >= stars && i.isUnlocked)) {
      return stars;
    }
  }
  return null;
}

export function getEffectiveScore(dungeon: DungeonWithScore) {
  return shouldUseEstimatedScore(dungeon.score, dungeon.estimatedScore)
    ? dungeon.estimatedScore
    : dungeon.score;
}

export function compareDungeonsWithScore(
  dungeonA: DungeonWithScore | undefined,
  dungeonB: DungeonWithScore | undefined,
): number {
  const scoreA = dungeonA ? getEffectiveScore(dungeonA) : undefined;
  const scoreB = dungeonB ? getEffectiveScore(dungeonB) : undefined;
  return compareWithUndefined(compareScore)(scoreA, scoreB);
}

export const getMagiciteScores = createSelector<
  IState,
  WorldState,
  DungeonState,
  DungeonScoreState,
  MagiciteDungeonWithScore[]
>(
  [
    (state: IState) => state.worlds,
    (state: IState) => state.dungeons,
    (state: IState) => state.dungeonScores,
  ],
  (
    worldsState: WorldState,
    dungeonsState: DungeonState,
    scoresState: DungeonScoreState,
  ): MagiciteDungeonWithScore[] => {
    const worlds = getWorlds(worldsState, WorldCategory.Magicite);

    let dungeons: MagiciteDungeonWithScore[] = _.flatten(
      worlds
        .filter(w => w.id !== DarkOdinWorldId)
        .map(w =>
          getDungeonsWithScoreForWorld(dungeonsState, scoresState, w).map(d => ({
            ...d,
            stars: magiciteStarsByDifficulty[d.difficulty],
            element: w.name,
            worldId: w.id,
          })),
        ),
    );

    const highestUnlocked = getHighestUnlocked(dungeons);
    if (highestUnlocked && highestUnlocked < 5) {
      dungeons = _.filter(dungeons, i => !i.stars || i.stars <= highestUnlocked);
    }
    dungeons = _.sortBy(dungeons, i => (i.stars ? -i.stars : undefined));

    return dungeons;
  },
);

export const getTormentScores = createSelector<
  IState,
  WorldState,
  DungeonState,
  DungeonScoreState,
  TormentWorldWithScore[]
>(
  [
    (state: IState) => state.worlds,
    (state: IState) => state.dungeons,
    (state: IState) => state.dungeonScores,
  ],
  (
    worldsState: WorldState,
    dungeonsState: DungeonState,
    scoresState: DungeonScoreState,
  ): TormentWorldWithScore[] => {
    return getWorlds(worldsState, WorldCategory.Torment).map(w => {
      const dungeons: { [dungeonId: number]: DungeonWithScore } = _.keyBy(
        getDungeonsWithScoreForWorld(dungeonsState, scoresState, w),
        'difficulty',
      );
      return {
        ...w,
        d240: dungeons[240],
        d280: dungeons[280],
        dUnknown: dungeons[0],
      };
    });
  },
);
