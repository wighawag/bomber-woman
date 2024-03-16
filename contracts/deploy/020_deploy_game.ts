import {Deployment, execute} from 'rocketh';
import 'rocketh-deploy-proxy';
import 'rocketh-deploy-router';
import 'rocketh-deploy';
import {context} from './_context';
import {days, hours, minutes} from '../utils/time';
import {checksumAddress, parseEther, zeroAddress} from 'viem';
import {getConfig} from './.config';

export type GameConfig = {
	tokens: `0x${string}`;
	numTokensPerGems: bigint;
	burnAddress: `0x${string}`;
	startTime: number;
	commitPhaseDuration: bigint;
	revealPhaseDuration: bigint;
	maxLife: number;
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

		if (configOverride?.tokens == zeroAddress) {
			// TODO per network
			decimals = 18;
			symbol = 'ETH';
			name = 'Ethers';
		}

		const numTokensPerGems = BigInt(10) ** BigInt(decimals);

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
			tokens: testTokens.address,
			numTokensPerGems,
			burnAddress: checksumAddress(`0xDEADDEADDEADDEADDEADDEADDEADDEADDEADDEAD`), //zeroAddress,

			startTime,
			revealPhaseDuration,
			commitPhaseDuration,
			maxLife: 7, // 7 is a good number, because with 4 enemy neighbors, it take 2 turns to die, with 3 it takes 3, with 2 it takes 4, with 1 it takes 7
			time,
			...configOverride,
			generator: generator.address,
		};

		const routes = [
			{name: 'Getters', artifact: artifacts.BomberWomanGetters, args: [config], account: deployer},
			{name: 'Commit', artifact: artifacts.BomberWomanCommit, args: [config], account: deployer},
			{name: 'Reveal', artifact: artifacts.BomberWomanReveal, args: [config], account: deployer},
			{name: 'Poke', artifact: artifacts.BomberWomanPoke, args: [config], account: deployer},
			{name: 'ERC721', artifact: artifacts.BomberWomanERC721 as any, args: [config], account: deployer},
		];
		if (network.name === 'hardhat' || network.name === 'memory') {
			routes.push({name: 'Debug', artifact: artifacts.BomberWomanDebug as any, args: [config], account: deployer});
		}

		const bomberWoman = await deployViaProxy<typeof artifacts.IBomberWoman.abi>(
			'BomberWoman',
			{
				account: deployer,
				artifact: (name, args) => {
					return deployViaRouter(
						name,
						{
							...(args as any),
						},
						routes,
						[artifacts.UsingBomberWomanDebugEvents.abi],
					) as Promise<Deployment<typeof artifacts.IBomberWoman.abi>>;
				},
				args: [config],
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
			args: [bomberWoman.address],
		});

		if (weight != desiredWeight) {
			await env.execute(generator, {
				account: deployer,
				functionName: 'enableGame',
				args: [bomberWoman.address, desiredWeight],
			});
		}

		const globalApproval = await env.read(testTokens, {
			functionName: 'globalApprovals',
			args: [bomberWoman.address],
		});

		if (!globalApproval) {
			await env.execute(testTokens, {
				account: deployer,
				functionName: 'authorizeGlobalApprovals',
				args: [[bomberWoman.address], true],
			});
		}

		const addressesToAuthorize = Object.values(env.accounts).concat([bomberWoman.address]);
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
