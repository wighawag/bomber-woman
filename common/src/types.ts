export enum ActionType {
	None = 0,
	Bomb = 1,
}

export type ContractAction = {
	readonly path: bigint[];
	readonly actionType: number;
};

/// @notice Move struct that define position and actions for one avatar
export type ContractAvatarMove = {
	readonly avatarID: bigint;
	readonly actions: ContractAction[];
	readonly secret: `0x${string}`;
};

export type ContractAvatarResolved = {
	readonly stake: bigint;
	readonly position: bigint;
	readonly epoch: bigint;
	readonly bombs: number;
	readonly dead: boolean;
};

export type ContractCellAtEpoch = {
	exploded: boolean;
};

export type ContractAvatar = {
	stake: bigint;
	position: bigint;
	epoch: bigint;
	bombs: number;
};

export type BomberWomanState = {
	avatars: {[avatarID: string]: ContractAvatar};
	cells: {[position: string]: {[epoch: string]: ContractCellAtEpoch}};
};

export type CellXYPosition = {
	x: number;
	y: number;
};
