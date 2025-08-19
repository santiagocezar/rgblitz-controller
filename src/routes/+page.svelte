<script lang="ts">
	import Controller from "$lib/Controller.svelte";
	import Game from "$lib/game.svelte";
	import Toasts from "$lib/toasts/Toasts.svelte";

	const game = new Game();

	let loginName = $state("");

	$effect(() => {
		game.init();

		return () => game.deinit();
	});

	function login() {
		game.login(loginName);
	}
</script>

<Toasts />
{#if game.player_name}
	<Controller {game} />
{:else}
	<form action="#" onsubmit={login}>
		<input type="text" bind:value={loginName} />
		<button class="button">Subir</button>
		<ul>
			{#each game.known_names.values() as name}
				<li>{name}</li>
			{/each}
		</ul>
	</form>
{/if}
