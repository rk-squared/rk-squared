import * as React from 'react';

export interface RouteItem {
  component: React.ComponentType;
  description: string | null;
  path: string;
}
