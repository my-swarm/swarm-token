const bre = require('hardhat');
const { getConfig, getConstructorParams, getTokenName } = require('./deploy.config');
require('dotenv').config({ path: '.env' });

const ethers = bre.ethers;
const { AddressZero } = ethers.constants;
const { RLP, formatUnits } = ethers.utils;

const networkName = bre.network.name;

function predictContractAddress(address, nonce) {
    const rlpData = RLP.encode([address.toLowerCase(), ethers.utils.hexlify(nonce)])
    return '0x' + ethers.utils.keccak256(rlpData).substr(26);
}

async function sendDummyTransaction() {
    const deployer = (await ethers.getSigners())[0];
    const tx = await deployer.sendTransaction({
        to: AddressZero,
        value: 0
    });
    await tx.wait();
}

async function main() {
    const deployer = (await ethers.getSigners())[0];

    const config = getConfig(networkName);
    const tokenName = getTokenName(networkName);
    const constructorParams = getConstructorParams(networkName);

    const { nonce } = config;;
    const predictedContractAddress = predictContractAddress(deployer.address, nonce);

    let curNonce;
    while ((curNonce = await deployer.getTransactionCount()) < nonce) {
        console.log(`nonce too low: ${curNonce} - sending dummy transaction`);
        await sendDummyTransaction();
        curNonce++;
    }

    if (curNonce > nonce) {
        console.log(`Contract already deployed on ${predictedContractAddress}`);
        const token = await ethers.getContractAt(tokenName, predictedContractAddress);
        const supply = await token.totalSupply();
        const decimals = await token.decimals();
        console.log({
            name: await token.name(),
            symbol: await token.symbol(),
            decimals,
            supply: formatUnits(supply, decimals),
            deployerBalance: formatUnits(await token.balanceOf(deployer.address), decimals)
        });
        return;
    }

    console.log(`deploying as ${deployer.address} with nonce ${curNonce}. Predicted address: ${predictedContractAddress}`);

    const factory = await ethers.getContractFactory(tokenName, deployer);
    const contract = await factory.deploy(...constructorParams);
    await contract.deployed();
    console.log(`Contract deployed at ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
