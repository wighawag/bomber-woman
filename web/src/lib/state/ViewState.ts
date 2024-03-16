import {
	xyToXYID,
	bigIntIDToXY,
	BomberWomanContract,
	type BomberWomanState,
	xyToBigIntID,
	IDToXY,
} from 'bomber-woman-common';
import {derived} from 'svelte/store';
import {state} from '$lib/state/State';
import {account, accountData} from '$lib/blockchain/connection';
import {epochState, type EpochState} from '$lib/state/Epoch';
import type {AccountState} from 'web3-connection';
import {type CommitMetadata, type OffchainState, type BomberWomanMetadata} from '$lib/account/account-data';
import type {OnChainAction, OnChainActions} from '$lib/account/base';
import {createDraft} from 'immer';

export type BomberWomanViewState = BomberWomanState;

function merge(
	state: BomberWomanState,
	offchainState: OffchainState,
	onchainActions: OnChainActions<BomberWomanMetadata>,
	epochState: EpochState,
	account: AccountState<`0x${string}`>,
): BomberWomanViewState {
	const bomberWomanUnchanged = new BomberWomanContract(state);
	const rawState = state;
	const copyState = createDraft(state);
	// TODO use finishDraft ?

	const hasSomeCells = Object.keys(copyState.cells).length > 0;

	const bomberWoman = new BomberWomanContract(copyState);

	// console.log({epoch: epochState.epoch, isActionPhase: epochState.isActionPhase});

	let hasCommitment = false;
	if (
		offchainState.plan !== undefined &&
		offchainState.plan.epoch === epochState.epoch &&
		epochState.isActionPhase &&
		offchainState.plan.move
	) {
		for (const action of offchainState.plan.move.actions) {
			// TODO bomberWoman._resolveActions(avatarID, epochState.epoch, localMoveToContractMove(offchainState.plan.move));
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

		// if (lastCommitment) {
		// 	hasCommitment = true;
		// 	const metadata = lastCommitment.tx.metadata;
		// 	if (!metadata) {
		// 		// TODO fix type
		// 		console.error(`no metadata, cannot reach here`);
		// 	} else {
		// 		for (const move of metadata.localMoves) {
		// 			bomberWoman.computeMove(account.address as `0x${string}`, epochState.epoch, localMoveToContractMove(move));
		// 		}
		// 	}
		// }
	}

	const viewState: BomberWomanViewState = state;
	// for (const cellID of Object.keys(copyState.cells)) {
	// 	const {x, y} = bigIntIDToXY(BigInt(cellID));
	// 	const cell = copyState.cells[cellID];
	// 	const {updatedCell: next} = bomberWoman.getUpdatedCell(BigInt(cellID), epochState.epoch + 0);
	// 	const {updatedCell: future} = bomberWoman.getUpdatedCell(BigInt(cellID), epochState.epoch + 1);
	// 	// console.log({
	// 	// 	x,
	// 	// 	y,
	// 	// 	cell,
	// 	// 	updatedCell,
	// 	// 	epoch,
	// 	// });
	// 	const viewCell = {
	// 		next,
	// 		future,
	// 		currentPlayer: copyState.owners[cellID]?.toLowerCase() === account.address?.toLowerCase(),
	// 	};
	// 	viewState.viewCells[xyToXYID(x, y)] = viewCell;
	// 	viewState.cells[xyToXYID(x, y)] = copyState.cells[cellID];
	// 	// console.log(`${x}, ${y}`, viewCell);
	// }
	// for (const pos of Object.keys(copyState.owners)) {
	// 	const {x, y} = bigIntIDToXY(BigInt(pos));
	// 	viewState.owners[xyToXYID(x, y)] = copyState.owners[pos];
	// }

	// if (account.address) {
	// 	const addr = account.address.toLowerCase();
	// 	const commitment = state.commitments[account.address.toLowerCase()];
	// 	if (commitment && (!epochState.isActionPhase || commitment.epoch < epochState.epoch)) {
	// 		viewState.hasCommitmentToReveal = {epoch: commitment.epoch};
	// 		for (const txHash of Object.keys(onchainActions)) {
	// 			const action = onchainActions[txHash as `0x${string}`];
	// 			if (action.tx.metadata) {
	// 				const metadata = action.tx.metadata;
	// 				if (metadata.type === 'commit') {
	// 					if (metadata.epoch == commitment.epoch) {
	// 						viewState.hasCommitmentToReveal = {
	// 							epoch: commitment.epoch,
	// 							commit: {hash: txHash as `0x${string}`, tx: action.tx},
	// 						};
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }

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
