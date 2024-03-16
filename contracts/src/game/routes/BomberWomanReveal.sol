// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanSetters.sol";
import "../internal/UsingBomberWomanUtils.sol";

contract BomberWomanReveal is IBomberWomanReveal, UsingBomberWomanSetters {
    constructor(Config memory config) UsingBomberWomanSetters(config) {}

    /// @inheritdoc IBomberWomanReveal
    function reveal(AvatarMove[] calldata moves, address payable payee) external payable {
        (uint24 epoch, bool commiting) = _epoch();
        if (commiting) {
            revert InCommitmentPhase();
        }

        for (uint256 i = 0; i < moves.length; i++) {
            AvatarMove memory move = moves[i];
            Commitment storage commitment = _commitments[move.avatarID];

            if (commitment.epoch == 0) {
                revert NothingToReveal();
            }
            if (commitment.epoch != epoch) {
                revert InvalidEpoch();
            }
            _checkHash(commitment.hash, move);
            _resolveActions(move.avatarID, epoch, move.actions);

            bytes24 hashRevealed = commitment.hash;
            commitment.epoch = 0; // used

            emit CommitmentRevealed(move.avatarID, epoch, hashRevealed, move.actions);
        }

        if (payee != address(0)) {
            payee.transfer(msg.value);
        }
    }

    /// @inheritdoc IBomberWomanReveal
    function acknowledgeMissedReveals(uint256[] memory avatarIDs) external {
        for (uint256 i = 0; i < avatarIDs.length; i++) {
            uint256 avatarID = avatarIDs[i];
            // TODO burn / stake ....
            Commitment storage commitment = _commitments[avatarID];
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
            emit CommitmentVoid(avatarID, epoch);
        }
    }
}
