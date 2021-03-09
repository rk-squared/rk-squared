import * as React from 'react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import { makeSoulBreaksFilter, ShowSoulBreaksType } from '../../actions/prefs';
import { enlir, EnlirSoulBreak, SharedSoulBreak } from '../../data/enlir';
import { convertEnlirSkillToMrP, formatMrPSkill, MrPSkill } from '../../data/mrP/skill';
import { IState } from '../../reducers';
import { getOwnedSoulBreaks } from '../../selectors/characters';
import { GridContainer } from '../common/GridContainer';
import { RelicTypeIcon } from '../shared/RelicTypeIcon';

const styles = require('./SharedSoulBreakList.scss');

interface Props {
  ownedSoulBreaks?: Set<number>;
  showSoulBreaks?: ShowSoulBreaksType;
  isAnonymous?: boolean;
}

const sortedSoulBreaks = _.sortBy(enlir.sharedSoulBreaks, (i) => i.soulBreak.name);
const sharedMrPSoulBreaks: { [id: number]: MrPSkill } = {};

function getSharedSoulBreakDescription(soulBreak: EnlirSoulBreak): string {
  if (!sharedMrPSoulBreaks[soulBreak.id]) {
    sharedMrPSoulBreaks[soulBreak.id] = convertEnlirSkillToMrP(soulBreak);
  }
  return formatMrPSkill(sharedMrPSoulBreaks[soulBreak.id]);
}

export class SharedSoulBreakList extends React.PureComponent<Props> {
  columnDefs: ColDef[];

  constructor(props: Props) {
    super(props);
    this.columnDefs = [
      {
        headerName: 'Type',
        width: 80,
        field: 'relic.type',
        cellClass: 'text-center',
        cellRendererFramework: ({ value }: ICellRendererParams) => (
          <RelicTypeIcon type={value} className={styles.icon} />
        ),
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Relic',
        width: 145,
        field: 'relic.name',
        cellClass: ({ data }) => (!data.relic.gl ? 'font-italic' : ''),
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Soul Break',
        width: 180,
        field: 'soulBreak.name',
        cellClass: ({ data }) => (!data.relic.gl ? 'font-italic' : ''),
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Effects',
        width: 450,
        valueGetter: ({ data }) => getSharedSoulBreakDescription(data.soulBreak),
        sortable: true,
        resizable: true,
      },
    ];
  }

  // Some soul breaks are provided by more than one relic, so we need to use
  // relic ID instead of soul break ID to identify rows.
  getRowNodeId = (row: SharedSoulBreak) => '' + row.relic.id;

  getRowClass = ({ data }: any) =>
    this.props.isAnonymous ||
    (this.props.ownedSoulBreaks && this.props.ownedSoulBreaks.has(data.soulBreak.id))
      ? ''
      : styles.unowned;

  render() {
    const { showSoulBreaks, ownedSoulBreaks } = this.props;
    const filter = makeSoulBreaksFilter(showSoulBreaks, ownedSoulBreaks);
    return (
      <GridContainer style={{ height: '500px', width: '100%' }}>
        <AgGridReact
          columnDefs={this.columnDefs}
          rowData={_.filter(sortedSoulBreaks, (i) => filter(i.soulBreak))}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          getRowClass={this.getRowClass}
          rowHeight={30}
        />
      </GridContainer>
    );
  }
}

export default connect((state: IState) => ({
  ownedSoulBreaks: getOwnedSoulBreaks(state),
  showSoulBreaks: state.prefs.showSoulBreaks,
}))(SharedSoulBreakList);
