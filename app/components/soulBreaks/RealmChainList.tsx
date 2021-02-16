import classNames from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { getOrganizedChains } from '../../data/chains';
import { allEnlirRealms } from '../../data/enlir';
import { ChainCell } from './ChainCell';
import { RealmChainHelp } from './RealmChainHelp';
import { IState } from '../../reducers';
import { getOwnedSoulBreaks } from '../../selectors/characters';

const styles = require('./RealmChainList.scss');

interface Props {
  ownedSoulBreaks?: Set<number>;
  isAnonymous?: boolean;
}

export class RealmChainList extends React.Component<Props> {
  render() {
    const { ownedSoulBreaks, isAnonymous } = this.props;
    const chains = getOrganizedChains().realm;

    const realms = allEnlirRealms.filter(i => chains.gen1[i] || chains.gen2[i]);

    const props = { ownedSoulBreaks, isAnonymous };
    return (
      <div>
        <h3>Realm Chains</h3>
        <RealmChainHelp />

        <table className={classNames('table table-bordered table-responsive-sm', styles.table)}>
          <thead>
            <tr>
              <th>Realm</th>
              <th>Gen. 1</th>
              <th>Gen. 2</th>
            </tr>
          </thead>
          <tbody>
            {realms.map(i => (
              <tr key={i}>
                <th scope="row">{i}</th>
                <ChainCell soulBreak={chains.gen1[i]} {...props} />
                <ChainCell soulBreak={chains.gen2[i]} {...props} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default connect((state: IState) => ({
  ownedSoulBreaks: getOwnedSoulBreaks(state),
}))(RealmChainList);
