import {Deployment, execute} from 'rocketh';
import 'rocketh-deploy-proxy';
import 'rocketh-deploy-router';
import 'rocketh-deploy';
import {context} from './_context';
import {days, hours, minutes} from '../utils/time';
import {checksumAddress, parseEther, zeroAddress} from 'viem';
import {getConfig} from './.config';

export type GameConfig = {
	startTime: number;
	commitPhaseDuration: bigint;
	revealPhaseDuration: bigint;
};

export default execute(
	context,
	async (env, configOverride?: Partial<GameConfig>) => {
		const {deployViaProxy, deployments, accounts, artifacts, network, deployViaRouter, get} = env;
		const {deployer} = accounts;
		const deployConfig = getConfig(env);

		const startTime = 0; // BigInt(Math.floor(Date.now() / 1000)); // startTime: nextSunday(),

		const generator = get<typeof artifacts.RewardsGenerator.abi>('GemsGenerator');
		const testTokens = get<typeof artifacts.TestTokens.abi>('TestTokens');

		let decimals = await env.read(testTokens, {functionName: 'decimals'});
		let symbol = await env.read(testTokens, {functionName: 'symbol'});
		let name = await env.read(testTokens, {functionName: 'name'});

		const admin = accounts.deployer;

		let time: `0x${string}` = zeroAddress;
		const timeContract = await deployments['Time'];
		if (timeContract && deployConfig.useTimeContract) {
			time = timeContract.address;
		}

		// TODO support more complex period to support a special weekend commit period ?
		let revealPhaseDuration = BigInt(hours(1));
		let commitPhaseDuration = BigInt(days(1)) - revealPhaseDuration;

		if (network.name === 'fast') {
			revealPhaseDuration = BigInt(minutes(3));
			commitPhaseDuration = BigInt(minutes(8)) - revealPhaseDuration;
		}

		const config = {
			startTime,
			revealPhaseDuration,
			commitPhaseDuration,
			time,
			...configOverride,
		};

		const args = [config];

		const routes = [
			{name: 'Getters', artifact: artifacts.BomberWomanGetters, args, account: deployer},
			{name: 'Commit', artifact: artifacts.BomberWomanCommit, args, account: deployer},
			{name: 'Reveal', artifact: artifacts.BomberWomanReveal, args, account: deployer},
		];
		if (network.name === 'hardhat' || network.name === 'memory') {
			routes.push({name: 'Debug', artifact: artifacts.BomberWomanDebug as any, args, account: deployer});
		}

		const BomberWoman = await deployViaProxy<typeof artifacts.IBomberWoman.abi>(
			'BomberWoman',
			{
				account: deployer,
				artifact: (name, params) => {
					return deployViaRouter(name, {...(params as any)}, routes, [
						artifacts.UsingBomberWomanDebugEvents.abi,
					]) as unknown as Promise<Deployment<typeof artifacts.IBomberWoman.abi>>;
				},
				args,
			},
			{
				owner: admin,
				linkedData: {
					...config,
					currency: {
						symbol,
						name,
						decimals,
					},
					admin,
				},
			},
		);

		const desiredWeight = parseEther('1');
		const weight = await env.read(generator, {
			functionName: 'games',
			args: [BomberWoman.address],
		});

		if (weight != desiredWeight) {
			await env.execute(generator, {
				account: deployer,
				functionName: 'enableGame',
				args: [BomberWoman.address, desiredWeight],
			});
		}

		const globalApproval = await env.read(testTokens, {
			functionName: 'globalApprovals',
			args: [BomberWoman.address],
		});

		if (!globalApproval) {
			await env.execute(testTokens, {
				account: deployer,
				functionName: 'authorizeGlobalApprovals',
				args: [[BomberWoman.address], true],
			});
		}

		const addressesToAuthorize = Object.values(env.accounts).concat([BomberWoman.address]);
		const anyNotAuthorized = await env.read(testTokens, {
			functionName: 'anyNotAuthorized',
			args: [addressesToAuthorize],
		});
		if (anyNotAuthorized) {
			await env.execute(testTokens, {
				account: deployer,
				functionName: 'enableRequireAuthorization',
				args: [addressesToAuthorize],
			});
		}
	},
	{
		tags: ['BomberWoman', 'BomberWoman_deploy'],
		dependencies: ['TestTokens_deploy', 'Gems_deploy'],
	},
);
