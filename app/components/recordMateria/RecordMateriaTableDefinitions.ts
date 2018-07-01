import { Order } from '../../actions/recordMateria';

export interface TableRow {
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
