require('dotenv').config();
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');

const fs = require('fs');
const privateKey = fs.readFileSync(__dirname + '/.private_key').toString().trim();
const mnemonicLocal = fs.readFileSync('.secret-local').toString().trim();

const accountsLocal = {
    mnemonic: mnemonicLocal,
    path: "m/44'/60'/0'/0",
};

module.exports = {
    // etherscan: {
    //     url: 'https://api-ropsten.etherscan.io/api',
    //     apiKey: process.env.ALCHEMY_KEY_ETHERSCAN,
    // },
    etherscan: {
        url: 'https://api-mumbai.polygonscan.com/api',
        apiKey: process.env.ALCHEMY_KEY_MUMBAI,
    },

    solidity: {
        version: '0.5.0',
        optimizer: {
            enabled: true,
            runs: 100,
        },
    },
    networks: {
        // mainnet: {
        //     url: alchemyUrl,
        //     chainId: 1,
        //     gas: 'auto',
        //     gasPrice: 110000000000,
        //     accounts: {
        //         mnemonic: mnemonic,
        //         path: "m/44'/60'/0'/0",
        //     },
        // },
        // kovan: {
        //     url: alchemyUrlKovan,
        //     chainId: 42,
        //     ...gasAuto,
        //     accounts: {
        //         mnemonic: mnemonicTestnet,
        //         path: "m/44'/60'/0'/0",
        //     },
        // },
        hardhat: {
            gas: 12000000,
            blockGasLimit: 12000000,
            accounts: accountsLocal,
        },
        local: {
            url: 'http://localhost:8545',
            chainId: 31337,
            accounts: accountsLocal,
        },
        polygon: {
            url: process.env.ALCHEMY_POLYGON,
            chainId: 137,
            accounts: [privateKey],
        },
        mumbai: {
            url: process.env.ALCHEMY_MUMBAI,
            chainId: 80001,
            accounts: [privateKey],
        },
    },
};
