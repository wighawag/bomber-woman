// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "./UsingBomberWomanStore.sol";
import "../interface/UsingBomberWomanEvents.sol";
import "../interface/UsingBomberWomanErrors.sol";
import "./UsingVirtualTime.sol";
import "../../utils/PositionUtils.sol";

// TODO use hardhat-preprocessor
import "hardhat/console.sol";
import "../../utils/StringUtils.sol";

library logger {
    using PositionUtils for uint64;

    address constant CONSOLE_ADDRESS = 0x000000000000000000636F6e736F6c652e6c6f67;

    function _sendLogPayload(bytes memory payload) private view {
        address consoleAddress = CONSOLE_ADDRESS;
        /// @solidity memory-safe-assembly
        assembly {
            pop(staticcall(gas(), consoleAddress, add(payload, 32), mload(payload), 0, 0))
        }
    }

    // _sendLogPayload(abi.encodeWithSignature('log(string,int256,int256)', 'cell %s', x, y));

    function logPosition(string memory title, uint64 pos) internal pure {
        (int32 x, int32 y) = pos.toXY();
        console.log("%s: (%s,%s)", title, StringUtils.toString(x), StringUtils.toString(y));
    }

    function logCell(
        uint8 ii,
        string memory title,
        uint64 id,
        uint64 epoch,
        UsingBomberWomanTypes.CellAtEpoch memory cell
    ) internal pure {
        string memory indent = ii == 0
            ? ""
            : ii == 1
                ? "    "
                : ii == 2
                    ? "        "
                    : "            ";
        // string memory indent = '';
        console.log("%s%s", indent, title);
        (int32 x, int32 y) = id.toXY();
        console.log("%s-------------------------------------------------------------", indent);
        console.log("%scell (%s,%s)", indent, StringUtils.toString(x), StringUtils.toString(y));
        console.log("%s-------------------------------------------------------------", indent);
        console.log("%s - epoch: %s", indent, epoch);
        console.log("%s - delta: %s", indent, cell.exploded);
        console.log("%s-------------------------------------------------------------", indent);
    }

    function logTransfers(
        uint8 ii,
        string memory title,
        UsingBomberWomanTypes.TokenTransferCollection memory transferCollection
    ) internal pure {
        string memory indent = ii == 0
            ? ""
            : ii == 1
                ? "    "
                : ii == 2
                    ? "        "
                    : "            ";
        // string memory indent = '';
        console.log("%s%s", indent, title);
        console.log("%s-------------------------------------------------------------", indent);
        for (uint256 i = 0; i < transferCollection.numTransfers; i++) {
            console.log(
                "%stransfer (%s,%s)",
                indent,
                transferCollection.transfers[i].to,
                StringUtils.toString(transferCollection.transfers[i].amount)
            );
        }
        console.log("%s-------------------------------------------------------------", indent);
    }
}

abstract contract UsingBomberWomanState is
    UsingBomberWomanStore,
    UsingBomberWomanEvents,
    UsingBomberWomanErrors,
    UsingVirtualTime
{
    /// @notice The token used for the game. Each gems on the board contains that token
    IERC20WithIERC2612 internal immutable TOKENS;
    /// @notice the timestamp (in seconds) at which the game start, it start in the commit phase
    uint256 internal immutable START_TIME;
    /// @notice the duration of the commit phase in seconds
    uint256 internal immutable COMMIT_PHASE_DURATION;
    /// @notice the duration of the reveal phase in seconds
    uint256 internal immutable REVEAL_PHASE_DURATION;
    /// @notice the max number of level a cell can reach in the game
    uint8 internal immutable MAX_LIFE;
    /// @notice the number of tokens underlying each gems on the board.
    uint256 internal immutable NUM_TOKENS_PER_GEMS;
    /// @notice the address to send the token to when burning
    address payable internal immutable BURN_ADDRESS;
    /// @notice the generator that will be called whenever a player stake state change
    IOnStakeChange internal immutable GENERATOR;

    /// @notice the number of moves a hash represent, after that players make use of furtherMoves
    uint8 internal constant MAX_NUM_MOVES_PER_HASH = 32;

    /// @notice Create an instance of a BomberWoman game
    /// @param config configuration options for the game
    constructor(Config memory config) UsingVirtualTime(config) {
        TOKENS = config.tokens;
        BURN_ADDRESS = config.burnAddress;
        START_TIME = config.startTime;
        COMMIT_PHASE_DURATION = config.commitPhaseDuration;
        REVEAL_PHASE_DURATION = config.revealPhaseDuration;
    }

    function _epoch() internal view virtual returns (uint24 epoch, bool commiting) {
        uint256 epochDuration = COMMIT_PHASE_DURATION + REVEAL_PHASE_DURATION;
        uint256 time = _timestamp();
        if (time < START_TIME) {
            revert GameNotStarted();
        }
        uint256 timePassed = time - START_TIME;
        epoch = uint24(timePassed / epochDuration + 2); // epoch start at 2, this make the hypothetical previous reveal phase's epoch to be 1
        commiting = timePassed - ((epoch - 2) * epochDuration) < COMMIT_PHASE_DURATION;
    }

    function _getResolvedAvatar(uint256 avatarID) internal view returns (AvatarResolved memory) {
        Avatar memory avatar = _avatars[avatarID];
        bool dead = false;
        if (_cells[avatar.position][avatar.epoch].exploded) {
            dead = true;
        }
        return
            AvatarResolved({
                stake: avatar.stake,
                position: avatar.position,
                epoch: avatar.epoch,
                bombs: avatar.bombs,
                dead: dead
            });
    }

    function _getAvatar(uint256 avatarID) internal view returns (Avatar memory) {
        return _avatars[avatarID];
    }
}
