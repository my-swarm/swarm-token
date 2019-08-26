pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "../access/Controlled.sol";
import "./ISwarmTokenRecipient.sol";

contract SwarmToken is ERC20Burnable, ERC20Detailed, Controlled {
    event ClaimedTokens(address indexed token, address indexed controller, uint256 amount);
    event ClaimedEthers(address indexed controller, uint256 amount);

    constructor(
        address controller,
        string memory name,
        string memory symbol,
        uint8 decimals,
        address initialAccount,
        uint256 totalSupply
    )
        ERC20Detailed(name, symbol, decimals)
        Controlled(controller)
        public
    {
        _mint(initialAccount, totalSupply);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens and
     * and then calls the spender contract to allow it to act on it.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an `Approval` event.
     */
    function approveAndCall(address spender, uint256 value, bytes memory extraData) public returns (bool) {
        _approve(msg.sender, spender, value);
        ISwarmTokenRecipient(spender).receiveApproval(msg.sender, value, address(this), extraData);
        return true;
    }

    /**
     * @dev Extract mistakenly sent ERC20 tokens to this contract.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits an `ClaimedTokens` event.
     *
     * Requirements:
     *
     * - `msg.sender` has to be controller of this contract.
     */
    function claimTokens(IERC20 token) public onlyController returns (bool) {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);

        emit ClaimedTokens(address(token), msg.sender, balance);

        return true;
    }

    /**
     * @dev Extract mistakenly sent ETH to this contract.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits an `ClaimedEthers` event.
     *
     * Requirements:
     *
     * - `msg.sender` has to be controller of this contract.
     */
    function claimEthers() public onlyController returns (bool) {
        uint256 balance = address(this).balance;
        msg.sender.transfer(balance);

        emit ClaimedEthers(msg.sender, balance);

        return true;
    }

    /**
     * @dev Allow contract to receive ether, prevent fallback
     * calls for functions that are not available.
     */
    function () external payable {
        require(msg.data.length == 0);
    }
}
