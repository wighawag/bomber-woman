import {expect} from 'vitest';
import solidityKitArtifacts from 'solidity-kit/generated/artifacts';

import {
	parseGrid,
	renderGrid,
	Grid,
	Cell,
	bigIntIDToXY,
	BomberWomanContract,
	xyToBigIntID,
	EVIL_OWNER_ADDRESS,
} from 'bomber-woman-common';
import {Data, createProcessor} from 'bomber-woman-indexer';
import {createIndexerState} from 'ethereum-indexer-browser';

import {Deployment, loadAndExecuteDeployments} from 'rocketh';

import {getConnection, fetchContract} from '../../utils/connection';

import artifacts from '../../generated/artifacts';
import {network} from 'hardhat';

import type {GameConfig} from '../../deploy/020_deploy_game';
import {formatEther, parseEther} from 'viem';
import {GridEnv, getGrid, performGridActions, withGrid} from './bomber-woman';
import {EIP1193GenericRequestProvider, EIP1193ProviderWithoutEvents} from 'eip-1193';

export type WalletBalance = {stakingToken: bigint; points?: bigint};

export async function expectGridChange(setup: GridEnv, gridWithAction: string, resultGrid: string) {
	await expect(
		await withGrid(setup, gridWithAction)
			.then(() => getGrid(setup, {x: 0, y: 0, width: 5, height: 5}))
			.then(renderGrid),
	).to.equal(renderGrid(parseGrid(resultGrid)));
}

export async function expectGridChangeAfterActions(
	setup: GridEnv,
	grid: string,
	actionGrids: string[],
	resultGrid: string,
) {
	await expect(
		await withGrid(setup, grid)
			.then(() => performGridActions(setup, actionGrids))
			.then(() => getGrid(setup, {x: 0, y: 0, width: 5, height: 5}))
			.then(renderGrid),
	).to.equal(renderGrid(parseGrid(resultGrid)));
}

export async function setupWallets(env: GridEnv, walletsBefore: {[playerIndex: number]: WalletBalance}) {
	for (const playerIndex of Object.keys(walletsBefore)) {
		const player = Number(playerIndex) >= 0 ? env.otherAccounts[playerIndex] : EVIL_OWNER_ADDRESS;
		const amount = await env.TestTokens.read.balanceOf([player]);
		const expectedAmount: WalletBalance = walletsBefore[playerIndex];
		const amountToTransfer = expectedAmount.stakingToken - amount;
		if (amountToTransfer > 0) {
			await env.TestTokens.write.transfer([player, amountToTransfer], {
				account: env.tokensBeneficiary,
			});
		} else if (amountToTransfer < 0) {
			throw new Error(`too much token`);
		}
	}
}

export async function expectIndexedGridToMatch(env: GridEnv, resultGrid: string, epoch: number) {
	const processor = createProcessor();
	const {state, syncing, status, init, indexToLatest} = createIndexerState(processor);
	// console.log('--------------------------------------------------------');
	// console.log(state.$state);
	// console.log('--------------------------------------------------------');
	await init({
		provider: env.provider,
		source: {
			chainId: '31337',
			contracts: [{abi: env.BomberWoman.abi as any, address: env.BomberWoman.address}],
		},
	}).then((v) => indexToLatest());
	// console.log('- INDEXED -------------------------------------------------------');
	// console.log(state.$state);
	// console.log('--------------------------------------------------------');
	const grid = fromStateToGrid(env, state.$state, epoch);
	// console.log(grid);
	// TODO reenable
	await expect(renderGrid(grid)).to.equal(renderGrid(parseGrid(resultGrid)));
}

export function fromStateToGrid(env: GridEnv, state: Data, epoch: number): Grid {
	const bomberWomanContract = new BomberWomanContract(state, 7); // TODO MAX_LIFE
	const gridCells: Cell[] = [];
	// let minX = 0;
	// let minY = 0;
	// let maxX = 0;
	// let maxY = 0;
	// console.log('FROM STATE TO GRID 3,1');
	// console.log(state.cells[xyToBigIntID(3, 1).toString()]);

	for (const positionString of Object.keys(state.cells)) {
		const position = BigInt(positionString);
		const {updatedCell: cell} = bomberWomanContract.getUpdatedCell(position, epoch);

		const {x, y} = bigIntIDToXY(position);
		const ownerAddress = state.owners[positionString];
		const accountIndex = env.otherAccounts.findIndex((v) => v.toLowerCase() === ownerAddress?.toLowerCase());
		let owner: undefined | number = undefined;
		if (accountIndex >= 0) {
			owner = accountIndex;
		} else if (ownerAddress.toLowerCase() == EVIL_OWNER_ADDRESS.toLowerCase()) {
			owner = -cell.stake;
		}
		const gridCell = {
			x,
			y,
			owner,
			color: cell.color,
			life: cell.life,
			lastEpochUpdate: cell.lastEpochUpdate,
			epochWhenTokenIsAdded: cell.epochWhenTokenIsAdded,
			delta: cell.delta,
			enemyMap: cell.enemyMap,
			stake: cell.stake,
		};
		gridCells.push(gridCell);

		const epochDelta = epoch - cell.lastEpochUpdate;
		if (epochDelta > 0 && gridCell.life > 0) {
			gridCell.life += gridCell.delta * epochDelta;
			if (gridCell.life > 7) {
				// TODO MAX_LIFE
				gridCell.life = 7;
			}
			if (gridCell.life < 0) {
				gridCell.life = 0;
			}
		}
	}
	return {
		cells: gridCells,
		width: 5,
		height: 5,
	};
}

