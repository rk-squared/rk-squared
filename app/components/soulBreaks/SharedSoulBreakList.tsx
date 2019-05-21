import * as React from 'react';

import { enlir, EnlirSoulBreak } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP, MrPSoulBreak } from '../../data/mrP';

interface Props {
  isAnonymous?: boolean;
}

const sharedMrPSoulBreaks: { [id: number]: MrPSoulBreak } = {};

function getSharedSoulBreakDescription(soulBreak: EnlirSoulBreak): string {
  if (!sharedMrPSoulBreaks[soulBreak.id]) {
    sharedMrPSoulBreaks[soulBreak.id] = describeEnlirSoulBreak(soulBreak);
  }
  return formatMrP(sharedMrPSoulBreaks[soulBreak.id]);
}

export class SharedSoulBreakList extends React.Component<Props> {
  render() {
    return (
      <table className="table">
        {enlir.sharedSoulBreaks.map(([relic, sb], i) => (
          <tr key={i}>
            <td>{relic.name}</td>
            <td>{sb.name}</td>
            <td>{getSharedSoulBreakDescription(sb)}</td>
          </tr>
        ))}
      </table>
    );
  }
}

export default SharedSoulBreakList;
