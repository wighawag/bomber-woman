import {Deployment, loadEnvironment} from 'rocketh';
import {context} from '../deploy/_context';
import hre from 'hardhat';
import {fetchContract} from '../utils/connection';

async function main() {
	const env = await loadEnvironment(
		{
			provider: hre.network.provider,
			network: hre.network.name,
		},
		context,
	);

	const args = process.argv.slice(2);
	const account = (args[0] || process.env.ACCOUNT) as `0x${string}`;
	const BomberWoman = env.deployments.BomberWoman as Deployment<typeof context.artifacts.IBomberWomanDebug.abi>;
	const BomberWomanContract = await fetchContract(BomberWoman);
	const timestamp = await BomberWomanContract.read.timestamp();

	console.log({account, timeContract: BomberWomanContract.address, timestamp: timestamp.toString()});
}
main();
