<script lang="ts">
	import { Tween } from "svelte/motion";
	import { cubicInOut } from "svelte/easing";
	import type { Action } from "svelte/action";

	const HALF_GAP = 45;
	const HALF_GAP_RAD = (45 / 180) * Math.PI;

	interface Props {
		color: "r" | "g" | "b";
		value: number;
		expand?: boolean;
	}

	let { color, value = $bindable(0), expand }: Props = $props();

	const c = {
		r: "#f00",
		g: "#0f0",
		b: "#00f",
	};

	const i = {
		r: 0,
		g: 1,
		b: 2,
	};

	const trueColor = $derived.by(() => {
		const rgbParam = [0, 0, 0];
		rgbParam[i[color]] = value * 255;
		return `rgb(${rgbParam})`;
	});

	let angle = {
		get value() {
			return (value * 2 - 1) * (Math.PI - HALF_GAP_RAD);
		},
		set value(angle: number) {
			value =
				(Math.max(
					Math.min(angle, Math.PI - HALF_GAP_RAD),
					HALF_GAP_RAD - Math.PI,
				) /
					(Math.PI - HALF_GAP_RAD) +
					1) /
				2;
		},
	};

	function dialHandler(base: HTMLElement) {
		let originX = 0,
			originY = 0;
		let baseSize = 0;

		function mapClientPosition(clientX: number, clientY: number) {
			clientX = ((clientX - originX) / baseSize) * 2 - 1;
			clientY = ((clientY - originY) / baseSize) * 2 - 1;

			angle.value = Math.atan2(clientX, -clientY);
		}

		function stopMoving(ev: PointerEvent) {
			ev.preventDefault();
			removeDocumentListeners();
		}

		function startMoving(ev: PointerEvent) {
			ev.preventDefault();

			const rect = base.getBoundingClientRect();
			baseSize = rect.width;
			originX = rect.left;
			originY = rect.top;

			addDocumentListeners();
			mapClientPosition(ev.clientX, ev.clientY);
		}

		function keepMoving(ev: PointerEvent) {
			ev.preventDefault();
			mapClientPosition(ev.clientX, ev.clientY);
		}

		function addDocumentListeners() {
			document.addEventListener("pointermove", keepMoving);
			document.addEventListener("pointerup", stopMoving);
		}
		function removeDocumentListeners() {
			document.removeEventListener("pointermove", keepMoving);
			document.removeEventListener("pointerup", stopMoving);
		}

		base.addEventListener("pointerdown", startMoving);

		return () => {
			base.removeEventListener("pointerdown", startMoving);
			removeDocumentListeners();
		};
	}
</script>

<div
	class="aspect-square h-full grid"
	style="
        --c: {c[color]};
        --true: {trueColor};
        --half-gap: {HALF_GAP}deg;
        --phi: {angle.value - Math.PI / 2}rad;
    "
	{@attach dialHandler}
>
	<div
		class={{
			"w-full h-full fill bg-[var(--true)] rounded-full transition-transform z-2 mix-blend-screen pointer-events-none": true,
			"scale-230": expand,
		}}
	></div>
	<svg
		class={{
			"m-[5%] fill z-3 transition-transform": true,
			"scale-0": expand,
		}}
		viewBox="-50 -50 100 100"
	>
		<circle
			cx="0"
			cy="0"
			r="40"
			fill="none"
			class="slider-border"
			stroke="#fff"
			stroke-linecap="round"
			stroke-dasharray="{360 - HALF_GAP * 2} {HALF_GAP * 2}"
			pathLength="360"
			transform="rotate({90 + HALF_GAP})"
		/>
		<circle
			cx="0"
			cy="0"
			r="40"
			fill="none"
			class="slider-track"
			stroke="var(--c)"
			stroke-linecap="round"
			stroke-dasharray="{360 - HALF_GAP * 2} {HALF_GAP * 2}"
			pathLength="360"
			transform="rotate({90 + HALF_GAP})"
		/>
		<circle
			cx="0"
			cy="0"
			r="40"
			fill="none"
			class="slider-progress"
			stroke="var(--c)"
			stroke-linecap="round"
			stroke-dasharray="{(360 - HALF_GAP * 2) * value} {360 -
				(360 - HALF_GAP * 2) * value} {HALF_GAP * 2}"
			pathLength="360"
			transform="rotate({90 + HALF_GAP})"
		/>
		<circle
			cx="40"
			class="slider-thumb"
			fill="#fff"
			transform="rotate({90 + HALF_GAP + (360 - HALF_GAP * 2) * value})"
		/>
		<rect x="-20" y="29" width="40" height="20" rx="10" fill="#000" />
		<text
			y="45"
			class="font-mono font-bold"
			text-anchor="middle"
			fill="#fff"
		>
			{Math.round(value * 100)}
		</text>
	</svg>
</div>

<!-- 
<svelte:document
    onpointermove={keepMoving}
    onpointerup={stopMoving}
/>
 -->

<style lang="scss">
	.fill {
		grid-area: 1 / 1;
	}
	.bulb {
		// width: 40vmin;
		// height: 40vmin;
		display: flex;
		border-radius: 100%;
		background-color: black;
		width: 100%;

		& > :global(*),
		&::before {
			grid-area: 1 / 1;
		}

		& > :global(*) {
			margin: 5%;
			z-index: 3;
		}

		&::before {
			content: "";
			pointer-events: none;
			width: 100%;
			height: 100%;
			border-radius: 100%;
			background-color: var(--c);
			mix-blend-mode: screen;
			background-blend-mode: overlay;
			transform: scale(2.3);
			transition: transform 0.2s ease;
			z-index: 2;

			[data-light="true"] & {
				transform: scale(1);
			}
		}
	}

	svg {
		--width: 1rem;
		touch-action: none;

		& .slider-border {
			stroke-width: var(--width);
		}
		& .slider-track {
			stroke-width: 2px;
		}
		& .slider-progress {
			stroke-width: calc(var(--width) - 4px);
		}
		& .slider-thumb {
			r: calc((var(--width) - 8px) / 2);
		}
		& text {
			font-variant-numeric: tabular-nums;
			font-size: 1rem;
			text-align: center;
			line-height: 1;
		}
	}
</style>
