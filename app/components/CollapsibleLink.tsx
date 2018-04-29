import * as React from 'react';

const styles = require('./CollapsibleLink.scss');

interface Props {
  id: string;
  title: string | (() => any);
  children: any;
}

export class CollapsibleLink extends React.Component<Props> {
  render() {
    const { id, title, children } = this.props;
    return (
      <div className={styles.component}>
        <button
          type="button" className="btn btn-link collapsed"
          data-toggle="collapse" data-target={'#' + id}
          aria-expanded="false" aria-controls={id}
        >
          {typeof(title) === 'string' ? title : title()}
        </button>
        <div className="collapse" id={id}>
          {children}
        </div>
      </div>
    );
  }
}
