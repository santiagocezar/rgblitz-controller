<script lang="ts">
    import { SvelteWebSocket } from "$lib/util.svelte";
    import bingbong from "$lib/assets/bingbong.ogg";
    import Dial from "$lib/Dial.svelte";

    import Bulb from "~icons/hugeicons/bulb";
    import Tick from "~icons/hugeicons/tick-01";
    import Refresh from "~icons/hugeicons/refresh";
    import mqtt from "mqtt";

    let debug = $state(false);

    let light = $state(true);
    
    let puntos = $state(0);

    type Color = [r: number, g: number, b: number]
    type HSL = { h: number, s: number, l: number }

    function randomize() {
        return [
            Math.floor((Math.random() ** 2) * 256),
            Math.floor((Math.random() ** 2) * 256),
            Math.floor((Math.random() ** 2) * 256),
        ] as Color
    }
    

    function rgbToHsl(r: number, g: number, b: number): HSL {
        r /= 255, g /= 255, b /= 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        // not achromatic
        if (max != min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return {
            h: h * Math.PI * 2, 
            s,
            l
        };
    }

    let color1: Color = $state([128, 128, 128])
    let color2: Color = $state(randomize())

    const hsl1 = $derived(rgbToHsl(...color1));
    const hsl2 = $derived(rgbToHsl(...color2));

    function hslToXY(color: HSL) {
        const r = (1 - Math.abs(color.l - .5) * 2) * (color.s)
        return {
            x: r * Math.cos(color.h) * 50,
            y: r * Math.sin(color.h) * 50,
        }
    }

    const pos1 = $derived(hslToXY(hsl1));
    const pos2 = $derived(hslToXY(hsl2));

    function deltaC([r1, g1, b1]: Color, [r2, g2, b2]: Color) {
        const rm = (r1 + r2) / 2
        const { sqrt, pow } = Math
        return sqrt(
            (2 + rm / 256) * pow(r2-r1, 2) +
            4 * pow(g2-g1, 2) +
            (2 + (255-rm) / 256) * pow(b2-b1, 2)
        )
    }

    console.log("Test deltaC: " + deltaC([242, 212, 207], [242, 212, 207]))

    function distanceRGB(colorA: Color, colorB: Color) {
        return 100 - Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2)
    }

    const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
        username: "santiagocezar",
        password: "rgblitz0401",

    })

    $effect(() => {
        const data = new Uint8Array([1, ...color1])
        // @ts-expect-error it can actually handle the Uint8Array
        client.publish("santiagocezar/rgblitz", data)
    })

    $effect(() => {
        const data = new Uint8Array([2, ...color2])
        // @ts-expect-error it can actually handle the Uint8Array
        client.publish("santiagocezar/rgblitz", data)
    })
    
    function reset() {
        puntos = 0
    }

    let audio: HTMLAudioElement
    function check() {
        if (!audio) audio = new Audio(bingbong)
        if (distanceRGB(color1, color2) > 80) {
            puntos ++
            color2 = randomize()
            if (audio.paused) {
                audio.play();
            }else{
                audio.currentTime = 0
            }
        } else {
            reset()
        }
    }
    
    const referenciaPrimarios = ["#f00", "#0f0", "#00f"]

    let cssPrimarios = $derived.by(() => {
        return color1.map((valor, i) => {
            const rgbParam = [0, 0, 0]
            rgbParam[i] = valor
            return `rgb(${rgbParam})`
        })
    })

    $effect(() => {
        const onSpace = (e: KeyboardEvent) => {
            if (e.code == "Space") {
                e.preventDefault()
                light = !light
            }
        }
        document.addEventListener("keypress", onSpace)
        return () => {
            document.removeEventListener("keypress", onSpace)
        }
    })
</script>

<audio bind:this={audio} src={bingbong}></audio>

<svelte:document onkeypress={(e) => {
    e.code == "Backquote" && (debug = !debug)
}} />

