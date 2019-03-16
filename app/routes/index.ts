import { RouteItem } from './types';

let routes: RouteItem[];
if (process.env.IS_ELECTRON) {
  routes = require('./desktopRoutes.ts').default;
} else {
  routes = require('./siteRoutes.ts').default;
}

export { routes };
