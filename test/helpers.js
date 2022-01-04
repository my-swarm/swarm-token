const bre = require('hardhat');
const { ethers } = bre;

async function deployContract(contractName, constructorParams = [], signer = null) {
    if (signer === null) signer = (await ethers.getSigners())[0];
    const factory = await ethers.getContractFactory(contractName, signer);
    const contract = await factory.deploy(...constructorParams);
    await contract.deployed();
    return contract;
}

module.exports = {
    deployContract,
}