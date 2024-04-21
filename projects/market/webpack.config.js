const {shareAll, withModuleFederationPlugin} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'market',

  exposes: {
    './Module': './projects/market/src/app/modules/market/market.module.ts',
  },

  shared: {
    ...shareAll({singleton: true, strictVersion: true, requiredVersion: 'auto'}),
  },

});
