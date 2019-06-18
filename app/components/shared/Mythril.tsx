import * as React from 'react';

import * as classNames from 'classnames';

const styles = require('./Mythril.scss');

interface Props {
  children: any;
  className?: string;
}

export const Mythril = ({ children, className }: Props) => (
  <span className={classNames(className, styles.mythril)}>{children}</span>
);
