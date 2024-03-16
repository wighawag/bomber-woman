// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "./UsingBomberWomanTypes.sol";

interface UsingBomberWomanEvents is UsingBomberWomanTypes {
    /// @notice A player has commited to make a move and reveal it on the reveal phase
    /// @param avatarID avatar whose commitment is made
    /// @param epoch epoch number on which this commit belongs to
    /// @param commitmentHash the hash of moves
    event CommitmentMade(uint256 indexed avatarID, uint64 indexed epoch, bytes24 commitmentHash);

    /// @notice A player has cancelled its current commitment (before it reached the reveal phase)
    /// @param avatarID avatar whose commitment is cancelled
    /// @param epoch epoch number on which this commit belongs to
    event CommitmentCancelled(uint256 indexed avatarID, uint64 indexed epoch);

    /// @notice A player has acknowledged its failure to reveal its previous commitment
    /// @param avatarID the account that made the commitment
    /// @param epoch epoch number on which this commit belongs to
    event CommitmentVoid(uint256 indexed avatarID, uint64 indexed epoch);

    /// @notice Player has revealed its previous commitment
    /// @param avatarID avatar id whose action is commited
    /// @param epoch epoch number on which this commit belongs to
    /// @param commitmentHash the hash of the moves
    /// @param actions the actions
    event CommitmentRevealed(
        uint256 indexed avatarID,
        uint64 indexed epoch,
        bytes24 indexed commitmentHash,
        Action[] actions
    );
}
