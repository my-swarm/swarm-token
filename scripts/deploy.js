const bre = require('hardhat');
const ethers = bre.ethers;
const { AddressZero } = ethers.constants;
const { RLP, formatUnits, parseUnits } = ethers.utils;

require('dotenv').config({ path: '.env' });

function predictContractAddress(address, nonce) {
    const rlpData = RLP.encode([address.toLowerCase(), ethers.utils.hexlify(nonce)])
    return '0x' + ethers.utils.keccak256(rlpData).substr(26);
}

async function sendDummyTransaction() {
    const signer = (await ethers.getSigners())[0];
    const tx = await signer.sendTransaction({
        to: AddressZero,
        value: 0
    });
    await tx.wait();
    console.log('dummy transaction sent');
}

async function main() {
    const signer = (await ethers.getSigners())[0];
    const deployNonce = parseInt(process.env.DEPLOY_NONCE);
    const predictedContractAddress = predictContractAddress(signer.address, deployNonce);

    let nonce;
    while ((nonce = await signer.getTransactionCount()) < deployNonce) {
        console.log(`nonce too low: ${nonce}`);
        await sendDummyTransaction();
        nonce++;
    }

    if (nonce > deployNonce) {
        console.log(`Contract already deployed on ${predictedContractAddress}`);
        const token = await ethers.getContractAt('SwarmToken', predictedContractAddress);
        const supply = await token.totalSupply();
        const decimals = await token.decimals();
        console.log({
            name: await token.name(),
            symbol: await token.symbol(),
            supply,
            supplyEth: formatUnits(supply, decimals),
            decimals,
            deployerBalance: await token.balanceOf(signer.address)
        });

        return;
    }

    console.log(`deploying contract with nonce ${nonce}. It should have this address: ${predictedContractAddress}`);

    const factory = await ethers.getContractFactory('SwarmToken', signer);
    const params = [
        process.env.CONTROLLER_ACCOUNT,
        process.env.TOKEN_NAME,
        process.env.TOKEN_SYMBOL,
        process.env.TOKEN_DECIMALS,
        process.env.INITIAL_ACCOUNT,
        parseUnits(process.env.TOTAL_SUPPLY, process.env.TOKEN_DECIMALS),
    ];
    const contract = await factory.deploy(...params);
    await contract.deployed();
    console.log(`Contract deployed at ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
