<script lang="ts">
	import { Spring } from "svelte/motion";
	import { MediaQuery } from "svelte/reactivity";

	interface Props {
		f: number;
	}

	const { f }: Props = $props();

	const VIEW_WIDTH = 160;
	const VIEW_HEIGHT = 3;

	const MIN_TRIGS = 1;
	const MAX_TRIGS = 2;
	const MIN_TRIG_HEIGHT = VIEW_HEIGHT / 2;
	const MAX_TRIG_HEIGHT = VIEW_HEIGHT;

	const BASE_DURATION = 700;

	const spring = Spring.of(() => f, {
		damping: 0.8,
		stiffness: 0.1,
	});

	function scaly(node: SVGElement) {
		$effect(() => {
			const f = spring.current;
			const x = (MIN_TRIGS + (MAX_TRIGS - MIN_TRIGS) * (1 - f))
			const y = 1 + (MIN_TRIG_HEIGHT / MAX_TRIG_HEIGHT - 1) * f

			node.style.scale = horizontal ? `${x} ${y}` : `${y} ${x}`;
		});
	}

	const query = new MediaQuery("width < 48rem")
	const horizontal = $derived(query.current)

	function wavy(baseDuration: number, direction: number) {
		return function (node: SVGElement) {
			let lasttime = performance.now(),
				lastduration = BASE_DURATION,
				progress = 0;

			let anim: Animation | null = null;

			$effect(() => {
				const f = spring.current;
				const speed = f / 3 + 0.2;
				const duration =
					speed > 0 ? (baseDuration) / speed : 0;
				const currenttime = performance.now();
				const difftime = currenttime - lasttime;

				if (lastduration > 0) {
					progress += (difftime % lastduration) / lastduration;
				}

				let x = horizontal ? VIEW_WIDTH * direction : 0
				let y = horizontal ? 0 : VIEW_WIDTH * direction

				anim?.cancel();
				anim = node.animate(
					[
						{
							translate: `0 0`,
						},
						{
							translate: `${x}px ${y}px`,
						},
					],
					{
						fill: "forwards",
						iterations: Infinity,
						duration,
						delay: -duration * progress,
					},
				);

				lasttime = currenttime;
				lastduration = duration;
			});
		};
	}

	
	const trigs = $derived(horizontal 
	? `${VIEW_WIDTH / MAX_TRIGS / 2},${-MAX_TRIG_HEIGHT} ${VIEW_WIDTH / MAX_TRIGS / 2},${MAX_TRIG_HEIGHT} `.repeat(MAX_TRIGS * 3)
	: `${-MAX_TRIG_HEIGHT},${VIEW_WIDTH / MAX_TRIGS / 2} ${MAX_TRIG_HEIGHT},${VIEW_WIDTH / MAX_TRIGS / 2} `.repeat(MAX_TRIGS * 3))
	
	const d = $derived(horizontal ? `
		M ${-VIEW_WIDTH},${VIEW_HEIGHT}
		l ${trigs}
		V ${VIEW_HEIGHT}
		z
	` : `
		M ${VIEW_HEIGHT},${-VIEW_WIDTH}
		l ${trigs}
		H ${VIEW_HEIGHT}
		z
	`)

	const w = $derived(horizontal ? VIEW_WIDTH : VIEW_HEIGHT)
	const h = $derived(horizontal ? VIEW_HEIGHT : VIEW_WIDTH)
</script>

<svg viewBox="0 0 {w} {h}">
	<defs>
		<filter id="r" x="0" y="0" xmlns="http://www.w3.org/2000/svg">
			<!-- <feGaussianBlur in="SourceGraphic" result="main" stdDeviation="2" /> -->
			<feColorMatrix
				in="main"
				type="matrix"
				values="1 0 0 0 0
                        0 0 0 0 0 
                        0 0 0 0 0 
                        0 0 0 1 0"
			/>
		</filter>
		<filter id="g" x="0" y="0" xmlns="http://www.w3.org/2000/svg">
			<!-- <feGaussianBlur in="SourceGraphic" result="main" stdDeviation="2" /> -->
			<feColorMatrix
				in="main"
				type="matrix"
				values="0 0 0 0 0
                        0 1 0 0 0 
                        0 0 0 0 0 
                        0 0 0 1 0"
			/>
		</filter>
		<filter id="b" x="0" y="0" xmlns="http://www.w3.org/2000/svg">
			<!-- <feGaussianBlur in="SourceGraphic" result="main" stdDeviation="2" /> -->
			<feColorMatrix
				in="main"
				type="matrix"
				values="0 0 0 0 0
                        0 0 0 0 0 
                        0 0 1 0 0 
                        0 0 0 1 0"
			/>
		</filter>
	</defs>
	<g {@attach scaly} filter="url(#r)">
		<path
			{@attach wavy(300, 1)}
			fill="var(--c)"
			{d}
		/>
	</g>
	<g {@attach scaly} filter="url(#g)">
		<path
			{@attach wavy(400, -1)}
			fill="var(--c)"
			{d}
		/>
	</g>
	<g {@attach scaly} filter="url(#b)">
		<path
			{@attach wavy(4000, 1)}
			fill="var(--c)"
			{d}
		/>
	</g>
</svg>

<style>
	svg {
		flex-shrink: 0;
		width: 100%;
	}
	g,
	rect {
		mix-blend-mode: screen;
		transform-origin: bottom;
	}
	@media (width >= 48rem) {
		svg {
			width: auto;
			height: 100%;
			margin-right: -1px;
		}
		g,
		rect {
			transform-origin: right;
		}
	}
</style>
