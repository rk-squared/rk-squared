import * as React from 'react';
import { connect } from 'react-redux';

import { History } from 'history';

import { getLang } from '../actions/session';
import { LangType } from '../api/apiUrls';
import { LangContext } from '../contexts/LangContext';
import { IState } from '../reducers';
import { AppLayout } from './AppLayout';

interface Props {
  lang: LangType;
  history?: History;
  children: any;
}

export class App extends React.Component<Props> {
  render() {
    const { lang, history, children } = this.props;
    return (
      <LangContext.Provider value={lang}>
        <AppLayout history={history}>{children}</AppLayout>
      </LangContext.Provider>
    );
  }
}

export default connect((state: IState) => ({
  lang: getLang(state.session),
}))(App);
