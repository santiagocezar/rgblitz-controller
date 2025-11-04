import mqtt from "mqtt";
import { SvelteMap } from "svelte/reactivity";
import EventEmitter from "./eventemitter";

// ciiii...  c: command, i: client id, ...: display name
const HELLO = 1;
// ciiiirgb  c: command, i: client id, rgb: color
const GUESS_COLOR = 2;
// ciiiirgbd c: command, i: client id, rgb: color, d: distance
const GUESS_RESULT = 3;
// crstttttttt      c: command, r: remaining, s: restart, t: timestamp
const TICK = 6;
// cdTrgbtttttttt  c: command, d: difficulty, T: remaining, t: timestamp
const ROUND_START = 7;
// cdTrgbtttttttt  c: command, d: difficulty, T: remaining, t: timestamp
const ROUND_CONFIG = 8;

const PLAYER_ID_LEN = 4;

export type Color = [r: number, g: number, b: number];

type Message =
	| {
			type: "Hello";
			client: string;
			name: string;
	  }
	| {
			type: "RoundStart";
			difficulty: number;
			remaining: number;
			secret: Color;
			now: Date;
	  }
	| {
			type: "RoundConfig";
			difficulty: number;
			remaining: number;
			secret: Color;
			now: Date;
	  }
	| {
			type: "GuessResult";
			client: string;
			rgb: Color;
			closeness: number;
			closest: boolean;
	  }
	| {
			type: "Tick";
			remaining: number;
			now: Date;
	  };

function scoreFromCloseness(closeness: number): number {
	return closeness * 5; // lol
}

function parseMessage(payload: Uint8Array): Message | null {
	const type = payload[0];
	const view = new DataView(
		payload.buffer.slice(
			payload.byteOffset,
			payload.byteOffset + payload.byteLength
		)
	);
	if (type === HELLO) {
		const client = payload.slice(1, 1 + PLAYER_ID_LEN).toString();
		const decoder = new TextDecoder();
		const name = decoder.decode(payload.slice(1 + PLAYER_ID_LEN));

		return {
			type: "Hello",
			client,
			name,
		};
	} else if (type === GUESS_RESULT) {
		const client = payload.slice(1, 1 + PLAYER_ID_LEN).toString();
		const rgbBuf = payload.slice(1 + PLAYER_ID_LEN, 1 + PLAYER_ID_LEN + 3);

		const closeness = payload[8] & 0b01111111;
		const closest = (payload[8] & 0b10000000) > 0;

		return {
			type: "GuessResult",
			client,
			rgb: [rgbBuf[0], rgbBuf[1], rgbBuf[3]],
			closeness,
			closest,
		};
	} else if (type === TICK) {
		const remaining = payload[1];
		const int = view.getBigInt64(2, false);
		const now = new Date(Number(int) * 1000);

		return {
			type: "Tick",
			remaining,
			now,
		};
	} else if (type === ROUND_START) {
		let i = 1;
		const difficulty = view.getUint8(i++);
		const remaining = view.getUint8(i++);
		const secretBuf = payload.slice(i, (i += 3));
		const now = new Date(Number(view.getBigInt64(i)));

		return {
			type: "RoundStart",
			difficulty,
			remaining,
			secret: [secretBuf[0], secretBuf[1], secretBuf[2]],
			now,
		};
	} else if (type === ROUND_CONFIG) {
		let i = 1;
		const difficulty = view.getUint8(i++);
		const remaining = view.getUint8(i++);
		const secretBuf = payload.slice(i, (i += 3));
		const now = new Date(Number(view.getBigInt64(i)));

		return {
			type: "RoundConfig",
			difficulty,
			remaining,
			secret: [secretBuf[0], secretBuf[1], secretBuf[2]],
			now,
		};
	}

	return null;
}

