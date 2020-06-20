        
<nav class="
        fixed
        w-full h-16
        z-40
        flex justify-around items-center
        bg-white
        shadow-2xl

        md:w-1/2 
        md:h-12 
        md:mt-4
        
        md:rounded-full
        
        lg:w-2/4 
        xl:w-1/3">  
    
    <a class="
        transform scale-150 md:transform scale-100" 
        href="#header">
        <img src="./src/img/assets/logo.svg" alt=""> 
    </a>
    
    <span class="
            fixed sm:hidden 
            flex flex-col justify-evenly items-center
            w-12 h-12
            top-0 right-0 
            m-2 
            cursor-pointer z-50 {toggle ? 'close' : ''}" 
            on:click={()=>toggle=!toggle}>
    </span>
    
    <div class="
            fixed sm:relative 
            flex flex-col sm:flex-row justify-around items-center
            w-40 sm:h-auto sm:w-3/4
            top-0 right-0
            mt-20 mr-4 sm:m-0
            overflow-hidden transition-all duration-300
            bg-white rounded-md h-0 {toggle ? 'h-64' : 'h-0'}">
        <a href="#nosotros">nosotros</a>
        <a href="#productos">productos</a>
        <a href="#clientes">clientes</a>
        <a href="#contacto">contacto</a>
    </div>

</nav>
<script>
    let toggle;
</script>
<style>
    a,a:hover,a:visited{
        @apply text-gray-700;
    }
    span::before, span::after{
        content         : "";
        width           : 80%;
        height          : .3rem;
        border-radius   : 1rem;
        display         : block;
        background-color: #838383;
        transform       : rotate(0);
        transition      : transform .3s ease-in-out;
    }
    .close::before, .close::after{
        background-color: red;
    }
    .close::before{
        transform: rotate(-45deg) translateY(.8rem);
    }
    .close::after{
        transform: rotate(45deg) translateY(-.8rem);
    }
</style>

