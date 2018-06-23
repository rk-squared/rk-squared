import * as React from 'react';

interface Props {
  text: string;
}

export class BrTextToP extends React.Component<Props & React.HTMLAttributes<HTMLElement>> {
  render() {
    const { text, ...props } = this.props;
    const lines = text.split('<br>');
    return (
      <>
        {lines.map((line, i) => <p key={i} {...props}>{line}</p>)}
      </>
    );
  }
}
