<script>
    import Cardc from './Cardcliente.svelte';
// modal
  import Modal from './modal.svelte';
  let nodal=false;


// fin modal





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

<section class="mt-10">
      <div class="ml-2 sm:ml-6 lg:ml-40 
      mr-2 sm:mr-2 lg:mr-40 
      grid  
      grid-cols-3 
      sm:grid-cols-3
      lg:grid-cols-4 gap-2"  >
      
        {#await data then value}
            {#each value as cliente,i}
            {#if i < 12}
                <Cardc {cliente}/>
            {/if}
            {/each}
        {/await}
      </div>
    <div class="mt-8 text-center">
      <a href="#modal" on:click="{()=>nodal=true}" class=" w-32 text-white rounded-full mt-4 p-1 px-8 border-none shadow-xl font-semibold text-xl">
    Ver mas...  
</a>   

    </div>
    
</section>
{#if nodal}
<Modal on:ver="{(resp)=>nodal=resp.detail}"/>
{/if}
<style>
    a{
        color     : white;
        background: linear-gradient(90deg, #F09819 0%, #FF512F 100%);
    }
</style>