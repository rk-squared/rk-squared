import * as React from 'react';

import { World, WorldCategory } from '../../actions/worlds';
import WorldBadge from './WorldBadge';

const styles = require('./DungeonCategoryTitle.scss');

const categoryImages: { [category: string]: string } = {
  [WorldCategory.CrystalTower]: require('../../images/game-icons/white-tower.svg'),
  [WorldCategory.Event]: require('../../images/game-icons/book-cover.svg'),
  [WorldCategory.JumpStart]: require('../../images/game-icons/lob-arrow.svg'),
  [WorldCategory.PowerUpMote]: require('../../images/game-icons/orb-direction.svg'),
  [WorldCategory.Magicite]: require('../../images/game-icons/triple-yin.svg'),
  [WorldCategory.Newcomer]: require('../../images/game-icons/big-egg.svg'),
  [WorldCategory.Nightmare]: require('../../images/game-icons/spectre.svg'),
  [WorldCategory.Raid]: require('../../images/game-icons/swords-emblem.svg'),
  [WorldCategory.Realm]: require('../../images/game-icons/closed-doors.svg'),
  [WorldCategory.Record]: require('../../images/game-icons/galleon.svg'),
  [WorldCategory.Renewal]: require('../../images/game-icons/calendar.svg'),
  [WorldCategory.SpecialEvent]: require('../../images/game-icons/star-formation.svg'),
  [WorldCategory.Torment]: require('../../images/game-icons/daemon-skull.svg'),
};

export const DungeonCategoryTitle = ({
  category,
  title,
  worlds,
}: {
  category?: WorldCategory;
  title: string;
  worlds: World[];
}) => (
  <div className={`d-flex justify-content-between align-items-center ${styles.component}`}>
    <div className={styles.titleText}>
      {category != null && (
        <img
          src={categoryImages[category]}
          width={40}
          height={40}
          style={{ paddingRight: '0.5em' }}
          alt=""
        />
      )}
      {title}
    </div>
    <WorldBadge worlds={worlds} />
  </div>
);
