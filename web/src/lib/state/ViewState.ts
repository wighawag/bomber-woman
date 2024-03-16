import {
	xyToXYID,
	type ContractCell,
	bigIntIDToXY,
	BomberWomanContract,
	type BomberWomanState,
	countBits,
	xyToBigIntID,
	IDToXY,
	Color,
} from 'bomber-woman-common';
import type {Data} from 'bomber-woman-indexer';
import {derived} from 'svelte/store';
import {state} from '$lib/state/State';
import {account, accountData} from '$lib/blockchain/connection';
import {epochState, type EpochState} from '$lib/state/Epoch';
import type {AccountState} from 'web3-connection';
import {
	localMoveToContractMove,
	type CommitMetadata,
	type OffchainState,
	type BomberWomanMetadata,
	type BomberWomanTransaction,
	type LocalMove,
} from '$lib/account/account-data';
import type {OnChainAction, OnChainActions} from '$lib/account/base';
import {createDraft} from 'immer';
import {parseEther, parseUnits} from 'viem';
import {initialContractsInfos} from '$lib/config';

export type ViewCell = ContractCell & {
	localState?: 'pending' | 'planned';
};

export type ViewCellData = {next: ViewCell; future: ViewCell; currentPlayer: boolean};

export type GemsToWithdraw = {position: bigint; amount: bigint; from: bigint; color: Color};

export type BomberWomanViewState = BomberWomanState & {
	viewCells: {
		[position: string]: ViewCellData;
	};
	owners: {[position: string]: `0x${string}`};
	hasCommitmentToReveal?: {epoch: number; commit?: {hash: `0x${string}`; tx: BomberWomanTransaction}};
	hasCommitment?: boolean;
	hasSomeCells: boolean;
	tokensToCollect: GemsToWithdraw[];
	rawState: Data;
};

function isValidMove(move: LocalMove) {
	if (move.x != undefined && move.y != undefined) {
		return true;
	}

	// TODO more checks
	return false;
}

const decimals = Number(initialContractsInfos.contracts.BomberWoman.linkedData.currency.decimals);

