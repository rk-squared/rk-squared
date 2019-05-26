import * as React from 'react';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as classNames from 'classnames';

const styles = require('./MinableCard.scss');

interface Props {
  icon: IconProp;

  className?: string;
  iconClassName?: string;
  bodyClassName?: string;
}

interface State {
  collapsed: boolean;
}

/**
 * A Bootstrap card that can be minified - collapsed to a single icon, like
 * Toggl's alerts, vs. collapsing to the title, like a normal Bootstrap
 * collapsible card.
 */
export class MinableCard extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      collapsed: false,
    };
  }

  handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ collapsed: !this.state.collapsed });
  };

  render() {
    const { icon, className, iconClassName, bodyClassName, children } = this.props;
    const { collapsed } = this.state;
    if (collapsed) {
      return (
        <div
          className={classNames(
            'card card-horizontal',
            className,
            styles.component,
            styles.collapsed,
          )}
          onClick={this.handleClick}
          role="button"
        >
          <div className={classNames('card-img-top', iconClassName)}>
            <FontAwesomeIcon icon={icon} size="2x" />
          </div>
        </div>
      );
    } else {
      return (
        <div className={classNames('card card-horizontal', className, styles.component)}>
          <div className={classNames('card-img-top', iconClassName)}>
            <FontAwesomeIcon icon={icon} size="2x" />
          </div>
          <div className={classNames('card-body', bodyClassName)}>
            {children}
            <button type="button" onClick={this.handleClick} className={styles.collapseButton}>
              <FontAwesomeIcon icon="chevron-down" />
            </button>
          </div>
        </div>
      );
    }
  }
}
