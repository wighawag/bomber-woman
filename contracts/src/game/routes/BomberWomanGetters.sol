// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanState.sol";

contract BomberWomanGetters is IBomberWomanGetters, UsingBomberWomanState {
    constructor(Config memory config) UsingBomberWomanState(config) {}

    /// @inheritdoc IBomberWomanGetters
    function getPlayeAvatar(uint256 id) external view returns (PlayerAvatarResolved memory) {
        PlayerAvatar memory avatar = _avatars[id];
        bool dead = false;
        if (_cells[avatar.position][avatar.epoch].playersExploded) {
            dead = true;
        }
        return
            PlayerAvatarResolved({
                stake: avatar.stake,
                position: avatar.position,
                epoch: avatar.epoch,
                bombs: avatar.bombs,
                dead: dead
            });
    }

    /// @inheritdoc IBomberWomanGetters
    function getCommitment(address account) external view returns (Commitment memory commitment) {
        return _commitments[account];
    }

    /// @inheritdoc IBomberWomanGetters
    function getConfig() external view returns (Config memory config) {
        config.tokens = TOKENS;
        config.burnAddress = BURN_ADDRESS;
        config.startTime = START_TIME;
        config.commitPhaseDuration = COMMIT_PHASE_DURATION;
        config.revealPhaseDuration = REVEAL_PHASE_DURATION;
    }
}
