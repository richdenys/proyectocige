<script>
import Oficinas from './oficina.svelte';
let separdor = "./src/img/assets/Separacion.svg";
</script>
<div class="  block   md:flex">
<div class="w-full  rounded-sm" >
<!-- <img class="w-0 sm:w-0 sm:h-20 md:w-auto sm:h-56  " src={separdor} alt=""> -->
<iframe  class="rounded-sm w-full"
src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62418.383387788665!2d-77.1070309738381!3d-12.101952974089011!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105b7edfc6a8fe5%3A0x67535396ad9927e2!2sJr.%20Alfonso%20Ugarte%20340%2C%20Cercado%20de%20Lima%2015063!5e0!3m2!1ses!2spe!4v1591595893125!5m2!1ses!2spe"
 width="350" height="300" frameborder="0" style="border:0;" allowfullscreen="" aria-hidden="false" tabindex="0"></iframe>

</div>
<div class="w-full">
<Oficinas/>
</div>
</div>
<style>
 
</style>