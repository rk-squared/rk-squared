import * as React from 'react';
import { CollapsibleLink } from '../common/CollapsibleLink';

export class ElementChainHelp extends React.Component {
  render() {
    return (
      <CollapsibleLink id="element-chain-help" title="A note on terminology">
        <ul>
          <li>
            <strong>Gen. 1</strong> chains boost damage of the corresponding element by{' '}
            <strong>20%</strong> and offer a chain bonus up to <strong>99 hits</strong>. They
            typically deal 11 hits and provide a minor party buff, although some exceptions exist.
            They typically come in both physical and magical versions, although some elements never
            had a magical variation released.
          </li>
          <li>
            <strong>Gen. 2</strong> chains boost damage of the corresponding element by{' '}
            <strong>50%</strong> and offer a chain bonus up to <strong>150 hits</strong>. They come
            in both physical and magical versions; the physical version boosts ATK by 50%, while the
            magical version boosts MAG by 50%. (The holy magical chain is the exception; since some
            holy damage is MND-based, it gives a MAG/MND boost of 30%.) These damage and stat boosts
            make gen 2 chains a significant boost over gen 1.
          </li>
          <li>
            <strong>Gen. 0.5</strong> chains boost damage of the corresponding element by{' '}
            <strong>20%</strong> and offer a chain bonus up to <strong>99 hits</strong>. They have
            no other effects. They were made freely available to all players in a series of events
            some time after gen. 1 and 2. They're typically available on hybrid characters (to cover
            both physical and magical).
          </li>
          <li>
            <strong>Gen. 2.5</strong> chains boost damage of the corresponding element by 50% and
            offer a chain bonus up to <strong>99 hits</strong>. They're instant cast, boost party
            members' elemental damage (on top of the 50% field effect), and have the same stat
            boosts as gen 2 chains. They ramp up faster than gen 2 chains but have a lower damage
            cap, so they're not universally better (hence the "2.5" moniker), but having less
            drop-off when renewing a chain and earlier savage mode breaking is often beneficial.
          </li>
          <li>
            A <strong>RW</strong> (Roaming Warrior) chain, Fabula Sorcerer, is available in magicite
            and Odin battles. Like the gen. 0.5 chains, it boosts damage of the corresponding
            element by <strong>20%</strong> and offer a chain bonus up to <strong>99 hits</strong>{' '}
            but has no other effects.
          </li>
        </ul>
      </CollapsibleLink>
    );
  }
}
