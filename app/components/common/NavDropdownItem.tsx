import * as React from 'react';

interface Props {
  children: any;
  onClick: () => void;
}

export class NavDropdownItem extends React.Component<Props> {
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
