import * as React from 'react';

import classNames from 'classnames';

import { dropdownMenuProps, DropdownProps, dropdownToggleProps } from './Dropdown';

export class NavMenuDropdown extends React.Component<DropdownProps> {
  render() {
    const { label, display, className, children } = this.props;
    const toggleProps = dropdownToggleProps(this.props);
    const menuProps = dropdownMenuProps(this.props);
    return (
      <li className={classNames('nav-item dropdown', className)}>
        <a href="#" {...toggleProps} className={classNames(toggleProps.className, 'nav-link')}>
          {display || label}
        </a>
        <div {...menuProps}>{children}</div>
      </li>
    );
  }
}
