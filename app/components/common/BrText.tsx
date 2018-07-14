import * as React from 'react';

export class BrText extends React.PureComponent<{text: string}> {
  render() {
    const lines = this.props.text.split('<br>');

    const result = [];
    for (const i of lines) {
      if (result.length) {
        result.push(<br/>);
      }
      result.push(i);
    }

    return (
      <>
        {result}
      </>
    );
  }
}
