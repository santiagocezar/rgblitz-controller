<script lang="ts">
    import { SvelteWebSocket } from "$lib/ws.svelte";
    import Dial from "$lib/Dial.svelte";

    import Bulb from "~icons/hugeicons/bulb";
    import Tick from "~icons/hugeicons/tick-01";
    import Refresh from "~icons/hugeicons/refresh";

    let light = $state(true);
    
    let puntos = $state(0);

    type Color = [r: number, g: number, b: number]

    function randomize() {
        return [
            Math.floor((Math.random() ** 2) * 256),
            Math.floor((Math.random() ** 2) * 256),
            Math.floor((Math.random() ** 2) * 256),
        ] as Color
    }

    let color1: Color = $state([128, 128, 128])
    let color2: Color = $state(randomize())

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
    const MAX_DELTA_C = deltaC([0, 0, 0], [255, 255, 255])

    function distanceRGB(colorA: Color, colorB: Color) {
        return 100 - 100 * deltaC(colorA, colorB) / MAX_DELTA_C
    }

    const ws = new SvelteWebSocket("http://192.168.132.24/ws")

    $effect(() => {
        const data = new Uint8Array([1, ...color1]).buffer
        const conn = ws.connection
        if (conn) {
            conn.send(data)
        }
    })

    $effect(() => {
        const data = new Uint8Array([2, ...color2]).buffer
        const conn = ws.connection
        if (conn) {
            conn.send(data)
        }
    })

    function reset() {
        puntos = 0
    }

    function check() {
        if (distanceRGB(color1, color2) > 70) {
            puntos ++
            color2 = randomize()
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

<main data-light={light}>
    <div class="rgb">
        {#each color1 as comp, i}
            <div class="bulb" style="--c: {cssPrimarios[i]}; --bg4: #000; --text: {referenciaPrimarios[i]}">
                <Dial bind:value={() => color1[i] / 255, (v) => color1[i] = v * 255} />
                <!-- <input type="number" min="0" max="255" bind:value={components[i]}> -->
            </div>
        {/each}
    </div>
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
