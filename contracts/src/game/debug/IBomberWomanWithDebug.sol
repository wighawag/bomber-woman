// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "./UsingBomberWomanDebugTypes.sol";
import "./UsingBomberWomanDebugEvents.sol";

interface IBomberWomanDebug is UsingBomberWomanDebugTypes, UsingBomberWomanDebugEvents {
    error InvalidCellOverwrite();
    error InvalidLifeConfiguration(uint256 life, int32 x, int32 y);

    function getRawCell(uint64 position, uint64 epoch) external view returns (CellAtEpoch memory cell);
}

interface IBomberWomanWithDebug is IBomberWoman, IBomberWomanDebug {}
