import * as React from 'react';
import * as Modal from 'react-modal';
import { connect } from 'react-redux';

import { Dungeon } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { getDungeonsForWorlds } from '../reducers/dungeons';
import DungeonPrizeList from './DungeonPrizeList';
import ItemTypeChecklist from './ItemTypeChecklist';

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

  // noinspection UnterminatedStatementJS
  handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.setState({isOpen: true});
  }

  // noinspection UnterminatedStatementJS
  handleClose = () => {
    this.setState({isOpen: false});
  }

  render() {
    const { dungeons } = this.props;
    if (!this.state.isOpen) {
      return <a href="#" onClick={this.handleOpen}>Show all unclaimed rewards</a>;
    }
    return (
      <Modal
        isOpen={this.state.isOpen}
        onRequestClose={this.handleClose}
        className="modal-dialog modal-lg"
        style={{overlay: {backgroundColor: 'rgba(0, 0, 0, 0.50)', overflowY: 'auto' }}}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Unclaimed Rewards</h5>
            <button onClick={this.handleClose} className="close"><span aria-hidden="true">&times;</span></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-8">
                <DungeonPrizeList dungeons={dungeons}/>
              </div>
              <div className="col-md-4" style={{position: 'sticky', top: '3rem'}}>
                <ItemTypeChecklist/>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default connect<StateProps, {}, OwnProps>(
  (state: IState, { worlds }: OwnProps) => ({
    dungeons: getDungeonsForWorlds(state.dungeons, worlds)
  })
)(WorldPrizeList);
