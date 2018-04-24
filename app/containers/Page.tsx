import * as React from 'react';

const styles = require('./Page.scss');

interface Props {
  title: string;
  children: any;
}

export class Page extends React.Component<Props> {
  render() {
    const { title, children } = this.props;
    return (
      <div className={`container ${styles.component}`}>
        <h2 className="row">{title}</h2>
        {children}
      </div>
    );
  }
}
