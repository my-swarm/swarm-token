pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface ISwarmTokenControlled {
    event DocumentUpdated(bytes32 hash, string url);
    event ClaimedTokens(address indexed token, address indexed controller, uint256 amount);
    event ClaimedEther(address indexed controller, uint256 amount);

    function updateDocument(bytes32 hash, string calldata url) external returns (bool);
    function claimTokens(IERC20 token) external returns (bool);
    function claimEther() external returns (bool);
}