export default class Game extends EventEmitter<{
	message(data: Message): void;
	roundFinished(winner: string, score: number): void;
	guessResult(client: string, closeness: number): void;
}> {
	#player_id: Uint8Array = $state(new Uint8Array());

	player_id = $derived(this.#player_id.toString());

	player_name = $state("");

	known_names = new SvelteMap<string, string>();

	score = $state(0);
	round_time = $state(0);
	difficulty = 80;

	closest_client: string | null = $state(null);
	closest_name: string | null = $derived(
		(this.closest_client && this.known_names.get(this.closest_client)) ||
			null
	);
	closest = $state(0);
	player_closeness = $state(0);

	tickInterval: number | null = null;
	lastLocalTickTime: Date | null = null;
	lastRemoteTickTime: Date | null = null;

	client: mqtt.MqttClient | null = null;

	constructor() {
		super();

		const player_id = new Uint8Array(PLAYER_ID_LEN);
		crypto.getRandomValues(player_id);
		this.#player_id = player_id;
	}

	init() {
		// this.client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
		// 	username: "santiagocezar",
		// 	password: "rgblitz0401",
		// });
		this.client = mqtt.connect("wss://e123.cez.ar/mqtt", {
			username: "santiagocezar",
			password: "rgblitz0401",
		});

		this.client.on("message", this.#onMessage);

		this.client.subscribe("santiagocezar/rgblitz/clients");
		this.client.subscribe("santiagocezar/rgblitz/game");
	}

	deinit() {
		if (this.client) {
			this.client.off("message", this.#onMessage);
			this.client.end();
		}
		this.removeAllHandlers();
	}

	async login(name: string) {
		this.player_name = name;
		this.known_names.set(this.player_id, this.player_name);

		await this.#sendHello();
	}

	tick = () => {
		this.lastLocalTickTime = new Date();
		this.round_time = Math.max(0, this.round_time - 1);
	};

	syncTimer() {
		this.lastLocalTickTime = new Date();

		if (!this.lastRemoteTickTime) return;

		const setupInterval = () => {
			if (this.tickInterval != null) {
				clearInterval(this.tickInterval);
			}

			this.tick();
			this.tickInterval = window.setInterval(this.tick, 1000);
		};

		const deltaT =
			this.lastLocalTickTime.getTime() -
			this.lastRemoteTickTime.getTime();

		setTimeout(setupInterval, Math.max(0, 1000 - deltaT));
	}

	async handleMessage(msg: Message) {
		if (!msg) return;

		console.log(msg);

		if (msg.type === "RoundStart") {
			this.difficulty == msg.difficulty;
			this.round_time = msg.remaining;
			this.closest_client = null;
			this.closest = 0;
			this.player_closeness = 0;
		} else if (msg.type === "RoundConfig") {
			this.difficulty == msg.difficulty;
			this.round_time = msg.remaining;
		} else if (msg.type === "Hello") {
			const { client, name } = msg;

			console.log(`it's ${client} aka ${name}`);

			this.known_names.set(client, name);

			if (!this.known_names.has(client) && this.player_name) {
				await this.#sendHello();
			}
		} else if (msg.type == "GuessResult") {
			const { client, closeness, closest } = msg;

			// console.log(`closeness is ${payload[8]} but actually ${closeness}`);

			this.emit("guessResult", client, closeness);

			if (closest) {
				this.closest_client = client;
				this.closest = closeness;
			}

			if (client === this.player_id) {
				this.player_closeness = closeness;
			}

			if (closeness > this.difficulty) {
				const score = scoreFromCloseness(closeness);
				if (client === this.player_id) {
					this.score += score;
				}
				this.emit("roundFinished", this.closest_name!, score);
			}
		} else if (msg.type === "Tick") {
			this.lastRemoteTickTime = msg.now;
			if (this.tickInterval == null) {
				this.syncTimer();

				this.round_time = msg.remaining;
			} else if (this.lastLocalTickTime) {
				const deltaT =
					this.lastRemoteTickTime.getTime() -
					this.lastLocalTickTime.getTime();

				if (deltaT > 100) {
					console.log("time diff with ESP32:", deltaT / 1000);

					this.syncTimer();

					this.round_time = msg.remaining;
				}
			}
		}
	}

	async guessColor(color: Color) {
		const data = new Uint8Array([
			GUESS_COLOR,
			...this.#player_id,
			...color,
		]);
		// @ts-expect-error it can actually handle the Uint8Array
		await this.client.publishAsync("santiagocezar/rgblitz/clients", data);
	}

	#onMessage: mqtt.OnMessageCallback = (topic, payload) => {
		let msg: Message | null = parseMessage(payload);

		if (!msg) return;

		this.handleMessage(msg);

		this.emit("message", msg);
	};

	async #sendHello() {
		// console.log(`i'm ${clientID} aka ${name}`);
		const encoder = new TextEncoder();
		const nameBytes = encoder.encode(this.player_name);
		const data = new Uint8Array([HELLO, ...this.#player_id, ...nameBytes]);
		// @ts-expect-error it can actually handle the Uint8Array
		await this.client.publishAsync("santiagocezar/rgblitz/clients", data);
	}

	[Symbol.dispose]() {
		this.tickInterval && clearInterval(this.tickInterval);
	}
}
