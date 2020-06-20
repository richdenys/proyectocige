<script>
let codigo="+51";
    let data = contenido();
    async function contenido(){
        let contenido = [];
        try {
            let data      = await fetch('./src/content/motivo.json');
            let resp      = await data.json();
                contenido = Object.values(resp);
                return contenido;
        } 
        catch (err) {
            return resp;                      
        }
    }

    let contacto ='https://formspree.io/xknqzree';
  function onSubmit(token) {
     document.getElementById("demo-form").submit();
   }
</script>

<div class="sm:ml-6 sm:mr-40 mt-3 text-white ">

<form action="{contacto}" method="POST">

<div class=" block sm:flex flex-wrap justify-center ">

   <div class="ml-2 mr-2 mb-2 w-auto sm:w-full "> 

   <input class="   bg-transparent mr-2
   focus:outline-none 
   focus:shadow-outline
   border-b-8 
    border border-gray-300
     rounded-md py-2 px-4 block w-full 
     appearance-none leading-normal" type="text"
      placeholder="Nombre" name="nombre" required>
   </div>

   <div class="mr-2 ml-2 mb-2 w-auto sm:w-full"> 
   <input class="border-b-8 bg-transparent mr-2
    focus:outline-none 
   focus:shadow-outline
    border
    border-gray-300 rounded-md 
    py-2 px-4 block w-full 
    appearance-none leading-normal" type="email"  placeholder="Email" required>
   </div>

</div>
<!-- phone and reason -->
<div>
  <div class="mr-2 ml-2 mb-2 flex  ">
   <div class="w-32">
   <select  id="" class="w-full h-full border-b-8 bg-transparent
    focus:outline-none focus:shadow-outline
     border border-gray-300 
     rounded-md py-2 px-4
      block w-full appearance-none leading-normal">
   <option value="+51">PER </option>
   </select>
   
   </div>
   <input name="phone" value="{codigo}" class=" border-b-8 bg-transparent 
    focus:outline-none
     focus:shadow-outline
      border border-gray-300
       rounded-md py-2 px-4 
       block w-full
        appearance-none
         leading-normal" type="tel"  placeholder="Numero" required>
   </div>

 <div class="mr-2 ml-2  mb-2  ">
 <select name="motivo" id="motivo" class="border-b-8 bg-transparent 
  focus:outline-none
  focus:shadow-outline 
  border border-gray-300 
  rounded-md py-2 px-4 block 
  w-full appearance-none 
  leading-normal">
  {#await data then opcion}
            {#each opcion as motivos}
            <option class="foo" value="{motivos.value}">{motivos.motivo}</option>
            {/each}
        {/await}
 </select>
 </div>


</div>
<!-- Menssae -->
<div class="mr-2 ml-2 mb-2"> 
<textarea class=" border-b-8 bg-transparent w-full
 text-left  focus:outline-none
  focus:shadow-outline border
   border-gray-300 rounded-md py-2 
   px-4 block w-auto appearance-none 
   leading-normal" placeholder="Escribe un mensaje" 
   name="mensaje" id="mensage" cols="15" rows="2" required></textarea> 
</div>

 <div class="g-recaptcha w-12 h-12" data-sitekey="6LccQKcZAAAAACaS3qJaUXEpRuXK4_9gE3RnAi8q"></div>
      <br/>

<div class="mt-6 "> 
    <input class=" justify-center text-xl
  text-white 
     hover:bg-yellow-800
      py-2 px-6 rounded-md
      enviar" type="submit" value="Enviar"> 
</div>

</form>
 </div>

<style>
.foo{
  background-color:#323232;
}
  .enviar{
        background: linear-gradient(90deg, #F09819 0%, #FF512F 100%);
    }
</style>