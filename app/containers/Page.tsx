import * as React from 'react';
import { Helmet } from 'react-helmet';

import classNames from 'classnames';

import MessagesList from './MessagesList';

const styles = require('./Page.scss');

interface Props {
  className?: string;
  contentClassName?: string;
  title?: string;
  children: any;
  footer?: () => any;
}

export class Page extends React.Component<Props> {
  static AppTitle = 'RK Squared';

  ref: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);
    this.ref = React.createRef();
  }

  scrollToTop() {
    if (this.ref.current) {
      this.ref.current.scrollIntoView(true);
    }
  }

  render() {
    const { className, contentClassName, title, children, footer } = this.props;
    let headTitle: string | undefined;
    if (title) {
      headTitle = 'RK Squared' + (title === Page.AppTitle ? '' : ' - ' + title);
    }
    return (
      <div className={classNames('container-fluid', styles.component, className)} ref={this.ref}>
        {title && <h2 className="row">{title}</h2>}
        {headTitle && <Helmet title={headTitle} />}
        <div className={classNames(styles.content, contentClassName)}>
          <MessagesList />
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer()}</div>}
      </div>
    );
  }
}
