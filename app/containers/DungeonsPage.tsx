import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { loadDungeons } from '../actions/dungeons';
import { Progress } from '../actions/progress';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { hasSessionState } from '../reducers/session';

import { BrowserLink } from '../components/common/BrowserLink';
import { ProgressBar } from '../components/common/ProgressBar';
import { DungeonsList } from '../components/dungeons/DungeonsList';
import ItemTypeChecklist from '../components/dungeons/ItemTypeChecklist';
import { Page } from './Page';

const styles = require('./DungeonsPage.scss');

interface Props {
  worlds: {
    [id: number]: World;
  };
  missingWorlds: number[];
  progress: Progress;
  hasSession: boolean;
  dispatch: Dispatch;
}

export class DungeonsPage extends React.Component<Props> {
  handleLoad = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const { missingWorlds, dispatch } = this.props;
    dispatch(loadDungeons(missingWorlds));
  };

  render() {
    const { worlds, missingWorlds, progress, hasSession } = this.props;
    const missingPrompt =
      missingWorlds.length === 1 ? '1 realm or event' : `${missingWorlds.length} realms and events`;
    return (
      <Page title="Dungeon Tracker">
        {missingWorlds.length !== 0 && hasSession && !progress && (
          <p>
            Dungeons for {missingPrompt} have not been loaded.{' '}
            <a href="#" onClick={this.handleLoad}>
              Load now?
            </a>
          </p>
        )}

        {progress && (
          <div className="mb-2">
            Loading dungeons for {progress.current + 1} of {progress.max}&hellip;
            <ProgressBar progress={progress} />
          </div>
        )}

        {worlds == null ? (
          <p>No dungeons have been loaded. Please check your proxy settings and restart FFRK.</p>
        ) : (
          <div className="row">
            <div className="col-sm-9">
              <DungeonsList worlds={worlds} />
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
  progress: state.progress.dungeons,
  hasSession: hasSessionState(state.session),
}))(DungeonsPage);
