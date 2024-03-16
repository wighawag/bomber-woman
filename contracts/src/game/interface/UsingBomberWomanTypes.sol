// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "solidity-kit/solc_0_8/ERC721/interfaces/IERC721.sol";
import "solidity-kit/solc_0_8/ERC165/interfaces/IERC165.sol";
import "solidity-kit/solc_0_8/ERC20/ERC2612/interfaces/IERC20WithIERC2612.sol";
import "solidity-kit/solc_0_8/debug/time/interfaces/ITime.sol";
import "../../token/interface/IOnStakeChange.sol";

interface UsingBomberWomanTypes {
    // --------------------------------------------------------------------------------------------
    // EXTERNAL TYPES
    // --------------------------------------------------------------------------------------------

    /// @notice The set of possible action
    enum Action {
        None,
        Bomb
    }

    /// @notice Move struct that define position and action
    struct Move {
        uint64 position; // TODO make it bigger ? uint32 * uint32 is probably infinitely big enough
        Action action;
    }

    /// @notice Permit struct to authorize EIP2612 ERC20 contracts
    struct Permit {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @notice Config struct to configure the game instance
    struct Config {
        IERC20WithIERC2612 tokens;
        address payable burnAddress;
        uint256 startTime;
        uint256 commitPhaseDuration;
        uint256 revealPhaseDuration;
        ITime time;
    }

    struct PlayerAvatarResolved {
        uint120 stake;
        uint64 position;
        uint64 epoch;
        uint8 bombs;
        bool dead;
    }

    // --------------------------------------------------------------------------------------------
    // STORAGE TYPES
    // --------------------------------------------------------------------------------------------

    struct CellAtEpoch {
        bool playersExploded; // only mark cell where there was a player
    }

    struct PlayerAvatar {
        uint120 stake;
        uint64 position;
        uint64 epoch;
        uint8 bombs;
    }

    struct Commitment {
        bytes24 hash;
        uint64 epoch;
    }

    // --------------------------------------------------------------------------------------------
    // INTERNAL TYPES
    // --------------------------------------------------------------------------------------------

    struct TokenTransfer {
        address payable to;
        uint256 amount;
    }

    struct TokenTransferCollection {
        TokenTransfer[] transfers;
        uint256 numTransfers;
    }
}
