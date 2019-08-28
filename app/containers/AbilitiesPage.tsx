import * as React from 'react';

import { AbilitiesList } from '../components/abilities/AbilitiesList';
import { Page } from './Page';

export class AbilitiesPage extends React.Component {
  render() {
    return (
      <Page title="Abilities">
        <AbilitiesList rarity={6} />
        <AbilitiesList rarity={5} />
        <AbilitiesList rarity={4} />
        <AbilitiesList rarity={3} />
        <AbilitiesList rarity={2} />
        <AbilitiesList rarity={1} />
      </Page>
    );
  }
}

export default AbilitiesPage;
