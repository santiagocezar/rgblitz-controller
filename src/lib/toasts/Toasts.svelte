<script lang="ts">
	import { toasts } from "./state.svelte";
	import Toast from "./Toast.svelte";
</script>

<section
	class="z-30 flex flex-col absolute inset-0 items-center justify-center pointer-events-none"
>
	{#each toasts.values() as toast (toast.id)}
		<Toast {...toast} />
	{/each}
</section>
