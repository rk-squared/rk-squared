import * as React from 'react';
import { connect } from 'react-redux';

import { showItemTypes } from '../actions/prefs';
import { ItemType, itemTypeDescription } from '../data/items';
import { IState } from '../reducers';

import * as _ from 'lodash';

const shouldShow = (type: ItemType) => type !== ItemType.RecordMateria;

const items = _.sortBy(
  _.toPairs(itemTypeDescription).filter(i => shouldShow(i[0] as ItemType)),
  (i: [ItemType, string]) => i[1]
) as Array<[ItemType, string]>;
const itemTypes = items.map(([type]) => type);

const id = (type: ItemType) => `item-type-check-${type}`;

interface Props {
  show: {
    [t in ItemType]: boolean;
  };
  update: (updates: {[t in ItemType]?: boolean}) => void;
  title?: string;
}

export class ItemTypeChecklist extends React.Component<Props> {
  // noinspection UnterminatedStatementJS
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.checked;
    this.props.update({[e.target.name as ItemType]: selected});
  }

  // noinspection UnterminatedStatementJS
  handleChangeAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.checked;
    this.props.update(_.fromPairs(itemTypes.map(i => [i, selected])));
  }

  render() {
    const { show, title } = this.props;
    const selections = _.values(_.pick(show, itemTypes));
    const selectAll = _.find(selections) != null;

    // FIXME: Indeterminate support
    // https://github.com/facebook/react/issues/1798#issuecomment-333414857
    // const selectNone = _.find(selections, i => !i) != null;

    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Show {title || 'Items'}</h5>
          {items.map(([type, description], i) =>
            <div className="form-check" key={i}>
              <input
                className="form-check-input" type="checkbox"
                name={type} id={id(type)}
                checked={!!show[type]}
                onChange={this.handleChange}
              />
              <label className="form-check-label" htmlFor={id(type)}>
                {description}
              </label>
            </div>
          )}

          <div className="form-check mt-3">
            <input
              className="form-check-input" type="checkbox" name="_all" id="item-type-check-_all"
              checked={selectAll}
              onChange={this.handleChangeAll}
            />
            <label className="form-check-label" htmlFor="item-type-check-_all">
              All
            </label>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: IState) => ({
    show: state.prefs.showItemType
  }),
  (dispatch) => ({
    update: (updates: {[t in ItemType]?: boolean}) => { dispatch(showItemTypes(updates)); }
  })
)(ItemTypeChecklist);
