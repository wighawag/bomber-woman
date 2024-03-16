import {deployBomberWomanWithTestConfig} from './utils/bomber-woman-test';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {describe, it} from 'vitest';
import {erc721, runtests} from 'ethereum-contracts-test-suite';
import {xyToBigIntID} from 'bomber-woman-common';

type Fixture = {
	ethereum: any; // TODO
	contractAddress: string;
	users: string[];
	deployer: string;
	mint(to: string): Promise<{hash: string; tokenId: string}>;
};

async function setupBomberWoman(): Promise<Fixture> {
	const setup = await loadFixture(deployBomberWomanWithTestConfig);

	let count = 0;
	async function mint(to: string) {
		const tokenID = xyToBigIntID(2, 3 + count);
		const hash = await setup.BomberWoman.write.forceSimpleCells(
			[
				[
					{
						position: tokenID,
						owner: to as `0x${string}`,
						color: 5,
						life: 2,
						stake: 1,
					},
				],
			],
			{account: setup.deployer},
		);
		return {hash, tokenId: tokenID.toString()};
	}
	return {
		ethereum: setup.provider,
		contractAddress: setup.BomberWoman.address,
		users: setup.otherAccounts,
		deployer: setup.deployer,
		mint,
	};
}

const tests = erc721.generateTests({skipBalanceTests: true}, setupBomberWoman);

describe.skip('BomberWoman as ERC721', function () {
	runtests(tests, {describe, it});
});
