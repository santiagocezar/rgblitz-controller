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
	import Loading from "./Loading.svelte";
	import Triangles from "./Triangles.svelte";

	interface Props {
		game: Game;
	}

	const { game }: Props = $props();

	let mix = $state(false);

	let waiting: number | null = $state(null);

	let debug = $state(false);

	const winning = $derived(game.closest === game.player_closeness);

	let headerColor: Color = $state([128, 128, 128]);
	let color: Color = $state([128, 128, 128]);

	const c = $derived(
		`hsl(${(260 + game.player_closeness * 1.5) % 360}deg 100% 70%)`,
	);

	function check() {
		waiting = window.setTimeout(() => {
			waiting = null;
		}, 2000);
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
		game.on("guessResult", (client) => {
			if (client == game.player_id && waiting !== null) {
				clearTimeout(waiting);
				waiting = null;
			}
		});

		return () => {
			document.removeEventListener("keypress", onSpace);
			game.off("roundFinished", onRoundFinished);
		};
	});
	let f = $state(0);
</script>

<input type="range" min="0" max="1" step="any" bind:value={f} />
<!-- <audio bind:this={audio} src={bingbong}></audio> -->

<svelte:document
	onkeypress={(e) => {
		e.code == "Backquote" && (debug = !debug);
	}}
/>

<main
	class="grid grid-rows-[1fr_auto] md:grid-rows-1 md:grid-cols-[1fr_auto] bg-black h-full overflow-hidden"
>
	<header class="relative w-full h-full">
		<div class="absolute top-4 left-4 flex flex-col">
			<div class="flex gap-2 items-center font-mono font-bold text-4xl">
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
			<div class="flex gap-2 items-center font-mono font-bold text-4xl">
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
		<div class="absolute top-4 right-4 text-right z-10 text-white">
			<div
				class={{
					"text-3xl/8 font-bold": true,
					"animate-bounce": game.player_closeness > 60,
				}}
			>
				{game.player_closeness > game.difficulty ? "¡¡GANASTE!!"
				: game.player_closeness > 70 ? "¡¡QUEMANDO!!"
				: game.player_closeness > 60 ? "¡Caliente!"
				: game.player_closeness > 50 ? "Tibio..."
				: game.player_closeness > 20 ? "Frío"
				: "Muy frio, helado."}
			</div>
			<div class="text-lg">
				{#if winning}
					¡estás ganando!
				{:else}
					{game.closest_name} está más cerca
				{/if}
			</div>

			<!-- <Wave f={game.player_closeness / 100} /> -->
		</div>

		<div class="absolute inset-0 grid items-center p-2">
			<ColorDials bind:color expand={mix} />
		</div>
	</header>

	<header
		style="--c: white"
		class="flex flex-col md:flex-row md:w-40 overflow-hidden z-10"
	>
		<Triangles {f} />
		<!-- <button onclick={reset} class="restart-button">
			<Refresh />
		</button> -->
		<!-- <div class="grow"></div> -->
		<div
			class="bg-white md:grow shrink-0 flex flex-row md:flex-col md:justify-end gap-2 text-4xl p-2"
		>
			<button
				onclick={() => (mix = !mix)}
				data-mix={mix || undefined}
				class="max-md:grow flex items-center justify-center py-4 md:py-8 rounded-3xl bg-amber-950 data-mix:bg-amber-200 data-mix:text-black"
			>
				<Bulb />
			</button>
			<button
				onclick={check}
				class={{
					"max-md:grow flex items-center justify-center py-4 md:py-8 rounded-3xl bg-teal-400 text-black transition-opacity": true,
					"opacity-60": waiting,
				}}
				disabled={waiting !== null}
			>
				{#if waiting}
					<Loading class="h-[1.5em]" />
				{:else}
					<Tick />
				{/if}
			</button>
		</div>
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

<style>
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
