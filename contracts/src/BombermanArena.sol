// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "solidity-proxy/solc_0_8/ERC1967/Proxied.sol";

contract BombermanArena is Proxied {
    // ----------------------------------------------------------------------------------------------
    // TYPES
    // ----------------------------------------------------------------------------------------------

    struct Commitment {
        bytes32 h;
    }

    // ----------------------------------------------------------------------------------------------
    // STORAGE
    // ----------------------------------------------------------------------------------------------

    mapping(address => Commitment) internal _commitments;

    // ----------------------------------------------------------------------------------------------
    // CONSTRUCTOR / INITIALIZER
    // ----------------------------------------------------------------------------------------------

    constructor() {
        _postUpgrade();
    }

    function postUpgrade() external onlyProxyAdmin {
        _postUpgrade();
    }

    function _postUpgrade() internal {}

    // ----------------------------------------------------------------------------------------------
    // PUBLIC INTERFACE
    // ----------------------------------------------------------------------------------------------

    function commit(bytes32 h) external {
        _commitments[msg.sender] = Commitment({h: h});
    }

    function commitments(address account) external view returns (Commitment memory) {
        return _commitments[account];
    }

    // ----------------------------------------------------------------------------------------------
    // INTERNAL
    // ----------------------------------------------------------------------------------------------
}
