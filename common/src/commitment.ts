import {encodeAbiParameters, keccak256} from 'viem';
import type {ContractAction, ContractAvatarMove} from './types';
import * as crypto from 'crypto';

export type Commitment = ContractAvatarMove;

export function randomSecret() {
	return (`0x` +
		[...crypto.getRandomValues(new Uint8Array(32))]
			.map((m) => ('0' + m.toString(16)).slice(-2))
			.join('')) as `0x${string}`;
}

// TODO support furtherMoves
export function prepareCommitment(avatarID: bigint, actions: ContractAction[], secret: `0x${string}`) {
	const commitmentHash = keccak256(
		encodeAbiParameters(
			[
				{type: 'bytes32', name: 'secret'},
				{type: 'uint256', name: 'avatarID'},
				{
					type: 'tuple[]',
					name: 'actions',
					components: [
						{
							name: 'path',
							type: 'uint64[]',
						},
						{
							name: 'actionType',
							type: 'uint8',
						},
					],
				},
			],
			[secret, avatarID, actions],
		),
	).slice(0, 50) as `0x${string}`;

	return {secret, hash: commitmentHash, actions};
}
