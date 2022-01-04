const { expect } = require('chai')
const crypto = require('crypto');
const { deployContract } = require('./helpers');
const { ethers } = require('hardhat');
const { provider, BigNumber } = ethers;
const { parseUnits, defaultAbiCoder } = ethers.utils;
const { AddressZero } = ethers.constants;

describe('SwarmTokenPolygon', async () => {

    let deployer, controller, childChainManager, alice, bob;
    let token;

    const amount = parseUnits('123');
    const depositData = defaultAbiCoder.encode(['uint256'], [amount])

    beforeEach(async function () {
        [deployer, controller, childChainManager, alice, bob] = await ethers.getSigners();

        token = await deployContract('SwarmTokenPolygon', [
            controller.address,
            'SWARM',
            'SWM',
            18,
            childChainManager.address,
        ], deployer);
    });

    it('should have correct initial child chain manager', async () => {
        expect(await token.childChainManagerProxy()).to.equal(childChainManager.address);
    });

    it('allows controller to change the child chain mananger', async () => {
        await token.connect(controller).updateChildChainManager(alice.address);
        expect(await token.childChainManagerProxy()).to.equal(alice.address);
    });

    it('does not allow anyone else to do that', async () => {
        await expect(token.connect(alice).updateChildChainManager(alice.address)).to.be.revertedWith(
            "Controlled: caller is not the controller address"
        );
    });

    it('does not allow the manager to be zero address', async () => {
        await expect(token.connect(controller).updateChildChainManager(AddressZero)).to.be.revertedWith(
            "Bad ChildChainManagerProxy address"
        );
    });

    it('allows child chain manager to deposit', async () => {
        const balanceBefore = await token.balanceOf(alice.address);
        const supplyBefore = await token.totalSupply();
        await expect(token.connect(childChainManager).deposit(alice.address, depositData))
            .to.emit(token, 'Transfer').withArgs(AddressZero, alice.address, amount);
        expect(await token.balanceOf(alice.address)).to.equal(balanceBefore.add(amount));
        expect(await token.totalSupply()).to.equal(supplyBefore.add(amount));
    });

    it('does not allow anyone else to deposit', async () => {
        await expect(token.connect(bob).deposit(alice.address, depositData))
            .to.be.revertedWith("You're not allowed to deposit");
    });

    it('allows anyone to withdraw', async () => {
        await token.connect(childChainManager).deposit(alice.address, depositData)
        await expect(token.connect(alice).withdraw(amount))
            .to.emit(token, 'Transfer').withArgs(alice.address, AddressZero, amount);
        expect(await token.balanceOf(alice.address)).to.equal(0);
    });


});
