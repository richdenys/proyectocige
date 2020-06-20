<script>
    import Cardc from './Cardcliente.svelte';
    import {createEventDispatcher} from 'svelte';
    const dispatch=createEventDispatcher();
    let data = contenido();
    async function contenido(){
        let contenido = [];
        try {
            let data      = await fetch('./src/content/cliente.json');
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
                fixed
                flex justify-center flex-wrap
                w-screen h-screen
                pt-6 top-0 left-0 
                bg-gray-800 
                z-50 
                text-white 
                overflow-scroll">

<div class="
                fixed
                left-0 top-0
                flex justify-center items-center 
                w-10 h-10 
                m-4
                bg-red-500 
                rounded-full 
                cursor-pointer 
                text-white text-3xl"  on:click={()=>dispatch('ver',false)}>
               <a href="." ><span class="text-white">X</span> </a> </div>

<div class="ml-2 sm:ml-6 lg:ml-40 
      mr-2 sm:mr-2 lg:mr-40 
      grid  mt-12
      grid-cols-3 
      sm:grid-cols-3
      lg:grid-cols-4 gap-2">
        {#await data then value}
            {#each value as cliente,i}
           
                <Cardc {cliente}/>
          
            {/each}
        {/await}
</div>


 </section>      
