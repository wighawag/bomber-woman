import {erc20, runtests} from 'ethereum-contracts-test-suite';
import {deployBomberWomanWithTestConfig} from './utils/bomber-woman-test';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {describe, it} from 'vitest';

type Fixture = {
	ethereum: any; // TODO
	contractAddress: string;
	users: string[];
	userWithToken: string;
};

async function setupBombs(): Promise<Fixture> {
	const setup = await loadFixture(deployBomberWomanWithTestConfig);
	return {
		ethereum: setup.provider,
		contractAddress: setup.Bombs.address,
		users: setup.otherAccounts,
		userWithToken: setup.tokensBeneficiary,
	};
}

const tests = erc20.generateTests({EIP717: true}, setupBombs);

describe('Bombs as ERC20', function () {
	runtests(tests, {describe, it});
});