<main data-light={light}>
    <div class="rgb">
        {#each color1 as comp, i}
            <div class="bulb" style="--c: {cssPrimarios[i]}; --bg4: #000; --text: {referenciaPrimarios[i]}">
                <Dial bind:value={() => color1[i] / 255, (v) => color1[i] = Math.round(v * 20) / 20 * 255} />
                <!-- <input type="number" min="0" max="255" bind:value={components[i]}> -->
            </div>
        {/each}
    </div>
    {#if debug}
        
        <div class="debug">
            {#snippet color(name: string, rgb: Color)}
                {@const hsl = rgbToHsl(...rgb)}
                <p>
                    <span class="ref" style="background-color: rgb({rgb});"></span>
                    {name}
                </p>
                <p>
                    <strong>RGB:</strong> {rgb.map(v => v.toFixed(2)).join(", ")}
                </p>
                <p>
                    <strong>H:</strong> {(hsl.h / Math.PI * 180).toFixed(2)}°
                    <strong>S:</strong> {(hsl.s * 100).toFixed(2)}%
                    <strong>L:</strong> {(hsl.l * 100).toFixed(2)}%
                </p>
            {/snippet}
            {@render color("Color 1", color1)}
            {@render color("Color 2", color2)}
            <br>
            <p>
                <strong>Parecido:</strong> {distanceRGB(color1, color2).toFixed(2)}%
            </p>
            <svg viewBox="-50 -50 100 100">
                <circle cx="0" cy="0" r="50" fill="#eee"></circle>
                <circle cx={pos1.x} cy={pos1.y} r="5" fill="red"></circle>
                <circle cx={pos2.x} cy={pos2.y} r="5" fill="blue"></circle>
            </svg>
        </div>
    {/if}
    <header>
        <p class="score">{puntos}</p>
        
        <button onclick={reset} class="restart-button">
            <Refresh />
        </button>
        <button onclick={() => light = !light} class="light-toggle">
            <Bulb />
        </button>
        <button onclick={check} class="check-button">
            <Tick />
        </button>
    </header>
</main>

<style lang="scss">
main {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    background-color: black;
    overflow: hidden;
}

.rgb {
    grid-area: 1 / 1 / -1 / -1;
    display: grid;
    grid-template-rows: auto auto;
    place-content: center;
    place-items: center;
    gap: 0 4vmin;
    transition: background-color .4s ease-out;
    padding: .5rem;
}

.debug {
    position: fixed;
    left: 0;
    bottom: 0;
    background-color: #0002;
    color: black;
    padding: .5rem;
    font-family: monospace;
    line-height: 1.2;
}

.refs {
    display: flex;
}
.ref {
    display: inline-block;
    vertical-align: middle;
    width: 1.2em;
    height: 1.2em;
}
.debug svg {
    display: block;
    width: 6rem;
    height: 6rem;
}

main[data-light="true"] {
    background-color: white;
}

.bulb {
    width: 40vmin;
    height: 40vmin;
    display: grid;
    border-radius: 100%;
    background-color: black;

    & > :global(*), &::before {
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
        transition: transform .2s ease;
        z-index: 2;

        [data-light="true"] & {
            transform: scale(1);
        }
    }

    &:first-child {
        grid-row-start: 1;
        grid-column: span 2;
    }
}

header {
    grid-column-start: 1;
    grid-row-start: 1;
    display: flex;
    padding: 2rem 1.5rem;
    gap: 1rem;
    font-size: 1.5rem;
    & button {
        height: 2em;
    }            
}

.score {
    color: white;
    font-size: 4em;
    line-height: 1;
    margin-top: -1rem;
    font-weight: 900;
    font-variant: tabular-nums;

    [data-light="true"] & {
        color: black;
    }
}


.light-toggle {
    --bg: hsl(50, 90%, 95%);
    --border: hsl(50, 90%, 80%);
    --text: black;
    margin-left: auto;
    
    [data-light="true"] & {
        --bg: hsl(50, 90%, 15%);
        --border: hsl(50, 90%, 5%);
        --text: white;
    }
}

.check-button {
    --bg: hsl(147, 100%, 50%);
    --border: hsl(165, 100%, 35%);
    --text: black;
}

.restart-button {
    --bg: hsl(17, 100%, 50%);
    --border: hsl(355, 100%, 35%);
    --text: white;
}
</style>
