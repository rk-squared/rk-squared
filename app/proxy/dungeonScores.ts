import { Store } from 'redux';

import { DungeonScoreType, setDungeonScore } from '../actions/dungeonScores';
import * as schemas from '../api/schemas';
import { GradeScoreType } from '../api/schemas/battles';
import { IState } from '../reducers';
import { Handler } from './types';

function gradeToScoreType(type: GradeScoreType): DungeonScoreType | null {
  switch (type) {
    case GradeScoreType.DecreasedHp:
      return DungeonScoreType.TotalDamage;
    case GradeScoreType.DecreasedHpAndClearTime:
      return DungeonScoreType.PercentHpOrClearTime;
  }
  return null;
}

const dungeonScoresHandler: Handler = {
  battles(data: schemas.Battles, store: Store<IState>) {
    for (const i of data.battles) {
      if (i.user_clear_time) {
        store.dispatch(
          setDungeonScore(i.dungeon_id, {
            type: DungeonScoreType.ClearTime,
            time: i.user_clear_time,
            won: true,
          }),
        );
      } else if (i.grade_score_type && i.grade_score) {
        const type = gradeToScoreType(i.grade_score_type);
        if (type) {
          store.dispatch(
            setDungeonScore(i.dungeon_id, {
              type,
              time: i.grade_score.elapsedBattleTimeFromBeginning,
              totalDamage: i.grade_score.decreasedAmountOfHp,
              maxHp: i.grade_score.maxHp,
              won: i.grade_score.isDefeated,
            }),
          );
        }
      }
    }
  },
};

export default dungeonScoresHandler;
