import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { loadDungeons } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { IState } from '../reducers';

import { BrowserLink } from '../components/common/BrowserLink';
import { DungeonsList } from '../components/dungeons/DungeonsList';
import ItemTypeChecklist from '../components/dungeons/ItemTypeChecklist';
import LoadMissingPrompt from '../components/shared/LoadMissingPrompt';
import { progressKey } from '../sagas/loadDungeons';
import { Page } from './Page';

const styles = require('./DungeonsPage.scss');

interface Props {
  worlds: {
    [id: number]: World;
  };
  missingWorlds: number[];
  dispatch: Dispatch;
}

export class DungeonsPage extends React.Component<Props> {
  handleLoad = () => {
    const { missingWorlds, dispatch } = this.props;
    dispatch(loadDungeons(missingWorlds));
  };

  render() {
    const { worlds, missingWorlds } = this.props;
    return (
      <Page title="Dungeons">
        <LoadMissingPrompt
          missingCount={missingWorlds.length}
          missingText="Dungeons for %s have not been loaded."
          countText="realm or event"
          countPluralText="realms and events"
          loadingText="Loading dungeons"
          onLoad={this.handleLoad}
          progressKey={progressKey}
        />

        {worlds == null ? (
          <p>No dungeons have been loaded. Please check your proxy settings and restart FFRK.</p>
        ) : (
          <div className="row">
            <div className="col-sm-9">
              <DungeonsList worlds={worlds} isAnonymous={!process.env.IS_ELECTRON} />
              <p className="text-muted text-right mb-0">
                <small>
                  Icons by{' '}
                  <BrowserLink href="https://game-icons.net/" className="text-muted">
                    game-icons.net
                  </BrowserLink>
                </small>
              </p>
            </div>
            <div className={`col-sm-3 ${styles.right}`}>
              <ItemTypeChecklist title="Rewards" />
            </div>
          </div>
        )}
      </Page>
    );
  }
}

export default connect((state: IState) => ({
  worlds: state.worlds.worlds,
  // FIXME: Use reselect (I think)
  missingWorlds: Object.keys(state.worlds.worlds || {})
    .map(i => +i)
    .filter(i => (state.worlds.worlds || {})[i].isUnlocked && !state.dungeons.byWorld[i]),
}))(DungeonsPage);
