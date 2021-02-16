import * as React from 'react';
import { Page } from './Page';
import ElementChainList from '../components/soulBreaks/ElementChainList';
import RealmChainList from '../components/soulBreaks/RealmChainList';

export class ChainSoulBreaksPage extends React.Component<{}> {
  render() {
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <Page title="Chain Soul Breaks">
        <ElementChainList isAnonymous={isAnonymous} />
        <RealmChainList isAnonymous={isAnonymous} />
      </Page>
    );
  }
}

export default ChainSoulBreaksPage;
