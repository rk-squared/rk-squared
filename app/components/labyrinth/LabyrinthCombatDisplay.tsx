import * as React from 'react';
import { LabyrinthCombat } from '../../actions/labyrinth';
import { BattleTips } from '../../data/strategy';

interface Props {
  combat: LabyrinthCombat;
  className?: string;
}

function TipsBlock({ tip }: { tip: BattleTips }) {
  return (
    <ul>
      {tip.weak && <li>Weak: {tip.weak.join(', ')}</li>}
      {tip.resist && <li>Resist: {tip.resist.join(', ')}</li>}
      {tip.null && <li>Null: {tip.null.join(', ')}</li>}
      {tip.absorb && <li>Absorb: {tip.absorb.join(', ')}</li>}
    </ul>
  );
}

export class LabyrinthCombatDisplay extends React.Component<Props> {
  render() {
    const { combat, className } = this.props;
    const { name, difficulty, imageUrl, message, tips } = combat;
    return (
      <div className={className}>
        <h6>{`${name} (D${difficulty})`}</h6>
        {imageUrl && <img src={imageUrl} alt="" />}

        {tips.length === 1 ? (
          <TipsBlock tip={tips[0]} />
        ) : (
          tips.map((tip, i) => (
            <div key={i}>
              <p>{tip.name}</p>
              <TipsBlock tip={tip} />
            </div>
          ))
        )}

        <div dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    );
  }
}
