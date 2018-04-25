import * as React from 'react';
import { connect } from 'react-redux';

import { World } from '../actions/worlds';
import { DungeonsList } from '../components/DungeonsList';
import ItemTypeChecklist from '../components/ItemTypeChecklist';
import { IState } from '../reducers';
import { Page } from './Page';

const styles = require('./DungeonPage.scss');

interface Props {
  worlds: {
    [id: number]: World;
  };
}

export class DungeonsPage extends React.Component<Props> {
  render() {
    const { worlds } = this.props;
    return (
      <Page title="Dungeon Tracker">
        {worlds == null
          ? <p>No dungeons have been loaded. Please check your proxy settings and restart FFRK.</p>
          : <div className="row">
              <DungeonsList className="col-sm-9" worlds={worlds}/>
              <div className={`col-sm-3 ${styles.right}`}>
                <ItemTypeChecklist title="Rewards"/>
              </div>
            </div>
        }
      </Page>
    );
  }
}

export default connect(
  (state: IState) => ({
    worlds: state.worlds.worlds
  })
)(DungeonsPage);
