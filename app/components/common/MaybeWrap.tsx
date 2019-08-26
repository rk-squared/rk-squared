import * as React from 'react';

interface Props {
  test: boolean;
  component: React.ComponentClass<any> | React.StatelessComponent<any>;
  children: any;
}

export class MaybeWrap extends React.Component<Props & any> {
  render() {
    const { test, component: Component, children, ...props } = this.props;
    const child = React.Children.only(children);
    if (test) {
      return <Component {...props}>{child}</Component>;
    } else {
      return child;
    }
  }
}
