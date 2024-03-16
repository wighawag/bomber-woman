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
    enum ActionType {
        None,
        Bomb
    }

    /// @notice Move struct that define the action, type and position
    struct Action {
        uint64[] path; // we use position instead of delta so we can add teleport or other path mechanisms
        ActionType actionType;
    }

    /// @notice Move struct that define position and actions for one avatar
    struct AvatarMove {
        uint256 avatarID;
        Action[] actions;
        bytes32 secret;
    }

    /// @notice Commitment Submission data, avatar and hash
    struct CommitmentSubmission {
        uint256 avatarID;
        bytes24 hash;
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

    struct AvatarResolved {
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
        bool exploded;
    }

    struct Avatar {
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
