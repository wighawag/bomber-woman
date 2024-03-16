// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanSetters.sol";
import "../internal/UsingBomberWomanUtils.sol";

contract BomberWomanCommit is IBomberWomanCommit, UsingBomberWomanSetters {
    constructor(Config memory config) UsingBomberWomanSetters(config) {}

    /// @inheritdoc IBomberWomanCommit
    function makeCommitment(bytes24 commitmentHash, address payable payee) external payable {
        _makeCommitment(msg.sender, commitmentHash);
        if (payee != address(0)) {
            payee.transfer(msg.value);
        }
    }

    /// @inheritdoc IBomberWomanCommit
    function cancelCommitment() external {
        Commitment storage commitment = _commitments[msg.sender];
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

        emit CommitmentCancelled(msg.sender, epoch);
    }
}
