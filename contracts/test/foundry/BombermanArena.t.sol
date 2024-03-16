// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {BombermanArena} from "../../src/BombermanArena.sol";

contract BombermanArenaTest is Test {
    BombermanArena public arena;

    function setUp() public {
        arena = new BombermanArena();
    }

    function test_commit() public {
        bytes32 h;
        arena.commit(h);
        assertEq(arena.commitments(msg.sender).h, h);
    }
}
