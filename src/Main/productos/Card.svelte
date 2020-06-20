<script>
    export let datos = {};  
    function agregar(){
        let modal= document.getElementById("modal");
        modal.style.display="block"
        let data=`
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
                close
                fixed
                left-0 top-0
                flex justify-center items-center 
                w-10 h-10 
                m-4
                bg-red-500 
                rounded-full 
                cursor-pointer 
                text-white text-3xl">
        X</div>
        <h3 class="w-full text-center text-3xl text-orange-400 ">${datos.title}</h3>
        <span class="p-6 w-full md:px-40 lg:px-64 text-center">${datos.description}</span>
        <iframe class="w-screen h-screen-1/4 md:w-1/2 md:h-video"
                src="https://www.youtube.com/embed/${datos.video.slice(-11)}?controls=0">
        </iframe>

        <h3 class="w-full m-6 text-center text-2xl text-orange-400">Beneficios:</h3>
        <ul class="p-8 md:w-2/3 xl:w-2/4">`;
        
        for(let i in datos.beneficios){
                data += `<li class="text-left"> <i class="text-orange-400 text-2xl"> ${parseInt(i)+1} </i>` 
                + datos.beneficios[i] + "</li>" + "<br/>";
        }
        data+=`</ul>
        <div class="w-full p-10 text-2xl text-center bg-orange-400">
                <a class="archive text-white" href="${datos.archive}" target="_blank">
                        Descargar mas información &laquo
                </a>    
        </div>
        </section>`;
        modal.innerHTML=data;
    }

    (()=>{modal.addEventListener('click',close)})();
    function close(e) {
        e.preventDefault();
        if (e.target.classList[0] === "close"){
                this.style.display="none"
        }
        if (e.target.classList[0] === "archive"){
                window.open(e.target.href, '_blank')
        }

        }

</script>
<article class="
        flex flex-col 
        w-2/3 h-64 h-auto 
        m-4
        bg-gray-100 
        rounded-md 
        shadow-xl
                                                                
        transform scale-100 shadow-xl
        transition-transform transition-shadow duration-700 
        hover: cursor-pointer hover:scale-105

        sm:flex-row
        sm:h-48 
        
        md:w-2/5

        lg:h-48
        lg:my-8
        lg:m-1
        
        xl:w-1/4
        xl:h-40" on:click={agregar}>

        <img class="w-full h-42 sm:h-full sm:w-1/2" 
        src="{datos.img}" 
        alt="{datos.alt}">
        
        <section class="
                flex flex-col justify-center
                w-full h-32 max-h-full sm:h-full sm:w-1/2
                px-4">

                <h2 class="
                        my-2 h-auto
                        text-center 
                        text-gray-700 text-xl
                        lg:text-xl">   
                {datos.title}
                </h2>

                <div class="
                        w-full h-auto
                        text-center
                        text-gray-600 
                        text-sm 
                        lg:text-sm">
                {datos.description.substring(40,-1)}...
                </div>

        </section>
</article>
<style>
        /*
                <iframe 
                        src="https://www.youtube.com/embed/2FMlQUwyL1U"
                        frameborder="0" 
                        allow="accelerometer; 
                        autoplay; encrypted-media; 
                        gyroscope; picture-in-picture" allowfullscreen>
                </iframe>
        */
</style>