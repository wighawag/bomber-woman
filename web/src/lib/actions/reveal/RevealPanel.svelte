<script lang="ts">
	import type {CommitMetadata} from '$lib/account/account-data';
	import {epoch} from '$lib/state/Epoch';
	import {bomberWomanView} from '$lib/state/ViewState';
	import {contracts} from '$lib/blockchain/connection';
	import {startAcknowledgFailedReveal, startReveal} from './';
	import {initialContractsInfos} from '$lib/config';

	// const onchainActions = accountData.onchainActions;

	// $: toReveal = getTransactionToReveal($onchainActions);

	// $: first = toReveal.length > 0 ? toReveal[0] : undefined;

	async function startRevealing(e: MouseEvent) {
		e.preventDefault();
		if (!$bomberWomanView.hasCommitmentToReveal) {
			throw new Error(`no action to reveal`);
		}
		if ($bomberWomanView.hasCommitmentToReveal.commit) {
			if ($bomberWomanView.hasCommitmentToReveal.commit.tx.metadata?.epoch !== $epoch) {
				console.log({
					commitment: $bomberWomanView.hasCommitmentToReveal.commit.tx.metadata?.epoch,
					current: $epoch,
				});
				startAcknowledgFailedReveal(
					$bomberWomanView.hasCommitmentToReveal.commit.hash,
					$bomberWomanView.hasCommitmentToReveal.commit.tx.metadata as CommitMetadata,
				);
			} else {
				startReveal(
					$bomberWomanView.hasCommitmentToReveal.commit.hash,
					$bomberWomanView.hasCommitmentToReveal.commit.tx.metadata as CommitMetadata,
				);
			}
		} else {
			// TODO use flow
			await contracts.execute(async ({client, network: {contracts}, account}) => {
				const {BomberWoman} = contracts;
				console.log(account);
				await client.wallet.writeContract({
					...BomberWoman,
					functionName: 'acknowledgeMissedRevealByBurningAllReserve',
					account: account.address,
				});
			});
		}
	}

	$: commitmentToReveal =
		$bomberWomanView.hasCommitmentToReveal?.commit?.tx.metadata?.type === 'commit'
			? $bomberWomanView.hasCommitmentToReveal.commit.tx.metadata
			: undefined;

	$: expired = commitmentToReveal ? commitmentToReveal.epoch < $epoch : undefined;

	const symbol = initialContractsInfos.contracts.BomberWoman.linkedData.currency.symbol;
</script>

<div class="panel">
	{#if expired}
		<h2 class="title">Your Move have not been resolved.</h2>
		<p class="description">
			{#if $bomberWomanView.hasCommitmentToReveal?.commit}
				You lost {commitmentToReveal?.localMoves.length}
				{symbol}
			{/if}
		</p>
	{:else}
		<h2 class="title">Your Move Need to be Revealed</h2>
		<p class="description">
			{#if $bomberWomanView.hasCommitmentToReveal?.commit}
				{commitmentToReveal?.localMoves.length}
				{symbol} at stake
			{:else}
				no commit tx found
			{/if}
		</p>
	{/if}

	<div class="actions">
		<button class={`pointer-events-auto btn btn-primary`} on:click={startRevealing}
			>{#if expired}Acknowledge{:else}Reveal{/if}</button
		>
	</div>
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		background-color: var(--color-surface-500);
		border: 16px solid var(--color-text-on-surface);
		border-image: url(/game-assets/ui/border.png) 16 repeat;
		image-rendering: pixelated;
	}
	.actions {
		display: flex;
		justify-content: space-between;
	}
</style>
