
const HDWalletProvider = require("@truffle/hdwallet-provider");

// Please be aware that the following keys should be replaced before deployment to the live network, and should never be shared.
// the following keys are only intended for testing, no one should use them to depost ether based coin in live networs.
const privateKeysMain = [
  "2bcba77111be1dd4acfc7e1cb995f35a702f10677879e8974c6e955ea783c721", // 0xf0820B6607A3fe9C6F9A1f551C17Cd837a8f21cF
  "757a4a3729f3966c961d0ad26a907ee0eeda5e5404ff29a39a1110cc713fa4db", // 0xe3990E5AC1405C86D68C7ff4f6139BEbfA9791D5
];
// please be aware that the following keys are intended for test only and they don't contain any value in them except test CLOs.
const privateKeysTest = [
  "2bcba77111be1dd4acfc7e1cb995f35a702f10677879e8974c6e955ea783c721", // 0xf0820B6607A3fe9C6F9A1f551C17Cd837a8f21cF
  "757a4a3729f3966c961d0ad26a907ee0eeda5e5404ff29a39a1110cc713fa4db", // 0xe3990E5AC1405C86D68C7ff4f6139BEbfA9791D5
];

options = {
  networks: {
  },
  compilers: {
    solc: {
      version: "0.5.8",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 2000
        }
      }
    }
  }
}

let ct = process.argv.indexOf('cloTestnet');
if (ct !== -1) {
  options['networks']['cloTestnet'] = { 
    provider: () => new HDWalletProvider(privateKeysTest, "https://clo-testnet3.0xinfra.com/",0,2),
    network_id: "*", // match any network
  }
}

let cm = process.argv.indexOf('cloMainnet');
if (cm !== -1) {
  options['networks']['cloTestnet'] = {
    provider: () => new HDWalletProvider(privateKeysMain, "https://clo-geth.0xinfra.com/",0,2),
    network_id: "820",
  }
}

// let localTest = process.argv.indexOf('localTest');

// if (localTest !== -1) {
//   options['networks']['localTest'] = { host: "127.0.0.1", port: 8545, network_id: "*" }
// }

let reporterArg = process.argv.indexOf('--report');
if (reporterArg !== -1) {
  options['mocha'] = {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      excludeContracts: ['Migrations']
    }
  }
}


module.exports = options;
