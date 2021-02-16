import * as React from 'react';
import { Page } from './Page';
import ElementChainList from '../components/soulBreaks/ElementChainList';
import RealmChainList from '../components/soulBreaks/RealmChainList';
import { SoulBreakTooltip } from '../components/soulBreaks/SoulBreakTooltip';

export class ChainSoulBreaksPage extends React.Component<{}> {
  render() {
    const isAnonymous = !process.env.IS_ELECTRON;
    const soulBreakTooltipId = 'chain-tooltips';
    return (
      <Page title="Chain Soul Breaks">
        <ElementChainList isAnonymous={isAnonymous} soulBreakTooltipId={soulBreakTooltipId} />
        <RealmChainList isAnonymous={isAnonymous} soulBreakTooltipId={soulBreakTooltipId} />
        <SoulBreakTooltip id={soulBreakTooltipId} />
      </Page>
    );
  }
}

export default ChainSoulBreaksPage;
