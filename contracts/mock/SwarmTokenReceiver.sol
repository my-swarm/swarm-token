pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract SwarmTokenRecipient {
    function receiveApproval(address from, uint256 amount, address token, bytes calldata data) external {
        IERC20(token).transferFrom(from, address(this), amount);
    }
}
