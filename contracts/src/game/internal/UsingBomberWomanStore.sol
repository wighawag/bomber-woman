// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/UsingBomberWomanTypes.sol";

contract UsingBomberWomanStore is UsingBomberWomanTypes {
    mapping(uint64 => mapping(uint64 => CellAtEpoch)) internal _cells; // position => epoch => cell
    mapping(uint256 => Avatar) internal _avatars;
    mapping(uint256 => Commitment) internal _commitments;
}
