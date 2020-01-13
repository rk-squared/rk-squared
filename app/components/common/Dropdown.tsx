import * as React from 'react';

import classNames from 'classnames';

export interface DropdownProps {
  id: string;
  label: string;
  display?: any;
  right?: boolean;
  className?: string;
  linkClassName?: string;

  /**
   * Use static positioning? By default, Bootstrap uses Popper.js.
   */
  staticPosition?: boolean;

  children: any;
}

export const dropdownToggleProps: (props: DropdownProps) => React.HTMLAttributes<HTMLElement> = ({
  id,
  linkClassName,
  label,
  staticPosition,
}: DropdownProps) => ({
  className: classNames('dropdown-toggle', linkClassName),
  id,
  ['data-toggle']: 'dropdown',
  ['aria-haspopup']: 'true',
  ['aria-expanded']: 'false',
  ['aria-label']: label,
  ['data-display']: staticPosition ? 'static' : undefined,
});

export const dropdownMenuProps = ({ id, right }: DropdownProps) => ({
  className: classNames('dropdown-menu', { ['dropdown-menu-right']: right }),
  ['aria-labelledby']: id,
});

interface DropdownItemProps {
  children: any;
  onClick: () => void;
}

export class DropdownItem extends React.PureComponent<DropdownItemProps> {
  handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.props.onClick();
  };

  render() {
    const { children } = this.props;
    return (
      <a className="dropdown-item" href="#" onClick={this.handleClick}>
        {children}
      </a>
    );
  }
}

export const DropdownDivider = () => <div className="dropdown-divider"></div>;
