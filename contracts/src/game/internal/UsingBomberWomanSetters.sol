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

    function _makeCommitment(address player, bytes24 commitmentHash) internal {
        Commitment storage commitment = _commitments[player];

        (uint24 epoch, bool commiting) = _epoch();

        if (!commiting) {
            revert InRevealPhase();
        }
        if (commitment.epoch != 0 && commitment.epoch != epoch) {
            revert PreviousCommitmentNotRevealed();
        }

        commitment.hash = commitmentHash;
        commitment.epoch = epoch;

        emit CommitmentMade(player, epoch, commitmentHash);
    }

    function _resolveMoves(address player, uint64 epoch, Move[] memory moves) internal {
        // max number of transfer is (4+1) * moves.length
        // (for each move's cell's neighbours potentially being a different account)
        // limiting the number of move per commitment reveal to 32 or, even more probably, should cover this unlikely scenario
        TokenTransferCollection memory transferCollection = TokenTransferCollection({
            transfers: new TokenTransfer[](moves.length * 5),
            numTransfers: 0
        });
        for (uint256 i = 0; i < moves.length; i++) {
            _computeMove(transferCollection, player, epoch, moves[i]);
        }

        _multiTransfer(TOKENS, transferCollection);
    }

    function _computeMove(
        TokenTransferCollection memory transferCollection,
        address player,
        uint64 epoch,
        Move memory move
    ) internal {}
}
