pragma solidity ^0.5.0;

/**
 * @title ISwarmTokenRecipient public interface to be called by SwarmToken.approveAndCall()
 */
interface ISwarmTokenRecipient {
    function receiveApproval(address from, uint256 amount, address token, bytes calldata data) external;
}
