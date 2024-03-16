import {CellXYPosition, BomberWomanState, ContractAction, ActionType} from './types';

export function bigIntIDToXYID(position: bigint): string {
	const {x, y} = bigIntIDToXY(position);
	return '' + x + ',' + y;
}

// using 64 bits room id
// const leftMostBit = BigInt('0x8000000000000000');
// const bn32 = BigInt('0x10000000000000000');
export function bigIntIDToXY(position: bigint): CellXYPosition {
	const bn = BigInt(position);
	const x = Number(BigInt.asIntN(32, bn));
	const y = Number(BigInt.asIntN(32, bn >> 32n));
	// const rx = x >= leftMostBit ? -(bn32 - x) : x;
	// const ry = y >= leftMostBit ? -(bn32 - y) : y;
	return {x, y};
}

export type CellBigIntXYPosition = {
	x: bigint;
	y: bigint;
};

export function bigIntIDToBigintXY(position: bigint): CellBigIntXYPosition {
	const bn = BigInt(position);
	const x = BigInt.asIntN(32, bn);
	const y = BigInt.asIntN(32, bn >> 32n);
	return {x, y};
}

export function xyToXYID(x: number, y: number) {
	return '' + x + ',' + y;
}

export function IDToXY(id: string) {
	const [x, y] = id.split(',').map(Number);
	return {x, y};
}

export function xyToBigIntID(x: number, y: number): bigint {
	// const bn = (BigInt.asUintN(32, BigInt(x)) + BigInt.asUintN(32, BigInt(y))) << 32n;
	const bn = (x < 0 ? 2n ** 32n + BigInt(x) : BigInt(x)) + ((y < 0 ? 2n ** 32n + BigInt(y) : BigInt(y)) << 32n);
	return bn;
}

export class BomberWomanContract {
	constructor(
		private state: BomberWomanState,
		public COMMIT_PHASE_DURATION: bigint = 2n,
		public REVEAL_PHASE_DURATION: bigint = 2n,
		public START_TIME: bigint = 2n,
	) {}

	_resolveActions(avatarID: bigint, epoch: bigint, actions: readonly ContractAction[]) {
		const avatar = this._getAvatar(avatarID);
		let position = avatar.position;
		for (let i = 0; i < actions.length; i++) {
			const path = actions[i].path;
			for (let j = 0; j < path.length; j++) {
				const next = path[j];
				if (this._isValidMove(position, next)) {
					position = next;
				}
				if (
					actions[i].actionType == ActionType.Bomb &&
					!this.state.cells[position.toString()][epoch.toString()].exploded
				) {
					this.state.cells[position.toString()][epoch.toString()].exploded = true;
				}
			}
		}
	}

	_isValidMove(from: bigint, to: bigint) {
		// TODO
		return true;
	}

	_epoch() {
		const epochDuration = this.COMMIT_PHASE_DURATION + this.REVEAL_PHASE_DURATION;
		const time = this._timestamp();
		if (time < this.START_TIME) {
			throw new Error(`GameNotStarted()`);
		}
		const timePassed = time - this.START_TIME;
		const epoch = timePassed / epochDuration + 2n;
		const commiting = timePassed - (epoch - 2n) * epochDuration < this.COMMIT_PHASE_DURATION;
		return {
			epoch,
			commiting,
		};
	}

	_getResolvedAvatar(avatarID: bigint) {
		const avatar = this.state.avatars[avatarID.toString()];
		let dead = false;
		if (this.state.cells[avatar.position.toString()][avatar.epoch.toString()].exploded) {
			dead = true;
		}
		return {
			stake: avatar.stake,
			position: avatar.position,
			epoch: avatar.epoch,
			bombs: avatar.bombs,
			dead: dead,
		};
	}

	_getAvatar(avatarID: bigint) {
		return this.state.avatars[avatarID.toString()];
	}

	_timestamp() {
		return 0n;
	}
}
