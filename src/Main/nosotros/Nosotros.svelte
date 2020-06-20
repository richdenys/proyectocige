<script>
    import Title from '../../Title.svelte';
    let title    = "Nosotros";
    let src      = "./src/img/assets/title.svg";
    let producto = "./src/img/assets/Productos-icon.svg";
</script>

<div id="nosotros" class="contenedor">

  <!-- nosotros e imagen -->
  <Title {title}/>
  <!--contenedor descripcion de venta -->
  <div class=" block sm:flex ">
    <div class="flex-1 mr-3 mt-10 w-auto h-auto ">
      <div class=" m-auto sm:mr-0 lg:mr-0 w-64 h-auto ">
        <h2 class="text-white text-center text-4xl">
          Sistema ERP a gran medida
        </h2>
        <p class="mt-6  text-center sm:text-left text-white">
          Es una solucion de software
          de gestion empresarial
          referencia a nivel nacional.
          Accesible y facil de usar,
          pensada especificamente
          para las pequeñas y
          medianas empresas.
        </p>
      </div>
    </div>
    <div class="bg-white mt-24 w-2 h-56 rounded-full hidden sm:block " />
    <div class="flex-1 ml-3 w-auto h-auto">
      <div class="m-auto mt-16 sm:ml-0 lg:ml-0 w-64 h-auto">
        <p class="text-white ml-4 ">
          La empresa especialidad de la empresa se caracteriza en el desarrollo
          de software a medida y aplicaciones moviles.
        </p>
      </div>
      <div class="m-auto sm:ml-0 lg:ml-0 w-64 h-auto ">
        <img src={producto} alt="" class="mt-4 ml-0 sm:ml-6 mb-2" />
      </div>
    </div>
  </div>
</div>
