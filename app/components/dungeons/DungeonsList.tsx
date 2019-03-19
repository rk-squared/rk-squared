import * as React from 'react';

import classNames from 'classnames';

import { sortOrder, World, WorldCategory } from '../../actions/worlds';
import { DungeonCategoryList } from './DungeonCategoryList';

interface Props {
  className?: string;
  worlds: {
    [id: number]: World;
  };
  isAnonymous?: boolean;
}

export class DungeonsList extends React.PureComponent<Props> {
  render() {
    const { className, worlds, isAnonymous } = this.props;
    return (
      <div className={classNames(className, 'accordion')}>
        {sortOrder.map((category: WorldCategory, i: number) => (
          <DungeonCategoryList
            worlds={worlds}
            category={category}
            isAnonymous={isAnonymous}
            key={i}
          />
        ))}
      </div>
    );
  }
}
