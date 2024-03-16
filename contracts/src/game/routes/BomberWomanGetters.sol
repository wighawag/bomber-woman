// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanState.sol";

contract BomberWomanGetters is IBomberWomanGetters, UsingBomberWomanState {
    constructor(Config memory config) UsingBomberWomanState(config) {}

    /// @inheritdoc IBomberWomanGetters
    function getAvatar(uint256 avatarID) external view returns (AvatarResolved memory) {
        return _getResolvedAvatar(avatarID);
    }

    /// @inheritdoc IBomberWomanGetters
    function getCommitment(uint256 avatarID) external view returns (Commitment memory commitment) {
        return _commitments[avatarID];
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
