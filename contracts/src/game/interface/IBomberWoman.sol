// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "solidity-kit/solc_0_8/ERC721/interfaces/IERC721.sol";
import "solidity-kit/solc_0_8/ERC721/interfaces/IERC721Metadata.sol";
import "solidity-kit/solc_0_8/ERC165/interfaces/IERC165.sol";
import "./UsingBomberWomanTypes.sol";
import "./UsingBomberWomanEvents.sol";

interface IBomberWomanGetters is UsingBomberWomanTypes, UsingBomberWomanEvents {
    /// @notice Get the avatar state
    /// @param avatarID the avatar id to retrieve
    function getPlayeAvatar(uint256 avatarID) external view returns (PlayerAvatarResolved memory);

    /// @notice The commitment to be revealed. zeroed if no commitment need to be made.
    /// @param avatarID the address of which to retrieve the commitment
    function getCommitment(uint256 avatarID) external view returns (Commitment memory commitment);

    /// @notice return the config used to initialise the Game
    function getConfig() external view returns (Config memory config);
}

interface IBomberWomanCommit is UsingBomberWomanTypes, UsingBomberWomanEvents {
    /// @notice called by players to commit their moves
    ///  this can be called multiple time in the same epoch, the last call overriding the previous.
    ///  When a commitment is made, it needs to be revealed in the reveal phase of the same epoch.abi
    ///  If missed, player can still reveal its moves but none of them will be resolved.
    ///   The player would lose its associated reserved amount.
    /// @param commitments the avatarId, hash pair which the action belongs to
    /// @param payee address to send ETH to along the commitment. Can be used to pay for reveal
    function makeCommitments(CommitmentSubmission[] calldata commitments, address payable payee) external payable;

    /// @notice called by players to cancel their current commitment
    ///  Can only be called during the commit phase in which the commitment was made
    ///  It cannot be called afterward
    function cancelCommitments(uint256[] calldata avatarIDs) external;
}

interface IBomberWomanReveal is UsingBomberWomanTypes, UsingBomberWomanEvents {
    /// @notice called by player to reveal their moves
    ///  this is where the core logic of the game takes place
    ///  This is where the game board evolves
    ///  The game is designed so that reveal order does not matter
    /// @param moves the actual moves
    /// @param payee address to send ETH to along the reveal
    function reveal(AvatarMove[] calldata moves, address payable payee) external payable;

    /// @notice should only be called as last resort
    /// this will burn all tokens in reserve
    /// If player has access to the secret, better call `acknowledgeMissedReveal`
    function acknowledgeMissedReveals(uint256[] memory avatarIDs) external;
}

interface IBomberWoman is IBomberWomanCommit, IBomberWomanReveal, IBomberWomanGetters, IERC721, IERC721Metadata {}
