import * as React from 'react';

export const DismissButton = ({ onClose }: { onClose: () => void }) => (
  <button type="button" className="close" aria-label="Close" onClick={onClose}>
    <span aria-hidden="true">&times;</span>
  </button>
);
