let configureStore: any;

// tslint:disable-next-line prefer-conditional-expression
if (process.env.NODE_ENV === 'production') {
  configureStore = require('./configureStore.production');
} else {
  configureStore = require('./configureStore.development');
}

export = configureStore;
