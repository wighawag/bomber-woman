// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../interface/IBomberWoman.sol";
import "./UsingBomberWomanDebugTypes.sol";
import "./UsingBomberWomanDebugEvents.sol";

interface IBomberWomanDebug is UsingBomberWomanDebugTypes, UsingBomberWomanDebugEvents {
    error InvalidCellOverwrite();
    error InvalidLifeConfiguration(uint256 life, int32 x, int32 y);

    function forceMoves(address player, Move[] memory moves) external;

    function forceSimpleCells(SimpleCell[] memory cells) external;

    function getRawCell(uint256 id) external view returns (Cell memory cell);
}

interface IBomberWomanWithDebug is IBomberWoman, IBomberWomanDebug {}
