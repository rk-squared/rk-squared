import classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { ElementChainHelp } from './ElementChainHelp';
import { getOrganizedChains, OrganizedChains } from '../../data/chains';
import { allEnlirElements } from '../../data/enlir';
import { ChainCell } from './ChainCell';
import { ElementChainCellGroup } from './ElementChainCellGroup';
import { connect } from 'react-redux';
import { IState } from '../../reducers';
import { getOwnedSoulBreaks } from '../../selectors/characters';

const styles = require('./ElementChainList.scss');

interface Props {
  ownedSoulBreaks?: Set<number>;
  isAnonymous?: boolean;
  soulBreakTooltipId?: string;
}

function getChainCount(chains: OrganizedChains['element'], gen: 'gen2' | 'gen25') {
  return (
    _.max(
      _.flatten(Object.values(chains[gen]).map(i => (i ? [i.phys.length, i.mag.length] : []))),
    ) || 1
  );
}

export class ElementChainList extends React.Component<Props> {
  render() {
    const { ownedSoulBreaks, isAnonymous, soulBreakTooltipId } = this.props;
    const chains = getOrganizedChains().element;

    const gen2Count = getChainCount(chains, 'gen2');
    const gen25Count = getChainCount(chains, 'gen25');
    const elements = allEnlirElements.filter(
      i => chains.gen05[i] || chains.gen1[i] || chains.gen2[i] || chains.gen25[i],
    );

    const props = { ownedSoulBreaks, isAnonymous, soulBreakTooltipId };
    return (
      <div>
        <h3>Elemental Chains</h3>
        <ElementChainHelp />

        <table className={classNames('table table-bordered table-responsive-sm', styles.table)}>
          <thead>
            <tr>
              <th rowSpan={2}>Element</th>
              <th rowSpan={2}>Gen. 0.5</th>
              <th colSpan={2}>Gen. 1</th>
              <th colSpan={2 * gen2Count}>Gen. 2</th>
              <th colSpan={2 * gen25Count}>Gen. 2.5</th>
            </tr>
            <tr>
              <th>Phys.</th>
              <th>Mag.</th>
              <th colSpan={gen2Count}>Phys.</th>
              <th colSpan={gen2Count}>Mag.</th>
              <th colSpan={gen25Count}>Phys.</th>
              <th colSpan={gen25Count}>Mag.</th>
            </tr>
          </thead>
          <tbody>
            {elements.map(i => (
              <tr key={i}>
                <th className={styles.element + ' ' + i.toLowerCase()} scope="row">
                  {i}
                </th>
                <ChainCell soulBreak={chains.gen05[i]} {...props} />
                <ElementChainCellGroup chains={chains.gen1[i]} count={1} {...props} />
                <ElementChainCellGroup chains={chains.gen2[i]} count={gen2Count} {...props} />
                <ElementChainCellGroup chains={chains.gen25[i]} count={gen25Count} {...props} />
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
}))(ElementChainList);
