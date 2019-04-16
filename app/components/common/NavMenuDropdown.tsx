import * as React from 'react';

import classNames from 'classnames';

interface Props {
  id: string;
  label: string;
  display?: any;
  right?: boolean;
  className?: string;
  linkClassName?: string;
  children: any;
}

export class NavMenuDropdown extends React.Component<Props> {
  render() {
    const { id, label, display, className, linkClassName, right, children } = this.props;
    return (
      <li className={classNames('nav-item dropdown', className)}>
        <a
          className={classNames('nav-link dropdown-toggle', linkClassName)}
          href="#"
          id={id}
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label={label}
        >
          {display || label}
        </a>
        <div
          className={classNames('dropdown-menu', { ['dropdown-menu-right']: right })}
          aria-labelledby={id}
        >
          {children}
        </div>
      </li>
    );
  }
}
