// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanSetters.sol";
import "../internal/UsingBomberWomanUtils.sol";

contract BomberWomanReveal is IBomberWomanReveal, UsingBomberWomanSetters {
    constructor(Config memory config) UsingBomberWomanSetters(config) {}

    /// @inheritdoc IBomberWomanReveal
    function reveal(address player, bytes32 secret, Move[] calldata moves, address payable payee) external payable {
        Commitment storage commitment = _commitments[player];
        (uint24 epoch, bool commiting) = _epoch();

        if (commiting) {
            revert InCommitmentPhase();
        }
        if (commitment.epoch == 0) {
            revert NothingToReveal();
        }
        if (commitment.epoch != epoch) {
            revert InvalidEpoch();
        }

        _checkHash(commitment.hash, secret, moves);

        _resolveMoves(player, epoch, moves);

        bytes24 hashRevealed = commitment.hash;
        commitment.epoch = 0; // used

        emit CommitmentRevealed(player, epoch, hashRevealed, moves);

        if (payee != address(0)) {
            payee.transfer(msg.value);
        }
    }

    /// @inheritdoc IBomberWomanReveal
    function acknowledgeMissedReveal(address player) external {
        // TODO
        Commitment storage commitment = _commitments[msg.sender];
        (uint24 epoch, ) = _epoch();

        if (commitment.epoch == 0) {
            revert NothingToReveal();
        }

        if (commitment.epoch == epoch) {
            revert CanStillReveal();
        }

        commitment.epoch = 0;

        // TODO block nft control

        // here we cannot know whether there were further move or even any moves
        // we just burn all tokens in reserve
        emit CommitmentVoid(msg.sender, epoch);
    }
}
