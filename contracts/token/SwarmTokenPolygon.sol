pragma solidity ^0.5.0;

import "./SwarmToken.sol";

contract SwarmTokenPolygon is SwarmToken {

    address public childChainManagerProxy;

    constructor(
        address controller,
        string memory name,
        string memory symbol,
        uint8 decimals,
        address childChainManager
    )
    SwarmToken(controller, name, symbol, decimals, address(0), 0)
    public {
        childChainManagerProxy = childChainManager;
    }


    // being proxified smart contract, most probably childChainManagerProxy contract's address
    // is not going to change ever, but still, lets keep it
    function updateChildChainManager(address newChildChainManagerProxy) external onlyController {
        require(newChildChainManagerProxy != address(0), "Bad ChildChainManagerProxy address");
        childChainManagerProxy = newChildChainManagerProxy;
    }

    function deposit(address user, bytes calldata depositData) external {
        require(msg.sender == childChainManagerProxy, "You're not allowed to deposit");
        uint256 amount = abi.decode(depositData, (uint256));
        _mint(user, amount);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}