const { balance, ether, BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

const SWM = artifacts.require('SwarmToken');
const NoopSwarmTokenRecipient = artifacts.require('NoopSwarmTokenRecipient');
const SwarmTokenRecipient = artifacts.require('SwarmTokenRecipient');
const ERC20Token = artifacts.require('ERC20Token');

contract('SwarmToken', async function ([_, creator, controller, initialHolder, anotherAccount, ercAccount]) {
    const totalSupply = new BN('100000000000015150000000000');

    beforeEach(async function () {
        this.token = await SWM.new(
            controller,
            'Swarm Fund Token',
            'SWM',
            new BN(18),
            initialHolder,
            totalSupply,
            { from: creator }
        );
    });

    describe('controlled functionality', function() {
        it('should have correct initial controller', async function() {
            assert.strictEqual(await this.token.controller(), controller);
        });

        it('should not allow controller transfer by non-controller account', async function() {
            await expectRevert(this.token.transferController(
                anotherAccount, { from: anotherAccount }),
                'Controlled: caller is not the controller address'
            );
        });

        it('should emit event on successful controller transfer by controller account', async function() {
            const { logs } = await this.token.transferController(anotherAccount, { from: controller });

            assert.strictEqual(await this.token.controller(), anotherAccount);

            expectEvent.inLogs(logs, 'ControllerTransferred', {
                recipient: anotherAccount,
            });
        });

        it('should not allow controller transfer to zero account', async function() {
            await expectRevert(this.token.transferController(
                constants.ZERO_ADDRESS, { from: controller }),
                'Controlled: new controller is the zero address'
            );
        });
    });

    describe('approveAndCall functionality', function () {
        const amount = new BN('1000');

        describe('when spender is not ISwarmTokenRecipient', function () {
            it('should fail', async function() {
                await expectRevert.unspecified(this.token.approveAndCall(
                    anotherAccount, amount, '0x0', { from: initialHolder })
                );
            });
        });

        describe('when spender implements ISwarmTokenRecipient', function () {
            it('should succeed if its callback succeeds', async function() {
                const spender = await NoopSwarmTokenRecipient.new({ from: anotherAccount });
                await this.token.approveAndCall(spender.address, amount, '0x0', { from: initialHolder });
            });

            it('should transfer all approved tokens successfully', async function() {
                const spender = await SwarmTokenRecipient.new({ from: anotherAccount });
                await this.token.approveAndCall(spender.address, totalSupply, '0x0', { from: initialHolder });

                expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(new BN(0));
                expect(await this.token.balanceOf(spender.address)).to.be.bignumber.equal(totalSupply);
            });

            it('should not allow changing non-zero allowance', async function() {
                const spender = await NoopSwarmTokenRecipient.new({ from: anotherAccount });
                await this.token.approveAndCall(spender.address, amount, '0x0', { from: initialHolder });

                expectRevert(this.token.approveAndCall(spender.address, amount, '0x0', { from: initialHolder }),
                    'SwarmToken: not clean allowance state'
                );
            });

            it('should allow call with zeroing allowance', async function() {
                const spender = await NoopSwarmTokenRecipient.new({ from: anotherAccount });
                await this.token.approveAndCall(spender.address, amount, '0x0', { from: initialHolder });
                await this.token.approveAndCall(spender.address, new BN(0), '0x0', { from: initialHolder });
                expect(await this.token.allowance(initialHolder, spender.address)).to.be.bignumber.equal(new BN(0));
            });
        });
    });

    describe('claimTokens functionality', function() {
        const erc20Supply = new BN('1000000');
        const amount = new BN('500000');

        beforeEach(async function () {
            this.erc20 = await ERC20Token.new(ercAccount, erc20Supply);
            await this.erc20.transfer(this.token.address, amount, { from: ercAccount });
        });

        it('should not allow ERC20 token retrieval by non-controller account', async function() {
            await expectRevert(this.token.claimTokens(this.erc20.address, { from: anotherAccount }),
                'Controlled: caller is not the controller address'
            );
        });

        it('should retrieve all of ERC20 tokens by controller account', async function() {
            expect(await this.erc20.balanceOf(this.token.address)).to.be.bignumber.equal(amount);

            await this.token.claimTokens(this.erc20.address, { from: controller });
            expect(await this.erc20.balanceOf(this.token.address)).to.be.bignumber.equal(new BN(0));
            expect(await this.erc20.balanceOf(controller)).to.be.bignumber.equal(amount);
        });

        it('should emit ClaimedTokens event', async function() {
            const { logs } = await this.token.claimTokens(this.erc20.address, { from: controller });

            expectEvent.inLogs(logs, 'ClaimedTokens', {
                token: this.erc20.address,
                controller: controller,
                amount: amount,
            });
        });
    });

    describe('claimEthers functionality', function() {
        const amount = ether('1');

        it('should allow ETH transfers to contract', async function() {
            const balanceTracker = await balance.tracker(this.token.address);
            await this.token.send(amount);
            expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);
        });

        it('should not allow ETH retrieval by non-controller account', async function() {
            await expectRevert(this.token.claimEthers({ from: anotherAccount }),
                'Controlled: caller is not the controller address'
            );
        });

        it('should retrieve all of ETH by controller account', async function() {
            const balanceTracker = await balance.tracker(controller);
            await this.token.send(amount);
            await this.token.claimEthers({ from: controller, gasPrice: 0 });
            expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);
        });

        it('should emit ClaimedEthers event', async function() {
            await this.token.send(amount);
            const { logs } = await this.token.claimEthers({ from: controller, gasPrice: 0 });

            expectEvent.inLogs(logs, 'ClaimedEthers', {
                controller: controller,
                amount: amount,
            });
        });
    });
});
