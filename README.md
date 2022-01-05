# Swarm token

## Setup & Installation

You will need to have nodejs and npm installed on your computer. Link to download if you don't  https://nodejs.org/en/download/

Install dependencies with

    yarn

## Testing

```
yarn test
```

## Deployment

When deploying on a new network, make sure to

1. add the token config for the new network to `scripts/deploy.config.js`
2. define appropriate environment variables in .env to use in hardhat config (e.g. alchemy URL, etherscan-like service URL)
3. add the network config to `hardhat.config.js` and tweak the `etherscan` config for contract verification
4. run `yarn deploy <network>`

If you wanna maintain he same token address on additional networks, make sure to
- deploy as `0xC39bF343CFc1083497549D7f10468769beCc79E4`
- use nonce 78

The deploy script will automatically reach the correct nonce pre-deploy

### Bridged SWM

When deploying as a bridged ERC20 (which will usually be the case except for testnets, where it doesn't matter), make 
sure to tweak the token contract to follow the specs to work with the actual Bridge.

e.g. for Polygon, we are deploying the `SwarmTokenPolygon` contract with the `deposit` and `withdraw` public methods
implemented. For other networks, it might be the same, or different.