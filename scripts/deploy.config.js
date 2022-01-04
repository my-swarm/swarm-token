const ethers = require('ethers');
const { parseUnits } = ethers.utils;
const { AddressZero } = ethers.constants;

const config = {
    default: {
        name: 'Swarm',
        symbol: 'SWM',
        decimals: 18,
        controller: '0xC39bF343CFc1083497549D7f10468769beCc79E4',
        initialAccount: AddressZero,
        totalSupply: parseUnits('100000000', 18),
        nonce: 78,
    },
    mainnet: {
        controller: '0xC39bF343CFc1083497549D7f10468769beCc79E4',
        initialAccount: '0xC39bF343CFc1083497549D7f10468769beCc79E4',
    },
    polygon: {
        childChainManager: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa',
        totalSupply: 0,
    },
    local: {
        name: 'Local Swarm Token',
        controller: '0xb9A96b5C322e02aB6bC337BE1448C4Bc5B040Fef',
        initialAccount: '0xb9A96b5C322e02aB6bC337BE1448C4Bc5B040Fef',
        nonce: 10,
    }
}

function getConfig(network) {
    return {...config.default, ...config[network]};
}

function getConstructorParams(network) {
    if (!config[network]) throw new Error(`No config for network '${network}'`);
    const c = getConfig(network);

    switch (network) {
        case 'polygon': return [c.controller, c.name, c.symbol, c.decimals, c.childChainManager];
        default: return [c.controller, c.name, c.symbol, c.decimals, c.initialAccount, c.totalSupply];
    }
}

function getTokenName(network) {
    switch (network) {
        case 'polygon': return 'SwarmTokenPolygon';
        default: return 'SwarmToken';
    }
}

module.exports = {
    getConfig,
    getConstructorParams,
    getTokenName,
}