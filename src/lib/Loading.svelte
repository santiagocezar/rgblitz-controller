<script lang="ts">
	import type { SVGAttributes } from "svelte/elements";

	const rest: SVGAttributes<SVGElement> = $props();
</script>

<svg {...rest} viewBox="-50 -50 100 100">
	<circle pathLength="100"></circle>
</svg>

<style>
	circle {
		--stroke: 12px;
		r: calc(50px - var(--stroke) / 2);
		stroke-width: var(--stroke);
		stroke: currentColor;
		stroke-linecap: round;
		fill: transparent;

		stroke-dasharray: 100;
		stroke-dashoffset: 99;
		animation:
			dash 0.87s ease-in-out infinite alternate,
			rotate 0.46s linear infinite forwards,
			fade-in 0.5s ease-out;
	}

	@keyframes dash {
		to {
			stroke-dashoffset: 50;
		}
	}

	@keyframes rotate {
		to {
			rotate: 360deg;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
</style>
