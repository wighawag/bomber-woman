// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "./UsingBomberWomanTypes.sol";

interface UsingBomberWomanEvents is UsingBomberWomanTypes {
    /// @notice A player has commited to make a move and reveal it on the reveal phase
    /// @param player account taking the staking risk (can be a different account than the one controlling the gems)
    /// @param epoch epoch number on which this commit belongs to
    /// @param commitmentHash the hash of moves
    event CommitmentMade(address indexed player, uint24 indexed epoch, bytes24 commitmentHash);

    /// @notice A player has cancelled its current commitment (before it reached the reveal phase)
    /// @param player account taking the staking risk (can be a different account than the one controlling the gems)
    /// @param epoch epoch number on which this commit belongs to
    event CommitmentCancelled(address indexed player, uint24 indexed epoch);

    /// @notice A player has canceled a previous commitment by burning some tokens
    /// @param player the account that made the commitment
    /// @param epoch epoch number on which this commit belongs to
    event CommitmentVoid(address indexed player, uint24 indexed epoch);

    /// @notice Player has revealed its previous commitment
    /// @param player account who commited
    /// @param epoch epoch number on which this commit belongs to
    /// @param commitmentHash the hash of the moves
    /// @param moves the moves
    event CommitmentRevealed(
        address indexed player,
        uint24 indexed epoch,
        bytes24 indexed commitmentHash,
        Move[] moves
    );
}
