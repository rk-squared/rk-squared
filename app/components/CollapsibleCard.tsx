import * as React from 'react';

interface Props {
  id: string;
  title: string | (() => any);
  children: any;
}

export default class CollapsibleCard extends React.Component<Props> {
  render() {
    const { id, title, children } = this.props;
    const collapseId = id + '-collapse';
    const headerId = id + '-header';
    return (
      <div className="card" id={id}>
        <div className="card-header" id={headerId}>
          <h5 className="mb-0">
            <button className="btn btn-link" type="button" data-toggle="collapse" data-target={'#' + collapseId}
                    aria-expanded="false" aria-controls={'#' + collapseId}>
              {typeof title === 'string' ? title : title()}
            </button>
          </h5>
        </div>

        <div id={collapseId} className="collapse" aria-labelledby="headingOne" data-parent={'#' + id}>
          <div className="card-body">
            {children}
          </div>
        </div>
      </div>
    );
  }
};