// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "./UsingBomberWomanState.sol";
import "../interface/UsingBomberWomanEvents.sol";
import "./UsingBomberWomanUtils.sol";
import "../../utils/PositionUtils.sol";

abstract contract UsingBomberWomanSetters is UsingBomberWomanState, UsingBomberWomanUtils {
    using PositionUtils for uint64;

    constructor(Config memory config) UsingBomberWomanState(config) {}

    function _makeCommitment(uint256 avatarID, bytes24 commitmentHash) internal {
        AvatarResolved memory avatar = _getResolvedAvatar(avatarID);

        if (avatar.dead) {
            revert AvatarIsDead(avatarID);
        }

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
        Avatar memory avatar = _getAvatar(avatarID);
        uint64 position = avatar.position;
        for (uint256 i = 0; i < actions.length; i++) {
            uint64[] memory path = actions[i].path;
            for (uint256 j = 0; j < path.length; j++) {
                uint64 next = path[j];
                if (_isValidMove(position, next)) {
                    position = next;
                }
                if (actions[i].actionType == ActionType.Bomb && !_cells[position][epoch].exploded) {
                    _cells[position][epoch].exploded = true;
                }
            }
        }
    }

    function _isValidMove(uint64 from, uint64 to) internal pure returns (bool valid) {
        // TODO
        valid = true;
    }
}
