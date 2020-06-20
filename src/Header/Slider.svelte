
<script>
	import Carousel from './Carousel.svelte';
	let controlador=Array(2);
	function pip(event){
		controlador[0]=event.detail.currentSlide;
		controlador[1]=event.detail.slideCount;
	}

	let slide=datos(); 
	let ir=0;
	async function datos(){
		let datos=[];
		try {
			let data  = await fetch('./src/content/slide.json');
			let resp  = await data.json();
				datos = Object.values(resp);
			return datos;
		} catch (err){return err};
	}
</script>	

<section class="
		w-full h-64 relative 
		flex flex-col justify-center items-center
		md:h-screen-1/2 md:w-1/2
		xl:h-screen-3/4">

	<img class="absolute w-full h-full z-10" 
		src="./src/img/assets/background.svg" alt="">
		
	<div class="
			z-10
			flex slide 
			transform 
			translate-y-5 -translate-x-4 
			sm:-translate-x-5 
			xl:-translate-x-8 xl:translate-y-12">

		{#await slide then value}
			<Carousel autoplay={4300} duration={700} on:change={pip} perPage={1} dots={false}>
				<i class="
						active hidden sm:block
						w-10 h-10 
						text-2xl text-white text-center 
						rounded-full 
						transform scale-100 transition-transform duration-300 hover:scale-150" 
						slot="left-control">
					&laquo
				</i>
				{#each value as item}
					<img class="
							slide 
							transform 
							scale-50  
							sm:scale-75 
							xl:scale-100" 
							src="{item.image}" 
							alt="{item.alt}">
				{/each}
			</Carousel>
		{/await}

	</div>

</section>

<ul class="
		block 
		w-auto h-auto 
		flex flex-row justify-center 
		absolute bottom-0">

	{#each {length: controlador[1]} as _, i}
		<li class="
				hidden sm:block 
				w-5 h-5 
				mx-2 
				bg-gray-300 
				rounded-full 
				{controlador[0] === i ? 'active' : '' }">
		</li>
	{/each}

</ul>

<style>
	.slide{
		width : 25rem;
		height: 25rem;
	}
	.active{
        background: linear-gradient(90deg, #F09819 0%, #FF512F 100%);
	}
</style>


