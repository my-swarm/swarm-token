pragma solidity ^0.5.0;

contract Controlled {
    address private _controller;

    /**
     * @dev Emitted when the controller address changes.
     */
    event ControllerTransferred(address recipient);

    /**
     * @dev Constructs and sets the controller address.
     */
    constructor (address controller) internal {
        _controller = controller;
        emit ControllerTransferred(_controller);
    }

    /**
     * @dev Reverts if called from any address other than the controller.
     */
    modifier onlyController() {
        require(msg.sender == _controller, "Controlled: caller is not the controller address");
        _;
    }

    /**
     * @return the address of the controller.
     */
    function controller() public view returns (address) {
        return _controller;
    }

    /**
     * @dev Transfers contract to a new controller.
     * @param recipient The address of new controller.
     */
    function transferController(address recipient) public onlyController {
        require(recipient != address(0), "Controlled: new controller is the zero address");
        _controller = recipient;
        emit ControllerTransferred(_controller);
    }
}
