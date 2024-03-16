// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "./UsingBomberWomanState.sol";
import "../interface/UsingBomberWomanEvents.sol";
import "./UsingBomberWomanUtils.sol";
import "../../utils/PositionUtils.sol";
import "solidity-kit/solc_0_8/ERC721/interfaces/UsingERC721Events.sol";

abstract contract UsingBomberWomanSetters is UsingBomberWomanState, UsingBomberWomanUtils, UsingERC721Events {
    using PositionUtils for uint64;

    constructor(Config memory config) UsingBomberWomanState(config) {}

    function _makeCommitment(uint256 avatarID, bytes24 commitmentHash) internal {
        Commitment storage commitment = _commitments[avatarID];

        (uint24 epoch, bool commiting) = _epoch();

        if (!commiting) {
            revert InRevealPhase();
        }
        if (commitment.epoch != 0 && commitment.epoch != epoch) {
            revert PreviousCommitmentNotRevealed();
        }

        commitment.hash = commitmentHash;
        commitment.epoch = epoch;

        emit CommitmentMade(avatarID, epoch, commitmentHash);
    }

    function _resolveActions(uint256 avatarID, uint64 epoch, Action[] memory actions) internal {
        for (uint256 i = 0; i < actions.length; i++) {
            _computeAction(avatarID, epoch, actions[i]);
        }
    }

    function _computeAction(uint256 avatarID, uint64 epoch, Action memory action) internal {}
}
