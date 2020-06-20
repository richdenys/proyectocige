<script>
    import Cards from './Cards.svelte';
    import Title from '../../Title.svelte';
    let title="Productos";
</script>

<section class="
        w-full pt-8 overflow-hidden"
        id="productos" >    
    <Title {title}/>
    <Cards/>
    
</section>
