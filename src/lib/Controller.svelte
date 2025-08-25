<script lang="ts">
	import clock from "$lib/assets/clock.svg";
	import star from "$lib/assets/star.svg";

	import Bulb from "~icons/hugeicons/bulb";
	import Tick from "~icons/hugeicons/sent";
	import ColorDials from "./ColorDials.svelte";
	import Wave from "./Wave.svelte";
	import Game, { type Color } from "./game.svelte";
	import NumberFlow from "@number-flow/svelte";
	import { makeToast } from "./toasts/state.svelte";

	interface Props {
		game: Game;
	}

	const { game }: Props = $props();

	let mix = $state(false);

	let debug = $state(false);

	const winning = $derived(game.closest === game.player_closeness);

	let headerColor: Color = $state([128, 128, 128]);
	let color: Color = $state([128, 128, 128]);

	const c = $derived(
		`hsl(${(260 + game.player_closeness * 1.5) % 360}deg 100% 70%)`,
	);

	function check() {
		game.guessColor(color);
	}

	function onRoundFinished(winner: string, score: number) {
		makeToast({
			message: winner,
			type: "won",
		});
	}

	$effect(() => {
		const onSpace = (e: KeyboardEvent) => {
			if (e.code == "Space") {
				e.preventDefault();
				mix = !mix;
			}
		};
		document.addEventListener("keypress", onSpace);

		game.on("roundFinished", onRoundFinished);

		return () => {
			document.removeEventListener("keypress", onSpace);
			game.off("roundFinished", onRoundFinished);
		};
	});
</script>

<!-- <audio bind:this={audio} src={bingbong}></audio> -->

<svelte:document
	onkeypress={(e) => {
		e.code == "Backquote" && (debug = !debug);
	}}
/>

<main class="grid grid-rows-[auto_1fr_auto] bg-black h-full overflow-clip">
	<header style="--c: {c}; --t: white" class="z-10 w-full pb-2 text-black">
		<div
			class="bg-linear-to-b/oklab from-(--t) to-(--c) p-2 pb-0 flex flex-col justify-between"
		>
			<div
				class="p-2 shrink-0 text-black grid grid-cols-2 font-mono font-bold text-4xl"
			>
				<div class="flex gap-2 items-center">
					<img
						src={star}
						alt="puntos:"
						class="h-12 drop-shadow-pink-400 drop-shadow-md"
					/>
					<span>
						<NumberFlow
							format={{
								useGrouping: false,
							}}
							value={game.score}
						/><span class="text-base font-extrabold">pts.</span>
					</span>
				</div>
				<div class="flex gap-2 items-center">
					<img
						src={clock}
						alt="puntos:"
						class="h-12 drop-shadow-yellow-300 drop-shadow-md"
					/>
					<span>
						{game.round_time}<span class="text-base font-extrabold"
							>s</span
						>
					</span>
				</div>
			</div>
			<div class="flex flex-col items-end text-right gap-2 p-2">
				<div class="text-lg">
					{#if winning}
						¡estás ganando!
					{:else}
						{game.closest_name} está más cerca
					{/if}
				</div>
				<div
					class={{
						"text-3xl/8 font-bold": true,
						"animate-bounce": game.player_closeness > 60,
					}}
				>
					{game.player_closeness > 80 ? "¡¡GANASTE!!"
					: game.player_closeness > 70 ? "¡¡QUEMANDO!!"
					: game.player_closeness > 60 ? "¡Caliente!"
					: game.player_closeness > 50 ? "Tibio..."
					: game.player_closeness > 20 ? "Frío"
					: "Muy frio, helado."}
				</div>
			</div>
		</div>
		<Wave f={game.player_closeness / 100} />
	</header>

	<div class="h-full grid items-center p-2">
		<ColorDials bind:color expand={mix} />
	</div>

	<header class="z-10 flex gap-2 text-4xl items-center p-2">
		<!-- <button onclick={reset} class="restart-button">
			<Refresh />
		</button> -->
		<!-- <div class="grow"></div> -->
		<button
			onclick={() => (mix = !mix)}
			data-mix={mix || undefined}
			class="grow flex items-center justify-center h-auto py-4 rounded-3xl bg-amber-950 data-mix:bg-amber-200 data-mix:text-black"
		>
			<Bulb />
		</button>
		<button
			onclick={check}
			class="grow flex items-center justify-center h-auto py-4 rounded-3xl bg-teal-400 text-black"
		>
			<Tick />
		</button>
	</header>
</main>
{#if debug}
	<div class="fixed bottom-0 w-full bg-[#feea] flex flex-col z-50">
		<label>
			<span>dist. propia</span>
			<input
				type="range"
				min="0"
				max="100"
				bind:value={game.player_closeness}
			/>
		</label>
		<label>
			<span>dist. más próxima</span>
			<input type="range" min="0" max="100" bind:value={game.closest} />
		</label>
		<label>
			<span>jugador más próximo</span>
			<select bind:value={game.closest_client}>
				{#each game.known_names.entries() as [id, name]}
					<option value={id}>{name}</option>
				{/each}
			</select>
		</label>
	</div>
{/if}

<style lang="scss">
	.light-toggle {
		--bg: hsl(50, 90%, 15%);
		--border: hsl(50, 90%, 5%);
		--text: white;

		&[data-mix="true"] {
			--bg: hsl(50, 90%, 95%);
			--border: hsl(50, 90%, 80%);
			--text: black;
		}
	}

	.check-button {
		--bg: hsl(147, 100%, 50%);
		--border: hsl(165, 100%, 35%);
		--text: black;
	}
</style>
