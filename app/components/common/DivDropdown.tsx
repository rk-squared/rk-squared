import * as React from 'react';

import classNames from 'classnames';

import { dropdownMenuProps, DropdownProps, dropdownToggleProps } from './Dropdown';

export class DivDropdown extends React.Component<DropdownProps> {
  render() {
    const { label, display, className, children } = this.props;
    const toggleProps = dropdownToggleProps(this.props);
    const menuProps = dropdownMenuProps(this.props);
    return (
      <div className={classNames('dropdown', className)}>
        <div {...toggleProps}>{display || label}</div>
        <div {...menuProps}>{children}</div>
      </div>
    );
  }
}
