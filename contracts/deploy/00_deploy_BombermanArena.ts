import {execute} from 'rocketh';
import 'rocketh-deploy-proxy';
import {context} from './_context';

export default execute(
	context,
	async ({deployViaProxy, accounts, artifacts}) => {
		await deployViaProxy(
			'BombermanArena',
			{
				account: accounts.deployer,
				artifact: artifacts.BombermanArena,
			},
			{
				owner: accounts.deployer,
			},
		);
	},
	{tags: ['BombermanArena', 'BombermanArena_deploy']},
);
