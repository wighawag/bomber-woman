// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanSetters.sol";
import "../internal/UsingBomberWomanUtils.sol";

contract BomberWomanCommit is IBomberWomanCommit, UsingBomberWomanSetters {
    constructor(Config memory config) UsingBomberWomanSetters(config) {}

    /// @inheritdoc IBomberWomanCommit
    function makeCommitments(CommitmentSubmission[] calldata commitments, address payable payee) external payable {
        for (uint256 i = 0; i < commitments.length; i++) {
            _makeCommitment(commitments[i].avatarID, commitments[i].hash);
        }

        if (payee != address(0)) {
            payee.transfer(msg.value);
        }
    }

    /// @inheritdoc IBomberWomanCommit
    function cancelCommitments(uint256[] calldata avatarIDs) external {
        for (uint256 i = 0; i < avatarIDs.length; i++) {
            uint256 avatarID = avatarIDs[i];
            // TODO check msg.sender control of avatarID
            Commitment storage commitment = _commitments[avatarID];
            (uint24 epoch, bool commiting) = _epoch();
            if (!commiting) {
                revert InRevealPhase();
            }
            if (commitment.epoch != epoch) {
                revert PreviousCommitmentNotRevealed();
            }

            // Note that we do not reset the hash
            // This ensure the slot do not get reset and keep the gas cost consistent across execution
            commitment.epoch = 0;

            emit CommitmentCancelled(avatarID, epoch);
        }
    }
}
