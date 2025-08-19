import mqtt from "mqtt";
import { SvelteMap } from "svelte/reactivity"
import EventEmitter from "./eventemitter";

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
// crstttttttt      c: command, r: remaining, s: restart, t: timestamp
const TICK = 6;

const PLAYER_ID_LEN = 4

export type Color = [r: number, g: number, b: number];

function scoreFromCloseness(closeness: number): number {
    return closeness * 5 // lol
}

export default class Game extends EventEmitter<{
    roundStart(): void
    roundFinished(winner: string, score: number): void
}> {
    player_id: Uint8Array
    
    player_name = $state("")

    known_names = new SvelteMap<string, string>()

    score = $state(0)
    round_time = $state(0)

    closest_client: string | null = $state(null)
    closest_name: string | null = $derived(this.closest_client && this.known_names.get(this.closest_client) || null)
    closest = $state(0)
    player_closeness = $state(0)

    client: mqtt.MqttClient | null = null
    
    constructor() {
        super()

        this.player_id = new Uint8Array(PLAYER_ID_LEN);
        crypto.getRandomValues(this.player_id);
    }

    async init() {
        this.client = await mqtt.connectAsync("wss://broker.emqx.io:8084/mqtt", {
            username: "santiagocezar",
            password: "rgblitz0401",
        });

        await Promise.all([
            this.client.subscribeAsync("santiagocezar/rgblitz/clients"),
            this.client.subscribeAsync("santiagocezar/rgblitz/game"),
        ])
        
		this.client.on("message", this.#onMessage);
    }


    deinit() {
        if (this.client) {
            this.client.off("message", this.#onMessage);
            this.client.end()
        }
        this.removeAllHandlers()
    }

    async login(name: string) {
        this.player_name = name
		this.known_names.set(this.player_id.toString(), this.player_name);

		await this.#sendHello();
    }

    async handleMessage(topic: string, payload: Uint8Array) {
        console.log(payload)
        if (payload[0] === HELLO) {
            const otherID = payload
                .slice(1, 1 + PLAYER_ID_LEN)
                .toString();
            const decoder = new TextDecoder();
            console.log(otherID);
            const name = decoder.decode(payload.slice(1 + PLAYER_ID_LEN));

            console.log(`it's ${otherID} aka ${name}`);

            this.known_names.set(otherID, name);

            if (!this.known_names.has(otherID) && this.player_name) {
                await this.#sendHello();
            }
        } else if (payload[0] === CLOSEST_GUESS) {
            const otherID = payload
                .slice(1, 1 + this.player_id.length)
                .toString();
            this.closest = payload[8];
            this.closest_client = otherID;
            if (
                otherID === this.player_id.toString() &&
                this.closest > this.player_closeness
            ) {
                this.player_closeness = this.closest;
            }
            if (this.closest > 80) {
                const score = scoreFromCloseness(this.closest)
                if (otherID === this.player_id.toString()) {
                    this.score += score
                }
                this.emit("roundFinished", this.closest_name!, score);
            }
        } else if (payload[0] === TICK) {
            const view = new DataView(payload.buffer);
            const remaining = view.getUint8(1);
            const restart = view.getUint8(2) === 1;
            const timestamp = Number(view.getBigInt64(3));
            this.round_time = remaining;
            if (restart) {
                this.closest_client = null;
                this.closest = 0;
                this.player_closeness = 0;
                this.emit("roundStart")
            }
            console.log({
                remaining,
                time: new Date(timestamp * 1000),
            });
        }
    }

	async guessColor(color: Color) {
		const data = new Uint8Array([GUESS_COLOR, ...this.player_id, ...color]);
		// @ts-expect-error it can actually handle the Uint8Array
		await this.client.publishAsync("santiagocezar/rgblitz/clients", data);
	}


    #onMessage: mqtt.OnMessageCallback = (topic, payload) => {
        this.handleMessage(topic, new Uint8Array(payload))
    }

	async #sendHello() {
		// console.log(`i'm ${clientID} aka ${name}`);
		const encoder = new TextEncoder();
		const nameBytes = encoder.encode(this.player_name);
		const data = new Uint8Array([HELLO, ...this.player_id, ...nameBytes]);
		// @ts-expect-error it can actually handle the Uint8Array
		await this.client.publishAsync("santiagocezar/rgblitz/clients", data);
	}

}