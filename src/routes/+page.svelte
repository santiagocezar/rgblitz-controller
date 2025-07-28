<script lang="ts">
	import ColorSlider from "$lib/ColorSlider.svelte";
	import Controller, { type Color } from "$lib/Controller.svelte";
	import mqtt from "mqtt";
	import { SvelteMap } from "svelte/reactivity";

	let puntos = $state(0);

	let name = $state("");
	let closest = $state("");
	let ownDistance = $state(0);
	let closestDistance = $state(0);

	let currentState: "login" | "connecting" | "ready" = $state("login");

	const clientID = new Uint8Array(4);
	crypto.getRandomValues(clientID);

	let clientNames = new SvelteMap<string, string>();

	// ciiii...  c: command, i: client id, ...: display name
	const HELLO = 1;
	// ciiiirgb  c: command, i: client id, rgb: color
	const GUESS_COLOR = 2;
	// ciiiirgbd c: command, i: client id, rgb: color, d: distance
	const CLOSEST_GUESS = 3;
	// ciiii...  c: command, i: client id, ...: display name
	const HELLO_ACK = 4;
	// crgb      c: command, rgb: color
	const SET_SECRET_COLOR = 5;

	const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
		username: "santiagocezar",
		password: "rgblitz0401",
	});

	$effect(() => {
		client
			.subscribe("santiagocezar/rgblitz")
			.subscribe("santiagocezar/rgblitz-out");
	});

	async function sayHello() {
		clientNames.set(clientID.toString(), name);

		await sendHello();

		currentState = "ready";
	}

	async function sendHello() {
		console.log(`i'm ${clientID} aka ${name}`);

		const encoder = new TextEncoder();
		const nameBytes = encoder.encode(name);
		const data = new Uint8Array(1 + clientID.length + nameBytes.length);
		data[0] = HELLO;
		data.set(clientID, 1);
		data.set(nameBytes, 1 + clientID.length);
		// @ts-expect-error it can actually handle the Uint8Array
		await client.publishAsync("santiagocezar/rgblitz", data);
	}

	async function sendColor(color: Color) {
		const data = new Uint8Array([GUESS_COLOR, ...clientID, ...color]);
		// @ts-expect-error it can actually handle the Uint8Array
		client.publish("santiagocezar/rgblitz", data);
	}

	$effect(() => {
		async function msgHandler(topic: string, _payload: Uint8Array) {
			const payload = new Uint8Array(_payload);

			if (payload[0] === HELLO) {
				const otherID = payload
					.slice(1, 1 + clientID.length)
					.toString();
				const decoder = new TextDecoder();
				console.log(otherID);
				const name = decoder.decode(payload.slice(1 + clientID.length));

				console.log(`it's ${otherID} aka ${name}`);

				if (!clientNames.has(otherID) && currentState === "ready") {
					await sendHello();
				}

				clientNames.set(otherID, name);
			} else if (payload[0] === CLOSEST_GUESS) {
				const otherID = payload
					.slice(1, 1 + clientID.length)
					.toString();
				closestDistance = payload[8];
				closest = clientNames.get(otherID)!;
				if (
					otherID === clientID.toString() &&
					closestDistance > ownDistance
				) {
					ownDistance = closestDistance;
				}
				if (closestDistance > 80) {
					alert("ganó " + closest);
				}
			}
		}
		client.on("message", msgHandler);

		return () => client.off("message", msgHandler);
	});

	$effect(() => {
		if (ownDistance > closestDistance) {
			closestDistance = ownDistance;
		}
	});

	// $effect(() => {
	//     const data = new Uint8Array([1, ...color1])
	//     // @ts-expect-error it can actually handle the Uint8Array
	//     client.publish("santiagocezar/rgblitz", data)
	// })

	// $effect(() => {
	//     const data = new Uint8Array([2, ...color2])
	//     // @ts-expect-error it can actually handle the Uint8Array
	//     client.publish("santiagocezar/rgblitz", data)
	// })
</script>

{#if currentState === "ready"}
	<label>
		<span>dist. propia</span>
		<input type="range" min="0" max="100" bind:value={ownDistance} />
	</label>
	<label>
		<span>dist. más próxima</span>
		<input type="range" min="0" max="100" bind:value={closestDistance} />
	</label>
	<label>
		<span>jugador más próximo</span>
		<select bind:value={closest}>
			{#each clientNames.entries() as [id, name]}
				<option value={id}>{name}</option>
			{/each}
		</select>
	</label>
	<Controller
		{name}
		closest={clientNames.get(closest) ?? null}
		{closestDistance}
		{ownDistance}
		onColorSend={sendColor}
		onReset={() => (puntos = 0)}
		{puntos}
	/>
{:else}
	<form action="#" onsubmit={sayHello}>
		<input type="text" bind:value={name} />
		<button disabled={currentState !== "login"}>Subir</button>
		<ul>
			{#each clientNames.values() as name}
				<li>{name}</li>
			{/each}
		</ul>
		<!-- <div class="grid">
            <ColorSlider color="r" value={0} />
            <ColorSlider color="g" value={0} />
            <ColorSlider color="b" value={0} />
        </div> -->
	</form>
{/if}
