// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "../internal/UsingBomberWomanSetters.sol";
import "../internal/UsingBomberWomanUtils.sol";

contract BomberWomanPoke is IBomberWomanPoke, UsingBomberWomanSetters {
    constructor(Config memory config) UsingBomberWomanSetters(config) {}

    /// @inheritdoc IBomberWomanPoke
    function poke(uint64 position) external {
        (uint24 epoch, ) = _epoch();

        // max number of transfer is 5 (for each neighbour's potentially being a different account + own cell)

        TokenTransferCollection memory transferCollection = TokenTransferCollection({
            transfers: new TokenTransfer[](5),
            numTransfers: 0
        });
        _poke(transferCollection, position, epoch);

        _multiTransfer(TOKENS, transferCollection);

        emit SinglePoke(epoch, position);
    }

    /// @inheritdoc IBomberWomanPoke
    function pokeMultiple(uint64[] calldata positions) external {
        (uint24 epoch, ) = _epoch();

        uint256 numCells = positions.length;
        // max number of transfer is 4 * numCells (for each cell's neighbours potentially being a different account + own cell)
        TokenTransferCollection memory transferCollection = TokenTransferCollection({
            transfers: new TokenTransfer[](numCells * 5),
            numTransfers: 0
        });
        for (uint256 i = 0; i < numCells; i++) {
            _poke(transferCollection, positions[i], epoch);
        }
        _multiTransfer(TOKENS, transferCollection);

        emit MultiPoke(epoch, positions);
    }
}
