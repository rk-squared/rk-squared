import * as React from 'react';
import { CollapsibleLink } from '../common/CollapsibleLink';

export class RealmChainHelp extends React.Component {
  render() {
    return (
      <CollapsibleLink id="realm-chain-help" title="A note on terminology">
        <ul>
          <li>
            <strong>Gen. 1</strong> chains boost damage of the corresponding realm by{' '}
            <strong>50%</strong> and offer a chain bonus up to <strong>150 hits</strong>, along with
            providing party-wide buffs of Haste and +30% ATK and MAG.
          </li>
          <li>
            <strong>Gen. 2</strong> chains boost damage of the corresponding realm by{' '}
            <strong>50%</strong> and offer a chain bonus up to <strong>99 hits</strong>. They're
            instant cast and provide party-wide buffs of +30 ATK/DEF/MAG/RES and instacast 1.
            They're intended to counter the Full Break effects that higher-end Cardia bosses use,
            but they're of limited use for that; restarting a chain can hurt your damage almost as
            much as a Dreambreaker Full Break. They remain useful as general party buffs.
          </li>
          <li>
            A <strong>RW</strong> (Roaming Warrior) chain, Bonds of Historia, is available in Cardia
            Odin battles. It boosts damage of the corresponding realm by <strong>30%</strong> and
            offer a chain bonus up to <strong>150 hits</strong> but has no other effects.
          </li>
        </ul>
      </CollapsibleLink>
    );
  }
}
