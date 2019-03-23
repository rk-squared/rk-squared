import * as React from 'react';
import { connect } from 'react-redux';

import { sprintf } from 'sprintf-js';

import { Progress } from '../../actions/progress';
import { IState } from '../../reducers';
import { hasSessionState } from '../../reducers/session';
import { pluralize } from '../../utils/textUtils';
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

export class LoadMissingPrompt extends React.Component<Props> {
  handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.props.onLoad();
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
    if (missingCount !== 0 && hasSession && !progress) {
      const missingPrompt = sprintf(
        missingText,
        missingCount + ' ' + pluralize(missingCount, countText, countPluralText),
      );
      return (
        <div className="alert alert-primary">
          {missingPrompt + ' '}
          <a href="#" role="button" onClick={this.handleClick}>
            Load now?
          </a>
        </div>
      );
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
