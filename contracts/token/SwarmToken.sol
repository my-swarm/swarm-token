pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "./ISwarmTokenControlled.sol";
import "./ISwarmTokenRecipient.sol";
import "../access/Controlled.sol";

contract SwarmToken is ISwarmTokenControlled, ERC20Burnable, ERC20Detailed, Controlled {
    struct Document {
        bytes32 hash;
        string url;
    }

    Document private _document;

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
     * Emits an `Approval` event.
     *
     * @param spender Spender that caller approves to spend tokens.
     * @param value Approval value. Has to be zero, or current allowance for `spender` has to be a zero.
     * This is to avoid https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     * @param extraData Data sent to spender on `receiveApproval` call.
     * @return Boolean value indicating whether the operation succeeded.
     */
    function approveAndCall(address spender, uint256 value, bytes memory extraData) public returns (bool) {
        require(value == 0 || allowance(msg.sender, spender) == 0, 'SwarmToken: not clean allowance state');

        _approve(msg.sender, spender, value);
        ISwarmTokenRecipient(spender).receiveApproval(msg.sender, value, address(this), extraData);
        return true;
    }

    /**
     * @dev Retrieve token document hash and url.
     *
     * @return Hash of document.
     * @return URL of document.
     */
    function getDocument() external view returns (bytes32, string memory) {
        return (_document.hash, _document.url);
    }

    /**
     * @dev Update token document, sending document hash and url. Hash is
     * SHA256 hash of document content.
     *
     * Emits DocumentUpdated event.
     *
     * Allowed to be called by controller account.
     *
     * @param hash SHA256 hash of token document.
     * @param url URL of token's token document.
     * @return Boolean value indicating whether the operation succeeded.
     */
    function updateDocument(bytes32 hash, string calldata url) external onlyController returns (bool) {
        return _updateDocument(hash, url);
    }

    /**
     * @dev Extract mistakenly sent ERC20 tokens to this contract.
     *
     * Emits an `ClaimedTokens` event.
     *
     * Allowed to be called by controller account.
     *
     * @param token ERC20 token contract address of tokens to retrieve.
     * @return Boolean value indicating whether the operation succeeded.
     */
    function claimTokens(IERC20 token) external onlyController returns (bool) {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);

        emit ClaimedTokens(address(token), msg.sender, balance);

        return true;
    }

    /**
     * @dev Extract mistakenly sent ETH to this contract.
     *
     * Emits an `ClaimedEther` event.
     *
     * Allowed to be called by controller account.
     *
     * @return Boolean value indicating whether the operation succeeded.
     */
    function claimEther() external onlyController returns (bool) {
        uint256 balance = address(this).balance;
        msg.sender.transfer(balance);

        emit ClaimedEther(msg.sender, balance);

        return true;
    }

    /**
     * @dev Allow contract to receive ether, prevent fallback
     * calls for functions that are not available.
     */
    function () external payable {
        require(msg.data.length == 0);
    }

    /**
     * @dev Internal function to change token document hash and url.
     * Emits DocumentUpdated event.
     *
     * @param hash SHA256 hash of document.
     * @param url URL of token's document.
     * @return Boolean value indicating whether the operation succeeded.
     */
    function _updateDocument(bytes32 hash, string memory url) internal returns (bool) {
        _document.hash = hash;
        _document.url = url;

        emit DocumentUpdated(hash, url);

        return true;
    }
}
