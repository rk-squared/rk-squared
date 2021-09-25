import * as React from 'react';

interface Props {
  chests: number[];
}

// Details on chest types taken from Reddit
const chestContents: Record<number, string> = {
  1: '5★ orbs or motes',
  2: '6★ crystals, Rosetta Stone, or Rainbow Crystal',
  3: "6★ motes, Large Rat's Tails, Magic Key, Treasure Map, or Lethe Tears",
  4: "Anima Lenses, Huge Rat's Tails, Record Marker, Teleport Stone, or Treasure Map x2",
  5: 'Hero Artifact',
};

function describeChest(chestId: number) {
  const type = Math.floor(chestId / 100000);
  const text = `Rank ${type} - ` + (chestContents[type] || 'Unknown');
  return type >= 3 ? <strong>{text}</strong> : text;
}

export class LabyrinthChests extends React.Component<Props> {
  render() {
    const { chests } = this.props;
    return (
      <ol>
        {chests.map((id, i) => (
          <li key={i}>{describeChest(id)}</li>
        ))}
      </ol>
    );
  }
}
