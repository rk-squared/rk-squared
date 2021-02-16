import classNames from 'classnames';
import * as React from 'react';
import { getOrganizedChains } from '../../data/chains';
import { allEnlirRealms } from '../../data/enlir';
import { ChainCell } from './ChainCell';
import { RealmChainHelp } from './RealmChainHelp';

const styles = require('./RealmChainList.scss');

interface Props {
  isAnonymous?: boolean;
}

export class RealmChainList extends React.Component<Props> {
  render() {
    const chains = getOrganizedChains().realm;

    const realms = allEnlirRealms.filter(i => chains.gen1[i] || chains.gen2[i]);

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
                <ChainCell soulBreak={chains.gen1[i]} />
                <ChainCell soulBreak={chains.gen2[i]} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default RealmChainList;
