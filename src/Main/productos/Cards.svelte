<script>
    import Card from './Card.svelte';
    import Carousel from '../../Header/Carousel.svelte';

    let data = contenido();
    async function contenido(){
        let contenido = [];
        try {
            let data      = await fetch('./src/content/productos.json');
            let resp      = await data.json();
                contenido = Object.values(resp);
                return contenido;
        } 
        catch (err) {
            return resp;                      
        }
    }

</script>
<section class="
        flex justify-center flex-wrap w-screen lg:justify-evenly transform translate-x-10">
        {#await data then value}
            <Carousel autoplay={4000} perPage={{ 1:1, 768:2 , 1240:3 }} dots={false}>
                <div class="w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control" slot="left-control">
                    &laquo
                </div>
                {#each value as datos}
                    <div class="w-screen mr-16">
                        <Card {datos}/>
                    </div>
                {/each}          
                <div class="w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control" slot="right-control"> 
                    &raquo
                </div>      
            </Carousel>
        {/await}
</section>
