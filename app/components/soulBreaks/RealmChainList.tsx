import classNames from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { OrganizedChains } from '../../data/chains';
import { allEnlirRealms } from '../../data/enlir';
import { ChainCell } from './ChainCell';
import { RealmChainHelp } from './RealmChainHelp';
import { IState } from '../../reducers';
import { getOwnedSoulBreaks } from '../../selectors/characters';
import { selectOrganizedSoulBreaks } from '../../selectors/soulBreaks';

const styles = require('./RealmChainList.module.scss');

interface Props {
  chains: OrganizedChains['realm'];
  ownedSoulBreaks?: Set<number>;
  isAnonymous?: boolean;
  soulBreakTooltipId?: string;
}

export class RealmChainList extends React.Component<Props> {
  render() {
    const { chains, ownedSoulBreaks, isAnonymous, soulBreakTooltipId } = this.props;

    const realms = allEnlirRealms.filter((i) => chains.gen1[i] || chains.gen2[i]);

    const props = { ownedSoulBreaks, isAnonymous, soulBreakTooltipId };
    return (
      <div>
        <h3>Realm Chains</h3>
        <RealmChainHelp />

        <div className="table-responsive">
          <table className={classNames('table table-bordered table-responsive-sm', styles.table)}>
            <thead>
              <tr>
                <th>Realm</th>
                <th>Gen. 1</th>
                <th>Gen. 2</th>
              </tr>
            </thead>
            <tbody>
              {realms.map((i) => (
                <tr key={i}>
                  <th scope="row">{i}</th>
                  <ChainCell soulBreak={chains.gen1[i]} {...props} />
                  <ChainCell soulBreak={chains.gen2[i]} {...props} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default connect((state: IState) => ({
  ownedSoulBreaks: getOwnedSoulBreaks(state),
  chains: selectOrganizedSoulBreaks(state).realm,
}))(RealmChainList);
