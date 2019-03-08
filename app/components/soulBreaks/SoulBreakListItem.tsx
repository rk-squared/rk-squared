import * as React from 'react';

import { EnlirSoulBreak } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../../data/mrP';
import { formatBraveCommands } from '../../data/mrP/brave';

interface Props {
  soulBreak: EnlirSoulBreak;
}

export class SoulBreakListItem extends React.Component<Props> {
  render() {
    const { soulBreak } = this.props;
    const mrP = describeEnlirSoulBreak(soulBreak);
    const text = formatMrP(mrP);
    return (
      <li className="list-group-item">
        <p>
          <strong>{soulBreak.name + ' (' + soulBreak.tier + ')'}</strong>
        </p>
        <p>{text || '???'}</p>
        {mrP.braveCommands && <p>{formatBraveCommands(mrP.braveCommands)}</p>}
        {mrP.burstCommands && mrP.burstCommands.map((cmd, i) => <p key={i}>{formatMrP(cmd)}</p>)}
      </li>
    );
  }
}
