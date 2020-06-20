<script>
    export let cliente={};
</script>

<article class="m-2 bg-gray-100
        transform scale-100 shadow-2xl
        transition-transform transition-shadow duration-700 
        hover: cursor-pointer hover:scale-105
">
  <img class="w-42 h-42 " 
        src="{cliente.img}" 
        alt="{cliente.alt}">
</article>
