import * as React from 'react';

interface Props {
  className?: string;
  children: any;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  [s: string]: any;
}

// Also referenced in app.html and app.global.scss
// noinspection SpellCheckingInspection
const theme = 'ag-theme-balham';

export class GridContainer extends React.Component<Props> {
  render() {
    const { className, children, ...props } = this.props;
    return (
      <div className={(className || '') + ' ' + theme} {...props}>
        {children}
      </div>
    );
  }
}
