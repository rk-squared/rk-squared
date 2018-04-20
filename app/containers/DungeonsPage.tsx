import * as React from 'react';
import { connect } from 'react-redux';

import { World } from '../actions/worlds';
import DungeonsList from '../components/DungeonsList';
import { IState } from '../reducers';

interface Props {
  worlds: {
    [id: number]: World;
  };
}

export class DungeonsPage extends React.Component<Props> {
  render() {
    const { worlds } = this.props;
    return (
      <div>
        {worlds == null
          ? <p>No dungeons have been loaded. Please check your proxy settings and restart FFRK.</p>
          : <DungeonsList worlds={worlds}/>
        }
      </div>
    );
  }
}

export default connect(
  (state: IState) => ({
    worlds: state.worlds.worlds
  })
)(DungeonsPage);
