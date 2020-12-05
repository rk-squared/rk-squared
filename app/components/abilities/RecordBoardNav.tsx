import * as React from 'react';
import { connect } from 'react-redux';

import { AbilitySortType, updatePrefs } from '../../actions/prefs';
import { IState } from '../../reducers';

interface Props {
  sort?: AbilitySortType;
  onSetSort?: (sort: AbilitySortType) => void;
}

interface RadioProps {
  id: string;
  sort: AbilitySortType;
  selected: AbilitySortType;
  onSetSort: (sort: AbilitySortType) => void;
  children: any;
}

const RecordBoardSortRadio: React.FC<RadioProps> = ({
  id,
  sort,
  selected,
  onSetSort,
  children,
}: RadioProps) => (
  <div className="form-check form-check-inline mr-3">
    <input
      type="radio"
      className="form-check-input"
      id={id}
      checked={sort === selected}
      onChange={() => onSetSort(sort)}
    />
    <label className="form-check-label" htmlFor={id}>
      {children}
    </label>
  </div>
);

export class RecordBoardNav extends React.PureComponent<Props> {
  render() {
    const { onSetSort } = this.props;
    const sort = this.props.sort != null ? this.props.sort : AbilitySortType.BySchool;
    if (!onSetSort) {
      return null;
    }
    const props = {
      selected: sort,
      onSetSort,
    };
    return (
      <div className="sticky-top">
        <nav className="navbar navbar-expand navbar-light bg-light mb-1">
          <form className="form-inline">
            <RecordBoardSortRadio id="sort-by-school" sort={AbilitySortType.BySchool} {...props}>
              By school
            </RecordBoardSortRadio>
            <RecordBoardSortRadio id="sort-by-realm" sort={AbilitySortType.ByRealm} {...props}>
              By realm
            </RecordBoardSortRadio>
            <RecordBoardSortRadio
              id="sort-by-character"
              sort={AbilitySortType.ByCharacter}
              {...props}
            >
              By character
            </RecordBoardSortRadio>
            <RecordBoardSortRadio id="sort-by-release" sort={AbilitySortType.ByRelease} {...props}>
              By release date
            </RecordBoardSortRadio>
          </form>
        </nav>
      </div>
    );
  }
}

export default connect(
  (state: IState) => ({ sort: state.prefs.recordBoardSort }),
  dispatch => ({
    onSetSort: (sort: AbilitySortType) => dispatch(updatePrefs({ recordBoardSort: sort })),
  }),
)(RecordBoardNav);
