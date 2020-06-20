<script>
    import Tailwindcss from './Tailwindcss.svelte';
    import Nav from './Header/Nav.svelte';
    import Header from './Header/Header.svelte';
    import Main from './Main/Main.svelte';
    import Footer from './Footer/footer.svelte';
</script>

<Tailwindcss/>

<main class="static m-0 p-0 w-screen flex flex-col items-center overflow-hidden">  
  
    <Nav/>
    <Header/>
    <Main/> 
    <Footer/>
</main>


<style>
    :global(body, html){
        scroll-behavior: smooth;
        padding        : 0;
        margin         : 0;
    }
    :global(a:hover){
        text-decoration: none;  
    }
    :global(::-webkit-scrollbar){
        display: none;
    }
    main{
        background: linear-gradient(115.59deg, #015495 6.69%, #0181E4 83.24%);
    }
</style>

