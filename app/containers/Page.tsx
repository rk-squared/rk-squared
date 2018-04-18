import * as React from 'react';

const styles = require('./Page.scss');

interface Props {
  title: string;
  children: any;
}

export default class Page extends React.Component<Props> {
  render() {
    const { title, children } = this.props;
    return (
      <div className={styles.component}>
        <h2>{title}</h2>
        {children}
      </div>
    );
  }
}
