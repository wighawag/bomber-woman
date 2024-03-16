// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/UsingBomberWomanTypes.sol";

contract UsingBomberWomanStore is UsingBomberWomanTypes {
    mapping(uint64 => mapping(uint64 => CellAtEpoch)) internal _cells;
    mapping(uint256 => PlayerAvatar) internal _avatars;
    mapping(address => Commitment) internal _commitments;
}
