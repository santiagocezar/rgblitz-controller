<script lang="ts">
	import Dial from "./Dial2.svelte";

	interface Props {
		color: [number, number, number];
		expand?: boolean;
	}

	const components = ["r", "g", "b"] as const;

	const { color = $bindable(), expand }: Props = $props();
</script>

{#snippet bulb(i: number)}
	<Dial
		{expand}
		color={components[i]}
		bind:value={
			() => color[i] / 255,
			(v) => (color[i] = (Math.round(v * 20) / 20) * 255)
		}
	/>
{/snippet}

<div class="rgb">
	<div class="top">
		{@render bulb(0)}
	</div>
	<div class="bottom">
		{@render bulb(1)}
		{@render bulb(2)}
	</div>
	<!-- <div class="bulb">
        {@render bulb(0)}
    </div>
    <div class="bulb">
        {@render bulb(1)}
    </div>
    <div class="bulb">
        {@render bulb(2)}
    </div> -->
</div>

<style>
	.rgb {
		/* position: relative; */
		width: 100%;
		max-width: var(--breakpoint-sm);
		/* overflow: hidden; */
		aspect-ratio: 1 / 0.93301;
		place-self: center;
	}
	.top,
	.bottom {
		/* 2 / (2 + sqrt(3)) */
		height: 53.58983849%;
		display: flex;
		justify-content: center;
	}
	.top {
		/* - (4 − (2 + sqrt(3))) / 4 */
		margin-bottom: -6.69873%;
	}
</style>
