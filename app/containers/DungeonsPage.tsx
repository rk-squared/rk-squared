import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { loadDungeons } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { DungeonsList } from '../components/DungeonsList';
import ItemTypeChecklist from '../components/ItemTypeChecklist';
import { IState } from '../reducers';
import { Page } from './Page';

const styles = require('./DungeonsPage.scss');

interface Props {
  worlds: {
    [id: number]: World;
  };
  missingWorlds: number[];
  dispatch: Dispatch<IState>;
}

export class DungeonsPage extends React.Component<Props> {
  // noinspection UnterminatedStatementJS
  handleLoad = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const { missingWorlds, dispatch } = this.props;
    dispatch(loadDungeons(missingWorlds));
  }

  render() {
    const { worlds, missingWorlds } = this.props;
    const missingPrompt = missingWorlds.length === 1 ? '1 realm or event' : `${missingWorlds.length} realms and events`;
    return (
      <Page title="Dungeon Tracker">
        {missingWorlds.length !== 0 &&
          <p>
            Dungeons for {missingPrompt} have not been loaded.{' '}
            <a href="#" onClick={this.handleLoad}>Load now?</a>
          </p>
        }
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
    worlds: state.worlds.worlds,
    missingWorlds:
      Object.keys(state.worlds.worlds || {})
        .map(i => +i)
        .filter(i => !state.dungeons.byWorld[i])
  })
)(DungeonsPage);
