import * as React from 'react';

export const separateWithBr = (lines: any[]) => {
  const result: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (result.length) {
      result.push(<br key={i} />);
    }
    result.push(lines[i]);
  }
  return result;
};

export class BrText extends React.PureComponent<{ text: string }> {
  render() {
    const lines = this.props.text.split('<br>');

    const result = [];
    for (const i of lines) {
      if (result.length) {
        result.push(<br />);
      }
      result.push(i);
    }

    return <>{result}</>;
  }
}
