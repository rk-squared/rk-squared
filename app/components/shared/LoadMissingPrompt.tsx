import * as React from 'react';
import { connect } from 'react-redux';

import { sprintf } from 'sprintf-js';

import { Progress } from '../../actions/progress';
import { IState } from '../../reducers';
import { hasSessionState } from '../../reducers/session';
import { pluralize } from '../../utils/textUtils';
import { DismissButton } from '../common/DismissButton';
import { ProgressBar } from '../common/ProgressBar';

interface Props {
  missingCount: number;
  hasSession: boolean;
  progress: Progress;

  countText: string;
  countPluralText?: string;
  missingText: string;
  loadingText: string;

  onLoad: () => void;
}

interface State {
  dismissedMissingCount: number | null;
}

export class LoadMissingPrompt extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dismissedMissingCount: null,
    };
  }

  handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.props.onLoad();
  };

  handleClose = () => {
    this.setState({ dismissedMissingCount: this.props.missingCount });
  };

  render() {
    const {
      missingCount,
      hasSession,
      missingText,
      countText,
      countPluralText,
      loadingText,
      progress,
    } = this.props;
    const { dismissedMissingCount } = this.state;
    if (missingCount !== 0 && hasSession && !progress) {
      if (dismissedMissingCount == null || dismissedMissingCount !== missingCount) {
        const missingPrompt = sprintf(
          missingText,
          missingCount + ' ' + pluralize(missingCount, countText, countPluralText),
        );
        return (
          <div className="alert alert-primary alert-dismissible">
            {missingPrompt + ' '}
            <a href="#" role="button" onClick={this.handleClick}>
              Load now?
            </a>
            <DismissButton onClose={this.handleClose} />
          </div>
        );
      }
    }

    if (progress) {
      return (
        <div className="mb-2">
          {loadingText} for {progress.current + 1} of {progress.max}&hellip;
          <ProgressBar progress={progress} />
        </div>
      );
    }

    return null;
  }
}

export default connect((state: IState, ownProps: { progressKey: string }) => ({
  progress: state.progress[ownProps.progressKey],
  hasSession: hasSessionState(state.session),
}))(LoadMissingPrompt);
