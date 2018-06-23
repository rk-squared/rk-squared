import * as React from 'react';

const styles = require('./RecordMateriaTable.scss');

export class RecordMateriaTable extends React.Component {
  render() {
    return (
      <table className={`table table-bordered ${styles.component}`}>
        {this.props.children}
      </table>
    );
  }
}
