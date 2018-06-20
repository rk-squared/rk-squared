import * as React from 'react';
import { connect } from 'react-redux';

import { Dungeon } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { getDungeonsForWorlds } from '../reducers/dungeons';
import DungeonPrizeList from './DungeonPrizeList';
import ItemTypeChecklist from './ItemTypeChecklist';
import { ModalDialog } from './ModalDialog';

const styles = require('./WorldPrizeList.scss');

interface StateProps {
  dungeons: Dungeon[];
}

interface OwnProps {
  worlds: World[];
}

interface State {
  isOpen: boolean;
}

export class WorldPrizeList extends React.Component<StateProps & OwnProps, State> {
  constructor(props: StateProps & OwnProps) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.setState({isOpen: true});
  };

  handleClose = () => {
    this.setState({isOpen: false});
  };

  render() {
    const { dungeons } = this.props;
    if (!this.state.isOpen) {
      return <a href="#" onClick={this.handleOpen}>Show all unclaimed rewards</a>;
    }
    return (
      <ModalDialog
        isOpen={this.state.isOpen} onClose={this.handleClose}
        className="modal-lg"
        title="Unclaimed Rewards"
      >
        <div className="row">
          <div className="col-md-8">
            <DungeonPrizeList dungeons={dungeons}/>
          </div>
          <div className={`col-md-4 ${styles.right}`}>
            <ItemTypeChecklist/>
          </div>
        </div>
      </ModalDialog>
    );
  }
}

// TODO: Use a selector and PureComponent
export default connect<StateProps, {}, OwnProps>(
  (state: IState, { worlds }: OwnProps) => ({
    dungeons: getDungeonsForWorlds(state.dungeons, worlds)
  })
)(WorldPrizeList);
