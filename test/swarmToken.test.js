const { expect } = require('chai')
const crypto = require('crypto');
const { deployContract } = require('./helpers');
const { ethers } = require('hardhat');
const { provider, BigNumber } = ethers;
const { parseUnits } = ethers.utils;
const { AddressZero } = ethers.constants;

describe('SwarmToken', async () => {

    let deployer, controller, initialHolder, alice, bob;
    let token;
    let noopSwarmTokenRecipient, swarmTokenRecipient;

    const totalSupply = BigNumber.from('100000000000015150000000000');

    beforeEach(async function () {
        [deployer, controller, initialHolder, alice, bob] = await ethers.getSigners();

        token = await deployContract('SwarmToken', [
            controller.address,
            'Swarm Fund Token',
            'SWM',
            18,
            initialHolder.address,
            totalSupply,
        ], deployer);

        noopSwarmTokenRecipient = await deployContract('NoopSwarmTokenRecipient', [], alice);
        swarmTokenRecipient = await deployContract('SwarmTokenRecipient', [], alice);
    });

    describe('Controller functionality', () => {
        it('should have correct initial controller', async () => {
            expect(await token.controller()).to.equal(controller.address);
        });

        it('should not allow controller transfer by non-controller account', async () => {
            await expect(token.connect(alice).transferController(bob.address)).to.be.revertedWith(
                'Controlled: caller is not the controller address'
            );
        });

        it('should emit event on successful controller transfer by controller account', async () => {
            await expect(token.connect(controller).transferController(bob.address))
                .to.emit(token, 'ControllerTransferred')
                .withArgs(bob.address);
        });

        it('should not allow controller transfer to zero account', async () => {
            await expect(token.connect(controller).transferController(AddressZero)).to.be.revertedWith(
                'Controlled: new controller is the zero address'
            );
        });
    });

    describe('approveAndCall functionality', () => {
        const amount = BigNumber.from('1000');

        it('should fail when spender is not ISwarmTokenRecipient', async () => {
            await expect(token.connect(initialHolder).approveAndCall(alice.address, amount, '0x00'))
                .to.be.reverted;
        });

        it('should transfer all approved tokens successfully', async () => {
            const spender = swarmTokenRecipient;
            await token.connect(initialHolder).approveAndCall(spender.address, totalSupply, '0x00');

            expect(await token.balanceOf(initialHolder.address)).to.equal(0);
            expect(await token.balanceOf(spender.address)).to.equal(totalSupply);
        });

        it('should not allow changing non-zero allowance', async () => {
            const spender = noopSwarmTokenRecipient;
            await token.connect(initialHolder).approveAndCall(spender.address, amount, '0x00');
            await expect(token.connect(initialHolder).approveAndCall(spender.address, amount, '0x00'))
                .to.be.revertedWith('SwarmToken: not clean allowance state')
        });

        it('should allow call with zeroing allowance', async () => {
            const spender = noopSwarmTokenRecipient;
            await token.connect(initialHolder).approveAndCall(spender.address, amount, '0x00');
            await token.connect(initialHolder).approveAndCall(spender.address, 0, '0x00');
            expect(await token.allowance(initialHolder.address, spender.address)).to.equal(0);
        });
    });

    describe('token document functionality', function () {
        const hash = crypto.createHash('sha256').update(AddressZero).digest();
        const hashString = '0x' + hash.toString('hex');
        const url = 'url';

        it('should not allow document update to non-controller account', async () => {
            await expect(token.connect(alice).updateDocument(hash, url))
                .to.be.revertedWith('Controlled: caller is not the controller address');
        });

        it('should emit DocumentUpdated event on update', async () => {
            await expect(token.connect(controller).updateDocument(hash, url))
                .to.emit(token, 'DocumentUpdated').withArgs(hashString, url);
        });

        it('should return correct document to any caller', async () => {
            await token.connect(controller).updateDocument(hash, url);
            const doc = await token.getDocument();
            expect(doc[0]).to.equal(hashString);
            expect(doc[1]).to.equal(url);
        });
    });

    describe('claimTokens functionality', function() {
        const erc20Supply = BigNumber.from('1000');
        const amount = BigNumber.from('200');
        let erc20;

        beforeEach(async function () {
            erc20 = await deployContract('ERC20Token', [alice.address, erc20Supply]);
            await erc20.connect(alice).transfer(token.address, amount);
        });

        it('should not allow ERC20 token retrieval by non-controller account', async () => {
            await expect(token.connect(bob).claimTokens(erc20.address)).to.be.revertedWith(
                'Controlled: caller is not the controller address'
            );
        });

        it('should retrieve all of ERC20 tokens by controller account', async () => {
            expect(await erc20.balanceOf(token.address)).to.equal(amount);

            await expect(token.connect(controller).claimTokens(erc20.address))
                .to.emit(token, 'ClaimedTokens').withArgs(erc20.address, controller.address, amount);
            expect(await erc20.balanceOf(token.address)).to.equal(0);
            expect(await erc20.balanceOf(controller.address)).to.equal(amount);
        });
    });

    describe('claimEther functionality', function() {
        const value = parseUnits('1');
        const maxFee = value.div(10);

        it('should allow ETH transfers to contract', async () => {
            const balanceBefore = await alice.getBalance();
            await alice.sendTransaction({ to: token.address, value });
            expect(await alice.getBalance()).to.be.closeTo(balanceBefore.sub(value), maxFee);
            expect(await provider.getBalance(token.address)).to.equal(value);
        });

        it('should not allow ETH retrieval by non-controller account', async () => {
            await expect(token.connect(bob).claimEther()).to.be.revertedWith(
                'Controlled: caller is not the controller address'
            );
        });

        it('should retrieve all of ETH by controller account', async () => {
            const balanceBefore = await controller.getBalance();
            await alice.sendTransaction({ to: token.address, value });
            await expect(token.connect(controller).claimEther()).to.emit(token, 'ClaimedEther')
                .withArgs(controller.address, value);
            expect(await controller.getBalance()).to.be.closeTo(balanceBefore.add(value), maxFee);
            expect(await provider.getBalance(token.address)).to.equal(0);
        });
    });
});
