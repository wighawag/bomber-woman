import {expect, describe, it} from 'vitest';

import {parseGrid, renderGrid, toContractSimpleCell, xyToBigIntID} from 'bomber-woman-common';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';

import {getGrid, withGrid} from './utils/bomber-woman';
import {deployBomberWomanWithTestConfig, expectGridChange, expectGridChangeAfterActions} from './utils/bomber-woman-test';
import {parseEther} from 'viem';

describe('BomberWoman', function () {
	it('poking on a virtually dead cell sync its state accordingly', async function () {
		const setup = await loadFixture(deployBomberWomanWithTestConfig);
		const {BomberWoman, deployer, config, bomberWomanAdmin, Time} = setup;
		await withGrid(
			setup,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    | R1 | B2 |    |    |
		|    | 01 | 02 |    |    |
		-------------------------
		|    |    |    | P1 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
		);
		expect((await BomberWoman.read.getRawCell([xyToBigIntID(1, 2)])).life).to.equal(2);
		await Time.write.increaseTime([config.commitPhaseDuration + config.revealPhaseDuration], {
			account: bomberWomanAdmin,
		});
		await BomberWoman.write.poke([xyToBigIntID(1, 2)], {account: deployer});
		expect((await BomberWoman.read.getRawCell([xyToBigIntID(1, 2)])).life).to.equal(0);
	});

	it('reading the virtual state correctly report the number of life', async function () {
		const setup = await loadFixture(deployBomberWomanWithTestConfig);
		await expect(
			await withGrid(
				setup,
				`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    | R1 | B2 |    |    |
		|    | 01 | 02 |    |    |
		-------------------------
		|    |    |    | P2 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
			)
				.then(() =>
					setup.Time.write.increaseTime([setup.config.commitPhaseDuration + setup.config.revealPhaseDuration], {
						account: setup.bomberWomanAdmin,
					}),
				)
				.then(() => getGrid(setup, {x: 0, y: 0, width: 5, height: 5}))
				.then(renderGrid),
		).to.equal(
			renderGrid(
				parseGrid(`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    | R0 | B1 |    |    |
		|    | 01 | 02 |    |    |
		-------------------------
		|    |    |    | P3 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`),
			),
		);
	});

	it('placing a gem should have the desired effect', async function () {
		const setup = await loadFixture(deployBomberWomanWithTestConfig);
		await expectGridChange(
			setup,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    | R2 |+B +|    |    |
		|    | 01 |+02+|    |    |
		-------------------------
		|    |    |    | P2 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    | R1 | B1 |    |    |
		|    | 01 | 02 |    |    |
		-------------------------
		|    |    |    | P3 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
		);
	});

	it('placing 2 gems should have the desired effect', async function () {
		const setup = await loadFixture(deployBomberWomanWithTestConfig);
		await expectGridChange(
			setup,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |+B +|    |    |
		|    |    |+03+|    |    |
		-------------------------
		|    | R2 |+B +|    |    |
		|    | 01 |+02+|    |    |
		-------------------------
		|    |    |    | P2 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    | B3 |    |    |
		|    |    | 03 |    |    |
		-------------------------
		|    | R1 | B1 |    |    |
		|    | 01 | 02 |    |    |
		-------------------------
		|    |    |    | P3 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
		);
	});

	it('placing 3 gems should have the desired effect', async function () {
		const setup = await loadFixture(deployBomberWomanWithTestConfig);
		await expectGridChange(
			setup,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    |+B +|    |    |
		|    |    |+03+|    |    |
		-------------------------
		|    | R2 |+B +|    |    |
		|    | 02 |+02+|    |    |
		-------------------------
		|    |    |    | P2 |+P +|
		|    |    |    | 01 |+01+|
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
			`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    | B3 |    |    |
		|    |    | 03 |    |    |
		-------------------------
		|    | R1 | B1 |    |    |
		|    | 02 | 02 |    |    |
		-------------------------
		|    |    |    | P3 | P3 |
		|    |    |    | 01 | 01 |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`,
		);
	});

	it('multiple non-conflicting actions submission', async function () {
		const setup = await loadFixture(deployBomberWomanWithTestConfig);
		await setup.TestTokens.write.transfer([setup.otherAccounts[1], parseEther('1')], {
			account: setup.tokensBeneficiary,
		});
		await setup.TestTokens.write.transfer([setup.otherAccounts[2], parseEther('1')], {
			account: setup.tokensBeneficiary,
		});
		await expectGridChangeAfterActions(
			setup,
			`
			-------------------------
			|    |    |    |    |    |
			|    |    |    |    |    |
			-------------------------
			|    |    | B2 |    |    |
			|    |    | 03 |    |    |
			-------------------------
			|    | R1 | B1 |    |    |
			|    | 02 | 02 |    |    |
			-------------------------
			|    |    |    | P3 | P5 |
			|    |    |    | 01 | 01 |
			-------------------------
			|    |    |    |    |    |
			|    |    |    |    |    |
			-------------------------
			`,
			[
				`
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					|    |    |    |+B  |    |
					|    |    |    | 01 |    |
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
				`,
				`
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					|+P  |    |    |    |    |
					| 02 |    |    |    |    |
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					|    |    |    |    |    |
					|    |    |    |    |    |
					-------------------------
					`,
			],
			`
			-------------------------
			|    |    |    |    |    |
			|    |    |    |    |    |
			-------------------------
			|    |    | B3 | B3 |    |
			|    |    | 03 | 01 |    |
			-------------------------
			| P1 | R0 | B0 |    |    |
			| 02 | 02 | 02 |    |    |
			-------------------------
			|    |    |    | P4 | P6 |
			|    |    |    | 01 | 01 |
			-------------------------
			|    |    |    |    |    |
			|    |    |    |    |    |
			-------------------------
			
			`,
		);
	});

	it('poke on dead cell should give tokens to neighboring enemies', async function () {});

	it('forceSimpleCells', async function () {
		const {BomberWoman, deployer, otherAccounts} = await loadFixture(deployBomberWomanWithTestConfig);
		const grid = parseGrid(`
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		|    |    | B4 |    |    |
		|    |    | 03 |    |    |
		-------------------------
		|    | R1 | B2 | B1 |    |
		|    | 01 | 02 | 04 |    |
		-------------------------
		|    |    |    | P1 |    |
		|    |    |    | 01 |    |
		-------------------------
		|    |    |    |    |    |
		|    |    |    |    |    |
		-------------------------
		`);
		await BomberWoman.write.forceSimpleCells([grid.cells.map(toContractSimpleCell(otherAccounts))], {account: deployer});

		expect((await BomberWoman.read.getRawCell([xyToBigIntID(2, 2)])).delta).to.equal(1);
	});
});
