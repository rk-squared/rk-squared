import * as React from 'react';

import classNames from 'classnames';

const styles = require('./CollapsibleCard.module.scss');

interface Props {
  id: string;
  title: string | (() => any);
  children: any;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
}

interface State {
  hasShown: boolean;
}

export class CollapsibleCard extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // For performance, only render children if we've ever shown.
    // TODO: This means that the initial expansion is a bit choppy
    this.state = {
      hasShown: false,
    };
  }

  handleClick = () => {
    this.setState({ hasShown: true });
  };

  render() {
    const { id, title, children, titleClassName, titleStyle } = this.props;
    const collapseId = id + '-collapse';
    const headerId = id + '-header';
    return (
      <div className={`card ${styles.component}`} id={id}>
        <div className="card-header" id={headerId}>
          <button
            className={classNames('btn btn-link btn-block', titleClassName)}
            type="button"
            onClick={this.handleClick}
            style={titleStyle}
            data-toggle="collapse"
            data-target={'#' + collapseId}
            aria-expanded="false"
            aria-controls={'#' + collapseId}
          >
            {typeof title === 'string' ? title : title()}
          </button>
        </div>

        <div
          id={collapseId}
          className="collapse"
          aria-labelledby="headingOne"
          data-parent={'#' + id}
        >
          <div className="card-body">{this.state.hasShown && children}</div>
        </div>
      </div>
    );
  }
}
