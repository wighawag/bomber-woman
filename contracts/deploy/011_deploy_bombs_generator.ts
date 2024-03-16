import {execute} from 'rocketh';
import 'rocketh-deploy';
import 'rocketh-deploy-proxy';
import {context} from './_context';
import {zeroAddress} from 'viem';

export default execute(
	context,
	async ({deployViaProxy, accounts, artifacts, get, getOrNull, execute, showMessage}) => {
		const {deployer, tokensBeneficiary} = accounts;

		const Bombs = await get<typeof artifacts.Bombs.abi>('Bombs');
		const BombsGenerator = await getOrNull<typeof artifacts.RewardsGenerator.abi>('BombsGenerator');
		if (BombsGenerator) {
			// we call `update` to ensure the distribution so far is using the previous rate
			// This  and the upgrade can be done during the commit phase without running the risk
			//   of using wrong values as no changes in points are possible during that phase
			showMessage(`updating distribution before upgrade`);
			await execute(BombsGenerator, {
				functionName: 'update',
				account: deployer,
			});
		}

		await deployViaProxy(
			'BombsGenerator',
			{
				account: deployer,
				artifact: artifacts.RewardsGenerator,
				args: [
					zeroAddress, // Bombs.address,
					{
						rewardRateMillionth: 0n, // TODO 100n, // 100 for every million of second. or 8.64 / day
						// in play test we add reward midway
						fixedRewardRateThousandsMillionth: 10n, // 10 for every  thousand million of seconds, or 0.000864 per day per stake or 315.36 / year / 1000 stake
					},
					[],
				],
			},
			{
				owner: accounts.deployer,
				execute: 'postUpgrade',
			},
		);
	},
	{tags: ['BombsGenerator', 'BombsGenerator_deploy'], dependencies: ['Bombs_deploy']},
);
