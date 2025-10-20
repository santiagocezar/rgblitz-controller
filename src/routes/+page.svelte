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
<!-- TODO: nombre tipo arcade -->
	<form
		action="#"
		onsubmit={login}
		class="flex flex-col items-center justify-center h-full gap-2"
	>
		<label for="name" class="text-lg">Tu nombre:</label>
		<input
			id="name"
			class="w- text-8xl font-mono uppercase border-b-2 border-white p-4"
			type="text"
			size="3"
			maxlength="3"
			bind:value={loginName}
		/>
		<button class="button">Entrar</button>
		<ul>
			{#each game.known_names.values() as name}
				<li>{name}</li>
			{/each}
		</ul>
	</form>
{/if}
