import * as React from 'react';

import MessagesList from './MessagesList';

const styles = require('./Page.scss');

interface Props {
  className?: string;
  title?: string;
  children: any;
  footer?: () => any;
}

export class Page extends React.Component<Props> {
  render() {
    const { className, title, children, footer } = this.props;
    return (
      <div className={'container ' + styles.component + ' ' + (className || '')}>
        {title && <h2 className="row">{title}</h2>}
        <div className={styles.content}>
          <MessagesList />
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer()}</div>}
      </div>
    );
  }
}