export async function expectWallet(env: GridEnv, expectedWalletsAfter: {[playerIndex: number]: WalletBalance}) {
	for (const playerIndex of Object.keys(expectedWalletsAfter)) {
		const player = Number(playerIndex) >= 0 ? env.otherAccounts[playerIndex] : EVIL_OWNER_ADDRESS;
		const amount = await env.TestTokens.read.balanceOf([player]);
		// console.log({
		// 	player: playerIndex,
		// 	amount: formatEther(amount),
		// });
	}
	for (const playerIndex of Object.keys(expectedWalletsAfter)) {
		const player = Number(playerIndex) >= 0 ? env.otherAccounts[playerIndex] : EVIL_OWNER_ADDRESS;
		const stakingTokenAmount = await env.TestTokens.read.balanceOf([player]);

		const expectedAmount: WalletBalance = expectedWalletsAfter[playerIndex];
		expect(stakingTokenAmount, `player ${playerIndex} (${player}) staking token`).to.equal(expectedAmount.stakingToken);
		if (expectedAmount.points) {
			const pointsTokenAmount = await env.GemsGenerator.read.balanceOf([player]);
			expect(pointsTokenAmount, `player ${playerIndex} (${player}) points`).to.equal(expectedAmount.points);
		}
	}
}

async function deployBomberWoman(override?: Partial<GameConfig>) {
	const {accounts, walletClient, publicClient} = await getConnection();
	const [deployer, tokensBeneficiary, ...otherAccounts] = accounts;

	const provider = network.provider as EIP1193GenericRequestProvider;
	const {deployments} = await loadAndExecuteDeployments(
		{
			provider,
			// logLevel: 6,
		},
		override,
	);

	const TestTokens = await fetchContract(deployments['TestTokens'] as Deployment<typeof artifacts.TestTokens.abi>);
	const Gems = await fetchContract(deployments['Gems'] as Deployment<typeof artifacts.Gems.abi>);
	const GemsGenerator = await fetchContract(
		deployments['GemsGenerator'] as Deployment<typeof artifacts.RewardsGenerator.abi>,
	);
	const BomberWoman = await fetchContract(
		deployments['BomberWoman'] as Deployment<typeof artifacts.IBomberWomanWithDebug.abi>,
	);
	const Time = await fetchContract(deployments['Time'] as Deployment<typeof solidityKitArtifacts.Time.abi>);

	const config = await BomberWoman.read.getConfig();

	await TestTokens.write.transfer([deployer, parseEther('1000')], {account: tokensBeneficiary});
	await TestTokens.write.approve([BomberWoman.address, parseEther('1000')], {account: deployer});

	return {
		deployer,
		bomberWomanAdmin: deployer, // TODO
		tokensBeneficiary,
		BomberWoman,
		TestTokens,
		config,
		otherAccounts,
		provider: provider as any,
		Gems,
		Time,
		GemsGenerator,
	};
}

export async function deployBomberWomanWithTestConfig() {
	const {publicClient} = await getConnection();
	const override = {
		startTime: Number((await publicClient.getBlock()).timestamp),
	};
	const result = await deployBomberWoman(override);
	return result;
}

export async function pokeAll(env: GridEnv, resultGrid: string, epoch: number) {
	const processor = createProcessor();
	const {state, syncing, status, init, indexToLatest} = createIndexerState(processor);

	// keep grid already
	await init({
		provider: env.provider,
		source: {
			chainId: '31337',
			contracts: [{abi: env.BomberWoman.abi as any, address: env.BomberWoman.address}],
		},
	}).then((v) => indexToLatest());

	const {accounts, walletClient, publicClient} = await getConnection();
	const [deployer] = accounts;
	await env.BomberWoman.write.pokeMultiple([Object.keys(state.$state.cells).map((v) => BigInt(v))], {account: deployer});
}
