import * as React from 'react';
import { LabyrinthPainting, LabyrinthCombat } from '../../actions/labyrinth';
import { labyrinthIcons } from '../../data/localData';
import ReactTooltip = require('react-tooltip');
import { BattleTips } from '../../data/strategy';

const styles = require('./LabyrinthPaintingCard.module.scss');

interface Props {
  painting: LabyrinthPainting;
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

function CombatTooltip({ id, combat }: { id: string; combat: LabyrinthCombat }) {
  const { name, difficulty, imageUrl, message, tips } = combat;
  return (
    <ReactTooltip place="right" id={id}>
      <div className={styles.tooltip}>
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
    </ReactTooltip>
  );
}

export class LabyrinthPaintingCard extends React.Component<Props> {
  render() {
    const { painting } = this.props;
    const icon = labyrinthIcons[painting.id];
    const tooltipId = painting.combat && `labyrinth-card-${painting.number}`;
    return (
      <>
        <div className={`card ${styles.component}`} data-tip={tooltipId} data-for={tooltipId}>
          {icon && <img className="card-img-top" src={icon} />}
          <div className="card-body">
            <h5 className="card-title">
              {painting.number + '. ' + painting.name.replace(/ Painting/, '')}
            </h5>
            {painting.combat && <p>{`${painting.combat.name} (D${painting.combat.difficulty})`}</p>}
          </div>
        </div>
        {painting.combat && tooltipId && <CombatTooltip id={tooltipId} combat={painting.combat} />}
      </>
    );
  }
}
