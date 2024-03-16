// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "../internal/UsingBomberWomanSetters.sol";
import "./IBomberWomanWithDebug.sol";
import "../../utils/PositionUtils.sol";
import "solidity-kit/solc_0_8/utils/UsingGenericErrors.sol";

contract BomberWomanDebug is UsingBomberWomanSetters, IBomberWomanDebug {
    using PositionUtils for uint64;

    constructor(Config memory config) UsingBomberWomanSetters(config) {}

    function getRawCell(uint64 position, uint64 epoch) external view returns (CellAtEpoch memory) {
        return _cells[position][epoch];
    }
}
