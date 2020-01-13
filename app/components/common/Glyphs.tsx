import * as React from 'react';

const glyphStyles: React.CSSProperties = {
  width: '1em',
  display: 'inline-block',
  textAlign: 'center',
};

export const Bullet = ({ show }: { show: boolean }) => (
  <span className={show ? '' : 'invisible'} aria-label="selected" style={glyphStyles}>
    ●
  </span>
);

export const Check = ({ show }: { show: boolean }) => (
  <span className={show ? '' : 'invisible'} aria-label="selected" style={glyphStyles}>
    ✔
  </span>
);
