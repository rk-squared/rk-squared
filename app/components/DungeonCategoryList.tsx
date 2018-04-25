import * as React from 'react';

import { descriptions, getSorter, World, WorldCategory } from '../actions/worlds';
import { CollapsibleCard } from './CollapsibleCard';
import DungeonCard from './DungeonCard';
import { MaybeWrap } from './MaybeWrap';
import WorldBadge from './WorldBadge';

import * as _ from 'lodash';

interface Props {
  worlds: {
    [id: number]: World;
  };
  category: WorldCategory;
}

// FIXME: Include banner images?
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
function getSortedWorlds(worlds: {[id: number]: World}, category: WorldCategory): WorldsBySubcategory | null {
  // Known subcategories and their sort orders
  const subcategories: {[s: string]: number} = {};
  // Worlds sorted by subcategory
  const bySubcategory: {[s: string]: World[]} = {};

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
  result = _.sortBy(result,
    [(i: any) => i[0] === '' ? -Infinity : subcategories[i[0]], (i: any) => i[0]]
  ) as any as WorldsBySubcategory;

  // Sort within each subcategory.
  const sorter = getSorter(category);
  for (const i of result) {
    i[1] = sorter(i[1]);
  }

  return result;
}

const DungeonCategoryTitle = ({title, worlds}: {title: string, worlds: World[]}) => (
  <span>
    {title}
    <WorldBadge worlds={worlds}/>
  </span>
);

export class DungeonCategoryList extends React.Component<Props> {
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
        title={() => <DungeonCategoryTitle title={descriptions[category]} worlds={categoryWorlds}/>}
      >
        <div className="accordion">
          {bySubcategory.map(([subcategory, subWorlds], i) => (
            <MaybeWrap
              component={CollapsibleCard} test={subcategory !== ''}
              id={`${id}-${i}`} key={i}
              title={() => <DungeonCategoryTitle title={subcategory} worlds={subWorlds}/>}
            >
              <div className="accordion">
                {subWorlds.map((w, j) => (
                  <DungeonCard world={w} key={j}/>
                ))}
              </div>
            </MaybeWrap>
          ))}
        </div>
      </CollapsibleCard>
    );
  }
}
