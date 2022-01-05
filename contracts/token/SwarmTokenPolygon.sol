pragma solidity ^0.5.0;

import "./SwarmToken.sol";

contract SwarmTokenPolygon is SwarmToken {

    address private _childChainManager;

    constructor(
        address controller,
        string memory name,
        string memory symbol,
        uint8 decimals,
        address childChainManager
    )
    SwarmToken(controller, name, symbol, decimals, address(0), 0)
    public {
        _childChainManager = childChainManager;
    }

    function childChainManager() external view returns (address) {
        return _childChainManager;
    }

    function updateChildChainManager(address newChildChainManager) external onlyController {
        require(newChildChainManager != address(0), "SwarmToken: Bad ChildChainManager address");
        _childChainManager = newChildChainManager;
    }

    function deposit(address user, bytes calldata depositData) external {
        require(msg.sender == _childChainManager, "SwarmToken: only ChildChainManager can deposit");
        uint256 amount = abi.decode(depositData, (uint256));
        _mint(user, amount);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}