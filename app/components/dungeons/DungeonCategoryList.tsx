import * as React from 'react';

import * as _ from 'lodash';

import { descriptions, getSorter, World, WorldCategory } from '../../actions/worlds';
import { CollapsibleCard } from '../common/CollapsibleCard';
import { MaybeWrap } from '../common/MaybeWrap';
import DungeonCard from './DungeonCard';
import WorldBadge from './WorldBadge';
import WorldPrizeList from './WorldPrizeList';

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

interface Props {
  worlds: {
    [id: number]: World;
  };
  category: WorldCategory;
}

// TODO: Include banner images?
// E.g.:
// http://ffrk.denagames.com/dff/static/lang/ww/compile/en/image/crystal_tower/event_list/banner/7.png
// (determined by crystal_tower_bundles.0.bundle_id???)
// http://ffrk.denagames.com/dff/static/lang/ww/compile/en/image/event/3026.png

/**
 * Worlds grouped by subcategory.
 *
 * Subcategory may be ''.
 */
type WorldsBySubcategory = Array<[string, World[]]>;

/**
 * Gets the list of worlds, sorted and grouped by subcategory, for the given
 * WorldCategory.
 */
function getSortedWorlds(
  worlds: { [id: number]: World },
  category: WorldCategory,
): WorldsBySubcategory | null {
  // Known subcategories and their sort orders
  const subcategories: { [s: string]: number } = {};
  // Worlds sorted by subcategory
  const bySubcategory: { [s: string]: World[] } = {};

  _.forEach(worlds, w => {
    if (w.category === category) {
      // FIXME: Filter out worlds that aren't open?
      const subcategory = w.subcategory || '';
      subcategories[subcategory] = w.subcategorySortOrder || 0;
      bySubcategory[subcategory] = bySubcategory[subcategory] || [];
      bySubcategory[subcategory].push(w);
    }
  });

  if (_.isEmpty(bySubcategory)) {
    return null;
  }
  let result = _.toPairs(bySubcategory);

  // Sort subcategories - by subcategory sort order if possible, and by
  // subcategory name if not.  Blank goes first.
  result = (_.sortBy(result, [
    (i: any) => (i[0] === '' ? -Infinity : subcategories[i[0]]),
    (i: any) => i[0],
  ]) as any) as WorldsBySubcategory;

  // Sort within each subcategory.
  const sorter = getSorter(category);
  for (const i of result) {
    i[1] = sorter(i[1]);
  }

  return result;
}

const DungeonCategoryTitle = ({
  category,
  title,
  worlds,
}: {
  category?: WorldCategory;
  title: string;
  worlds: World[];
}) => (
  <div className="d-flex justify-content-between align-items-center">
    <div>
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

export class DungeonCategoryList extends React.PureComponent<Props> {
  render() {
    const { worlds, category } = this.props;
    const bySubcategory = getSortedWorlds(worlds, category);
    if (bySubcategory == null) {
      return null;
    }
    const categoryWorlds = _.flatten(bySubcategory.map(([subcategory, subWorlds]) => subWorlds));
    const id = `dungeon-category-${category}`;
    return (
      <CollapsibleCard
        id={id}
        title={() => (
          <DungeonCategoryTitle
            category={category}
            title={descriptions[category]}
            worlds={categoryWorlds}
          />
        )}
      >
        <div className="accordion">
          <WorldPrizeList worlds={categoryWorlds} />
          {bySubcategory.map(([subcategory, subWorlds], i) => (
            <MaybeWrap
              component={CollapsibleCard}
              test={subcategory !== ''}
              id={`${id}-${i}`}
              key={i}
              title={() => <DungeonCategoryTitle title={subcategory} worlds={subWorlds} />}
            >
              <div>
                {subcategory !== '' && <WorldPrizeList worlds={subWorlds} />}
                <div className="accordion">
                  {subWorlds.map((w, j) => (
                    <DungeonCard world={w} key={j} />
                  ))}
                </div>
              </div>
            </MaybeWrap>
          ))}
        </div>
      </CollapsibleCard>
    );
  }
}
