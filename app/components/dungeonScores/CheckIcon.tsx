import * as React from 'react';
const { default: FontAwesomeIcon } = require('@fortawesome/react-fontawesome');

const styles = require('./CheckIcon.scss');

export class CheckIcon extends React.Component<{ checked: boolean }> {
  render() {
    const { checked } = this.props;
    const className = styles.component + ' ' + (checked ? styles.checked : styles.hidden);
    return <FontAwesomeIcon className={className} icon="check" fixedWidth />;
  }
}
