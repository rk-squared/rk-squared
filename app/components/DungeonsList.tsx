import * as React from 'react';

import { sortOrder, World, WorldCategory } from '../actions/worlds';
import DungeonCategoryList from './DungeonCategoryList';

interface Props {
  worlds: {
    [id: number]: World;
  };
}

export default class DungeonsList extends React.Component<Props> {
  render() {
    const { worlds } = this.props;
    return (
      <div className="accordion">
        {
          sortOrder.map((category: WorldCategory, i: number) =>
            <DungeonCategoryList worlds={worlds} category={category} key={i}/>
          )
        }
      </div>
    );
  }
}
