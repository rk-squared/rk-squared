import * as React from 'react';

import { AbilityTooltip } from '../components/abilities/AbilityTooltip';
import { FutureAbilitiesTable } from '../components/abilities/FutureAbilitiesTable';
import { OrbCostsTooltip } from '../components/abilities/OrbCostsTooltip';
import { Page } from './Page';

export class FutureAbilitiesPage extends React.Component {
  render() {
    const abilitiesTooltipId = `future-abilities-tooltips`;
    const orbCostsTooltipId = `future-orbCosts-tooltips`;
    return (
      <Page title="Future Abilities">
        <FutureAbilitiesTable
          abilitiesTooltipId={abilitiesTooltipId}
          orbCostsTooltipId={orbCostsTooltipId}
        />
        <AbilityTooltip id={abilitiesTooltipId} />
        <OrbCostsTooltip id={orbCostsTooltipId} />
      </Page>
    );
  }
}

export default FutureAbilitiesPage;
