import * as React from 'react';

import { descriptions, getSorter, World, WorldCategory } from '../actions/worlds';

import * as _ from 'lodash';

interface Props {
  worlds: {
    [id: number]: World;
  };
  category: WorldCategory;
}

type DungeonsByCategory = Array<[string, World[]]>;

function getSortedDungeons(worlds: {[id: number]: World}, category: WorldCategory): DungeonsByCategory | null {
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
  ) as any as DungeonsByCategory;

  // Sort within each subcategory.
  const sorter = getSorter(category);
  for (const i of result) {
    i[1] = sorter(i[1]);
  }

  return result;
}

export class DungeonCategoryList extends React.Component<Props> {
  render() {
    const { worlds, category } = this.props;
    const bySubcategory = getSortedDungeons(worlds, category);
    if (bySubcategory == null) {
      return null;
    }
    const id = `dungeon-category-${category}`;
    const collapseId = id + '-collapse';
    const headerId = id + '-header';
    return (
      <div className="card" id={id}>
        <div className="card-header" id={headerId}>
          <h5 className="mb-0">
            <button className="btn btn-link" type="button" data-toggle="collapse" data-target={'#' + collapseId}
                    aria-expanded="false" aria-controls={'#' + collapseId}>
              {descriptions[category]}
            </button>
          </h5>
        </div>

        <div id={collapseId} className="collapse show" aria-labelledby="headingOne" data-parent={'#' + id}>
          <div className="card-body">
            {bySubcategory.map(([subcategory, subWorlds], i) => (
              <div key={i}>
                <h6>{subcategory}</h6>
                <ul>
                  {subWorlds.map((w, j) => (
                    <li key={j}>{w.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
