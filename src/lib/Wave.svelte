<script lang="ts">
	import { Spring } from "svelte/motion";

	interface Props {
		f: number;
	}

	const { f }: Props = $props();

	const MAX_WAVES = 10;
	const WAVELENGTH = 15;
	const AMPLITUDE = 4;

	const BASE_DURATION = 300;

	const spring = Spring.of(() => f, {
		damping: 0.8,
		stiffness: 0.1,
	});

	function scaly(node: SVGElement) {
		$effect(() => {
			const f = spring.current;
			node.style.scale = `${(10 - f * 8) * 100}% ${(f / 2 + 0.5) * 100}%`;
		});
	}

	function wavy(offset: number) {
		return function (node: SVGElement) {
			let lasttime = performance.now(),
				lastduration = BASE_DURATION,
				progress = 0;

			let anim: Animation | null = null;

			$effect(() => {
				const f = spring.current;
				const speed = f + 0.1;
				const duration =
					speed > 0 ? (BASE_DURATION * (offset + 1)) / speed : 0;
				const currenttime = performance.now();
				const difftime = currenttime - lasttime;

				if (lastduration > 0) {
					progress += (difftime % lastduration) / lastduration;
				}

				console.log({
					f,
					duration,
					currenttime,
					lasttime,
					lastduration,
					progress,
				});

				anim?.cancel();
				anim = node.animate(
					[
						{
							translate: `${-WAVELENGTH * 2}px 0`,
						},
						{
							translate: `${-WAVELENGTH * 4}px 0`,
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
</script>

<svg viewBox="0 0 {WAVELENGTH * MAX_WAVES} {AMPLITUDE * 3}">
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
			{@attach wavy(0)}
			fill="var(--c)"
			d="
                M 0,{-AMPLITUDE * 4}
                L 0,{AMPLITUDE * 1.5}
                q {WAVELENGTH / 2},-{AMPLITUDE} {WAVELENGTH},0
                t {`${WAVELENGTH},0 `.repeat(MAX_WAVES + 1)}
                l 0,{-AMPLITUDE * 4}
                z
            "
		/>
	</g>
	<g {@attach scaly} filter="url(#g)">
		<path
			{@attach wavy(0.5)}
			fill="var(--c)"
			d="
                M {(WAVELENGTH * 2) / 3},{-AMPLITUDE * 4}
                L 0,{AMPLITUDE * 1.5}
                q {WAVELENGTH / 2},-{AMPLITUDE} {WAVELENGTH},0
                t {`${WAVELENGTH},0 `.repeat(MAX_WAVES + 1)}
                l 0,{-AMPLITUDE * 4}
                z
            "
		/>
	</g>
	<g {@attach scaly} filter="url(#b)">
		<path
			{@attach wavy(1)}
			fill="var(--c)"
			d="
                M {(WAVELENGTH * 4) / 3},{-AMPLITUDE * 4}
                L 0,{AMPLITUDE * 1.5}
                q {WAVELENGTH / 2},-{AMPLITUDE} {WAVELENGTH},0
                t {`${WAVELENGTH},0 `.repeat(MAX_WAVES + 1)}
                l 0,{-AMPLITUDE * 4}
                z
            "
		/>
	</g>
</svg>

<style>
	svg {
		width: 100%;
		flex-shrink: 0;
	}
	g,
	rect {
		mix-blend-mode: screen;
	}
</style>
