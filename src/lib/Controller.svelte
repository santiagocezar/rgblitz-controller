<script lang="ts">
	import { SvelteWebSocket } from "$lib/util.svelte";
	import bingbong from "$lib/assets/bingbong.ogg";
	import Dial from "$lib/Dial.svelte";

	import Bulb from "~icons/hugeicons/bulb";
	import Tick from "~icons/hugeicons/sent";
	import Refresh from "~icons/hugeicons/refresh";
	import mqtt from "mqtt";
	import ColorDials from "./ColorDials.svelte";

	interface Props {
		puntos: number;
		name: string;
		closest: string | null;
		closestDistance: number;
		ownDistance: number;
		onColorSend: (c: Color) => void;
		onReset: () => void;
	}

	export type Color = [r: number, g: number, b: number];

	const {
		puntos,
		name,
		closest,
		closestDistance,
		ownDistance,
		onColorSend: sendColor,
		onReset: reset,
	}: Props = $props();

	let mix = $state(false);
	const winning = $derived(closestDistance === ownDistance);

	let color: Color = $state([128, 128, 128]);

	function check() {
		sendColor(color);
	}

	let audio: HTMLAudioElement;

	$effect(() => {
		const onSpace = (e: KeyboardEvent) => {
			if (e.code == "Space") {
				e.preventDefault();
				mix = !mix;
			}
		};
		document.addEventListener("keypress", onSpace);
		return () => {
			document.removeEventListener("keypress", onSpace);
		};
	});
</script>

<audio bind:this={audio} src={bingbong}></audio>
<!-- 
<svelte:document onkeypress={(e) => {
    e.code == "Backquote" && (debug = !debug)
}} /> -->

<main class="grid grid-rows-[auto_1fr_auto] bg-black h-full overflow-clip">
	<header
		class={{
			"z-10 w-full rounded-b-[100%_20%] h-40 flex flex-col items-center justify-evenly pb-2": true,
			"bg-green-950": !winning,
			"bg-green-400 text-black": winning,
		}}
	>
		<div class="text-lg">
			{#if winning}
				¡estás ganando!
			{:else}
				{closest} está más cerca
			{/if}
		</div>
		<div
			class={{
				"text-3xl font-bold": true,
				"animate-bounce": ownDistance > 60,
			}}
		>
			{ownDistance > 80 ? "¡¡GANASTE!!"
			: ownDistance > 70 ? "¡¡QUEMANDO!!"
			: ownDistance > 60 ? "¡Caliente!"
			: ownDistance > 50 ? "Tibio..."
			: ownDistance > 20 ? "Frío"
			: "Muy frio, helado."}
		</div>
		<div class="flex w-full px-4 justify-between">
			<p>
				<span class="text-4xl font-900">
					{puntos}
				</span>
				<span class="text-xl font-900"> puntos </span>
			</p>
			<p>
				<span class="text-xl font-900"> quedan </span>
				<span class="text-4xl font-900">
					{puntos}
				</span><span class="text-xl font-900">s</span>
			</p>
		</div>
	</header>

	<div class="h-full grid items-center p-2">
		<ColorDials bind:color expand={mix} />
	</div>

	<header class="z-10 flex gap-2 text-xl items-center p-2">
		<!-- <button onclick={reset} class="restart-button">
			<Refresh />
		</button> -->
		<!-- <div class="grow"></div> -->
		<button
			onclick={() => (mix = !mix)}
			data-mix={mix}
			class="grow light-toggle"
		>
			<Bulb />
		</button>
		<button onclick={check} class="grow check-button">
			<Tick />
		</button>
	</header>
	<!-- {#if debug}
        
        <div class="debug">
            {#snippet color(name: string, rgb: Color)}
                {@const hsl = rgbToHsl(...rgb)}
                <p>
                    <span class="ref" style="background-color: rgb({rgb});"></span>
                    {name}
                </p>
                <p>
                    <strong>RGB:</strong> {rgb.map(v => v.toFixed(2)).join(", ")}
                </p>
                <p>
                    <strong>H:</strong> {(hsl.h / Math.PI * 180).toFixed(2)}°
                    <strong>S:</strong> {(hsl.s * 100).toFixed(2)}%
                    <strong>L:</strong> {(hsl.l * 100).toFixed(2)}%
                </p>
            {/snippet}
            {@render color("Color 1", color1)}
            {@render color("Color 2", color2)}
            <br>
            <p>
                <strong>Parecido:</strong> {distanceRGB(color1, color2).toFixed(2)}%
            </p>
            <svg viewBox="-50 -50 100 100">
                <circle cx="0" cy="0" r="50" fill="#eee"></circle>
                <circle cx={pos1.x} cy={pos1.y} r="5" fill="red"></circle>
                <circle cx={pos2.x} cy={pos2.y} r="5" fill="blue"></circle>
            </svg>
        </div>
    {/if} -->
</main>

<style lang="scss">
	.score {
		color: white;
		font-size: 4em;
		line-height: 1;
		margin-top: -1rem;
		font-weight: 900;
		font-variant: tabular-nums;

		[data-light="true"] & {
			color: black;
		}
	}
	.debug {
		position: fixed;
		left: 0;
		bottom: 0;
		background-color: #0002;
		color: black;
		padding: 0.5rem;
		font-family: monospace;
		line-height: 1.2;
	}

	.refs {
		display: flex;
	}
	.ref {
		display: inline-block;
		vertical-align: middle;
		width: 1.2em;
		height: 1.2em;
	}
	.debug svg {
		display: block;
		width: 6rem;
		height: 6rem;
	}

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

	.restart-button {
		--bg: hsl(17, 100%, 50%);
		--border: hsl(355, 100%, 35%);
		--text: white;
	}
</style>
