import type {MergedAbis, JSProcessor, EventWithArgs} from 'ethereum-indexer-js-processor';
import {fromJSProcessor} from 'ethereum-indexer-js-processor';
import contractsInfo from './contracts';
import {BomberWomanContract, BomberWomanState} from 'bomber-woman-common';

type ContractsABI = MergedAbis<typeof contractsInfo.contracts>;

const BomberWomanIndexerProcessor: JSProcessor<ContractsABI, BomberWomanState> = {
	// version is automatically populated via version.cjs to let the browser knows to reindex on changes
	version: '__VERSION_HASH__',
	construct(): BomberWomanState {
		return {
			cells: {},
			avatars: {},
		};
	},
	onCommitmentRevealed(state, event) {
		const bomberWomanContract = new BomberWomanContract(state);
		bomberWomanContract._resolveActions(event.args.avatarID, event.args.epoch, event.args.actions as any); // TODO why any
	},
};

export const createProcessor = fromJSProcessor(() => BomberWomanIndexerProcessor);
