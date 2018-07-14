import * as React from 'react';

import { Progress } from '../../actions/progress';

interface Props {
  progress?: Progress;
  children?: any;
}

export class ProgressBar extends React.Component<Props> {
  render() {
    const { progress, children } = this.props;
    if (!progress) {
      return null;
    }
    const { current, max } = progress;
    return (
      <div className="progress">
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar" style={{width: (current / max * 100).toFixed(2) + '%'}}
          aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}
        >
          {children}
        </div>
      </div>
    );
  }
}
