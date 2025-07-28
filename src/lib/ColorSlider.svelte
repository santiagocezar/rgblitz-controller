<script lang="ts">
    import type { Action } from "svelte/action";
    
    interface Props {
        color: "r" | "g" | "b"
        value: number,
    }

    let { value = $bindable(0), color }: Props = $props();

    const c = {
        r: "#f00",
        g: "#0f0",
        b: "#00f",
    }

</script>

<div class="bar" style="--progress: {value / 100}; --c: {c[color]}">
    <input type="range" min="0" max="100" bind:value>
    <div class="absolute right-0 bottom-0 pointer-events-none font-bold text-5xl tabular-nums px-2 py-1 rounded-tl-lg text-[var(--background)] bg-[var(--thumb)]">
        {value}
    </div>
</div>

<!--
<svg
    viewBox="-50 -50 100 100"
    style="
        --half-gap: {HALF_GAP}deg;
        --phi: {angle.value - Math.PI / 2}rad;
    "
    use:dial
>
    <circle
        cx="0"
        cy="0"
        r="40"
        fill="none"
        class="slider-border"
        stroke="var(--bg4)"
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
        stroke="var(--text)"
        stroke-linecap="round"
        stroke-dasharray="{(360 - HALF_GAP * 2) * value} {360 - (360 - HALF_GAP * 2) * value} {HALF_GAP * 2}"
        pathLength="360"
        transform="rotate({90 + HALF_GAP})"
    />
    <rect x="-20" y="29" width="40" height="20" rx="10" fill="var(--bg4)" />
    <text y="45" text-anchor="middle"  fill="var(--text)">
        {Math.round(value * 100)}
    </text> 
</svg> -->

<style lang="scss">
    .bar {
        --c: #f00;
        position: relative;
        border-radius: 1rem;
        overflow: hidden;
        --background: color-mix(in oklab, var(--c), black 75%);
        --border: var(--background);
        --progress-color: var(--c);
        --thumb: color-mix(in oklab, var(--c), white);
        --thumb-height: 1.5rem;
        --gradient-progress: calc(var(--progress) * 100% + var(--thumb-height) / 2 - var(--thumb-height) * var(--progress));
 
        background-image: linear-gradient(to top, var(--c) var(--gradient-progress), var(--background) var(--gradient-progress));
        border: .25rem solid var(--border);
    }
    .label {
        position: absolute;
        right: 0;
        bottom: 0;
        pointer-events: none;
        font-weight: bold;
        font-size: 3rem;
        font-variant: tabular-nums;
        line-height: 1;
        padding: .2em .30em;
        background-color: var(--thumb);
        color: var(--background);
        border-radius: .75rem 0 .75rem 0;
    }
    .bar input[type="range"] {
        writing-mode: vertical-rl;
        direction: rtl;
        appearance: slider-vertical;
        vertical-align: bottom;
        -webkit-appearance: none;
        appearance: none; 
        background: none;
        width: 100%;

        &::-webkit-slider-runnable-track {
            width: 100%;
            background: none;
        }

        &::-moz-range-track {
            background: none;
        }
        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            border: none;
            height: var(--thumb-height);
            width: 100%;
            background-color: var(--thumb);
            box-sizing: border-box;
            border-radius: 1rem;
        }

        &::-moz-range-thumb {
            border: none;
            height: var(--thumb-height);
            width: 100%;
            background-color: var(--thumb);
            box-sizing: border-box;
            border-radius: 1rem;
        }

    }
</style>
    

<!-- 
<svelte:document
    onpointermove={keepMoving}
    onpointerup={stopMoving}
/>
 -->
