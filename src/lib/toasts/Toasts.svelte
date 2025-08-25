<script lang="ts">
	import { toasts } from "./state.svelte";
	import Toast from "./Toast.svelte";

	const first = $derived(toasts.values().next().value);
</script>

<section
	class="z-30 flex flex-col absolute inset-0 items-center justify-center pointer-events-none"
>
	{#if first}
		<Toast {...first} />
	{/if}
	<!-- {#each toasts.values() as toast (toast.id)}
		<Toast {...toast} />
	{/each} -->
</section>
