<script lang="ts">
    import { Tween } from "svelte/motion"
    import { cubicInOut } from "svelte/easing"
    import type { Action } from "svelte/action";
    
    const HALF_GAP = 45
    const HALF_GAP_RAD = 45 / 180 * Math.PI

    interface Props {
        value: number,
    }

    let { value = $bindable(0) }: Props = $props()

    let angle = {
        get value() {
            return (value * 2 - 1) * (Math.PI - HALF_GAP_RAD)
        },
        set value(angle: number) {
            value = (Math.max(Math.min(angle, Math.PI - HALF_GAP_RAD), HALF_GAP_RAD - Math.PI) / (Math.PI - HALF_GAP_RAD) + 1) / 2
        }
    }

    const dial: Action<SVGSVGElement> = (base) => {
        let originX = 0, originY = 0;
        let baseSize = 0;
        
        function mapClientPosition(clientX: number, clientY: number) {
            clientX = (clientX - originX) / baseSize * 2 - 1;
            clientY = (clientY - originY) / baseSize * 2 - 1;

            angle.value = Math.atan2(clientX, -clientY)
        }

        function stopMoving(ev: PointerEvent) {
            ev.preventDefault()
            removeDocumentListeners()
        }
        
        function startMoving(ev: PointerEvent) {
            ev.preventDefault()
        
            const rect = base.getBoundingClientRect();
            baseSize = rect.width;
            originX = rect.left;
            originY = rect.top;

            addDocumentListeners()
            mapClientPosition(ev.clientX, ev.clientY);
        }
        
        function keepMoving(ev: PointerEvent) {        
            ev.preventDefault()
            mapClientPosition(ev.clientX, ev.clientY)
        }
        
        function addDocumentListeners() {
            document.addEventListener("pointermove", keepMoving)
            document.addEventListener("pointerup", stopMoving)
        }
        function removeDocumentListeners() {
            document.removeEventListener("pointermove", keepMoving)
            document.removeEventListener("pointerup", stopMoving)
        }

        base.addEventListener("pointerdown", startMoving)

        return {
            destroy() {
                base.removeEventListener("pointerdown", startMoving)
                removeDocumentListeners()
            }
        }
    }
</script>
    
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
</svg>

<style lang="scss">
    svg {
        --width: 1rem;
        touch-action: none;

        & .slider-border {
            stroke-width: var(--width);
        }
        & .slider-progress {
            stroke-width: calc(var(--width) - 2px);
        }
        & text {
            font-variant-numeric: tabular-nums;
            font-size: 1rem;
            text-align: center;
            line-height: 1;
        }
    }
    @media screen and (max-width: 60rem) {
        .dial {
            width: 8rem;
            .base p {
                font-size: 1.8rem;
            }
        }
    }
</style>
    

<!-- 
<svelte:document
    onpointermove={keepMoving}
    onpointerup={stopMoving}
/>
 -->
