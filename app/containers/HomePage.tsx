import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { Home } from '../components/Home';
import { Page } from './Page';

export class HomePage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      <Page title="Welcome">
        <Home />
      </Page>
    );
  }
}

export default (HomePage as any as React.StatelessComponent<RouteComponentProps<any>>);
