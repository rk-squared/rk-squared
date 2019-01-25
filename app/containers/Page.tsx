import * as React from 'react';

import MessagesList from './MessagesList';

interface Props {
  className?: string;
  title: string;
  children: any;
}

export class Page extends React.Component<Props> {
  render() {
    const { className, title, children } = this.props;
    return (
      <div className={'container ' + (className || '')}>
        <h2 className="row">{title}</h2>
        <MessagesList />
        {children}
      </div>
    );
  }
}
