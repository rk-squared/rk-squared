import * as React from 'react';

import { Order, RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaList } from './RecordMateriaList';

import * as _ from 'lodash';

const styles = require('./RecordMateriaTable.scss');

interface TableRow {
  header: string;
  items: {
    [content: string]: Array<[string, Order]>;
  };
}

export interface TableDefinition {
  title: string;
  headers: string[];
  contents: string[][];
  rows: TableRow[];
}

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  table: TableDefinition;
}

export class RecordMateriaTable extends React.Component<Props> {
  renderCell = (row: TableRow, contents: string[], index: number) => {
    const { recordMateria } = this.props;
    const show = _.filter(_.flatMap(contents, s => row.items[s]));
    return (
      <td key={index}>
        <RecordMateriaList recordMateria={recordMateria} show={show}/>
      </td>
    );
  };

  renderRow = (row: TableRow, index: number) => {
    const { table } = this.props;
    return (
      <tr key={index}>
        <th scope="row">{row.header}</th>
        {table.contents.map((contents, i) => this.renderCell(row, contents, i))}
      </tr>
    );
  };

  render() {
    const { table } = this.props;
    return (
      <table className={`table table-bordered ${styles.component}`}>
        <tbody>
          <tr>
            <th>{table.title}</th>
            {table.headers.map((header, i) => <th key={i}>{header}</th>)}
          </tr>
          {table.rows.map(this.renderRow)}
        </tbody>
      </table>
    );
  }
}