function merge(
	state: Data,
	offchainState: OffchainState,
	onchainActions: OnChainActions<BomberWomanMetadata>,
	epochState: EpochState,
	account: AccountState<`0x${string}`>,
): BomberWomanViewState {
	const bomberWomanUnchanged = new BomberWomanContract(state, 7);
	const rawState = state;
	const copyState = createDraft(state);
	// TODO use finishDraft ?

	const hasSomeCells = Object.keys(copyState.cells).length > 0;

	const bomberWoman = new BomberWomanContract(copyState, 7);

	// console.log({epoch: epochState.epoch, isActionPhase: epochState.isActionPhase});

	let hasCommitment = false;
	if (offchainState.moves !== undefined && offchainState.moves.epoch === epochState.epoch && epochState.isActionPhase) {
		for (const move of offchainState.moves.list) {
			if (!isValidMove(move)) {
				console.error(`INVALID MOVE`, move);
				continue; // TODO delete
			}
			console.log(`color: ${move.color}`);
			bomberWoman.computeMove(account.address as `0x${string}`, epochState.epoch, localMoveToContractMove(move));
		}
	} else {
		let lastCommitment: OnChainAction<CommitMetadata> | undefined;
		for (const txHash of Object.keys(onchainActions)) {
			const action = onchainActions[txHash as `0x${string}`];
			if (action.tx.metadata && action.status !== 'Failure') {
				const metadata = action.tx.metadata;
				if (metadata.type === 'commit') {
					// TODO
					// TODO || || !action.revealTx
					if (metadata.epoch == epochState.epoch && epochState.isActionPhase) {
						// TODO what if no nonce ?

						if (
							!lastCommitment ||
							(lastCommitment.tx.nonce &&
								action.tx.nonce &&
								Number(lastCommitment.tx.nonce) < Number(action.tx.nonce)) ||
							(lastCommitment.tx.timestamp && action.tx.timestamp && lastCommitment.tx.timestamp < action.tx.timestamp)
						) {
							lastCommitment = action as OnChainAction<CommitMetadata>; // TODO why type ?
						}
					}
				}
			}
		}

		if (lastCommitment) {
			hasCommitment = true;
			const metadata = lastCommitment.tx.metadata;
			if (!metadata) {
				// TODO fix type
				console.error(`no metadata, cannot reach here`);
			} else {
				for (const move of metadata.localMoves) {
					bomberWoman.computeMove(account.address as `0x${string}`, epochState.epoch, localMoveToContractMove(move));
				}
			}
		}
	}

	const viewState: BomberWomanViewState = {
		cells: {},
		viewCells: {},
		owners: {},
		hasCommitmentToReveal: undefined,
		hasCommitment,
		hasSomeCells,
		tokensToCollect: [],
		rawState,
	};
	for (const cellID of Object.keys(copyState.cells)) {
		const {x, y} = bigIntIDToXY(BigInt(cellID));
		const cell = copyState.cells[cellID];
		const {updatedCell: next} = bomberWoman.getUpdatedCell(BigInt(cellID), epochState.epoch + 0);
		const {updatedCell: future} = bomberWoman.getUpdatedCell(BigInt(cellID), epochState.epoch + 1);
		// console.log({
		// 	x,
		// 	y,
		// 	cell,
		// 	updatedCell,
		// 	epoch,
		// });
		const viewCell = {
			next,
			future,
			currentPlayer: copyState.owners[cellID]?.toLowerCase() === account.address?.toLowerCase(),
		};
		viewState.viewCells[xyToXYID(x, y)] = viewCell;
		viewState.cells[xyToXYID(x, y)] = copyState.cells[cellID];
		// console.log(`${x}, ${y}`, viewCell);
	}
	for (const pos of Object.keys(copyState.owners)) {
		const {x, y} = bigIntIDToXY(BigInt(pos));
		viewState.owners[xyToXYID(x, y)] = copyState.owners[pos];
	}

	if (account.address) {
		const addr = account.address.toLowerCase();
		const commitment = state.commitments[account.address.toLowerCase()];
		if (commitment && (!epochState.isActionPhase || commitment.epoch < epochState.epoch)) {
			viewState.hasCommitmentToReveal = {epoch: commitment.epoch};
			for (const txHash of Object.keys(onchainActions)) {
				const action = onchainActions[txHash as `0x${string}`];
				if (action.tx.metadata) {
					const metadata = action.tx.metadata;
					if (metadata.type === 'commit') {
						if (metadata.epoch == commitment.epoch) {
							viewState.hasCommitmentToReveal = {
								epoch: commitment.epoch,
								commit: {hash: txHash as `0x${string}`, tx: action.tx},
							};
						}
					}
				}
			}
		}

		for (const cellPos of Object.keys(viewState.cells)) {
			const pos = IDToXY(cellPos);
			const position = xyToBigIntID(pos.x, pos.y);
			const contractCell = state.cells[position.toString()];
			const {updatedCell: cellNext} = bomberWomanUnchanged.getUpdatedCell(position, epochState.epoch);
			if (
				contractCell &&
				(contractCell.distribution >> 4 > 0 || (cellNext.life == 0 && cellNext.life < contractCell.life))
			) {
				const distribution =
					contractCell.distribution || (contractCell.enemyMap << 4) + countBits(contractCell.enemyMap);
				const map = distribution >> 4;
				const num = distribution & 0x0f;
				if (num > 0) {
					if ((map & 1) == 1) {
						const northPos = xyToBigIntID(pos.x, pos.y - 1);
						const neighbor = state.cells[northPos.toString()];
						const owner = state.owners[northPos.toString()]?.toLowerCase();
						if (owner === addr && neighbor && neighbor.color !== contractCell.color) {
							viewState.tokensToCollect.push({
								amount: parseUnits('1', decimals) / BigInt(num),
								position: northPos,
								from: position,
								color: contractCell.color,
							});
						}
					}

					if ((map & 2) == 2) {
						const westPos = xyToBigIntID(pos.x - 1, pos.y);
						const neighbor = state.cells[westPos.toString()];
						const owner = state.owners[westPos.toString()]?.toLowerCase();
						if (owner === addr && neighbor && neighbor.color !== contractCell.color) {
							viewState.tokensToCollect.push({
								amount: parseUnits('1', decimals) / BigInt(num),
								position: westPos,
								from: position,
								color: contractCell.color,
							});
						}
					}

					if ((map & 4) == 4) {
						const southPos = xyToBigIntID(pos.x, pos.y + 1);
						const neighbor = state.cells[southPos.toString()];
						const owner = state.owners[southPos.toString()]?.toLowerCase();
						if (owner === addr && neighbor && neighbor.color !== contractCell.color) {
							viewState.tokensToCollect.push({
								amount: parseUnits('1', decimals) / BigInt(num),
								position: southPos,
								from: position,
								color: contractCell.color,
							});
						}
					}
					if ((map & 8) == 8) {
						const eastPos = xyToBigIntID(pos.x + 1, pos.y);
						const neighbor = state.cells[eastPos.toString()];
						const owner = state.owners[eastPos.toString()]?.toLowerCase();
						if (owner === addr && neighbor && neighbor.color !== contractCell.color) {
							viewState.tokensToCollect.push({
								amount: parseUnits('1', decimals) / BigInt(num),
								position: eastPos,
								from: position,
								color: contractCell.color,
							});
						}
					}
				}
			}
		}
	}

	return viewState;
}

export const bomberWomanView = derived(
	[state, accountData.offchainState, accountData.onchainActions, epochState, account],
	([$state, $offchainState, $onchainActions, $epochState, $account]) => {
		return merge($state, $offchainState, $onchainActions, $epochState, $account);
	},
);

export type BomberWomanView = Omit<typeof bomberWomanView, '$state'>;

if (typeof window !== 'undefined') {
	(window as any).bomberWomanView = bomberWomanView;
}
