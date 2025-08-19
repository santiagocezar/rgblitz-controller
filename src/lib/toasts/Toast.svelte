<script lang="ts">
	import { fade, slide } from "svelte/transition";
	import type { ToastData } from "./state.svelte";

	const { message, type }: ToastData = $props();
</script>

<div
	in:fade
	out:fade
	class="flex flex-col items-center justify-center bg-radial from-black to-transparent aspect-square w-full"
>
	{#if type === "won"}
		<p class="text-xl">Ganó</p>
	{/if}
	<p class="text-6xl">
		{message}
	</p>
</div>
