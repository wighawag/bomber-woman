import {expect, describe, it} from 'vitest';
import 'rocketh-deploy';
import {Deployment, loadAndExecuteDeployments} from 'rocketh';
import {zeroHash} from 'viem';

import artifacts from '../generated/artifacts';
import {network} from 'hardhat';

describe('BombermanArena', function () {
	describe('Deployment', function () {
		it('Should be already deployed', async function () {
			const env = await loadAndExecuteDeployments({
				provider: network.provider as any,
			});
			const BombermanArena = env.deployments['BombermanArena'] as Deployment<typeof artifacts.BombermanArena.abi>;
			const commitment = await env.read(BombermanArena, {
				functionName: 'commitments',
				args: [env.accounts.deployer],
			});
			expect(commitment.h).to.equal(zeroHash);
		});
	});
});
