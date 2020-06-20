<script>  
    import Title from '../Title.svelte';
    import Email from './Email.svelte';
    import Estadis from './Estadis.svelte';
    import Separa from './Separador.svelte';
    
    let title    = "Contacto";
    let bg_total = "bg-blue-700";
    let facebook="./src/img/assets/Facebook.svg";
    let instagram ="./src/img/assets/Instagram.svg";
    let youtube="./src/img/assets/Youtube.svg";
    let whatsapp='./src/img/assets/whatsapp.svg';

      window.fbAsyncInit = function() {
          FB.init({
            xfbml            : true,
            version          : 'v7.0'
          });
        };

        (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = 'https://connect.facebook.net/es_ES/sdk/xfbml.customerchat.js';
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
</script>


<footer id="contacto" class="w-full pt-8 ">

<Estadis/>
<div  class="foo -mt-1 w-full pt-8 ">
 <Title  {title}/>
</div>
  
<div class="foo   block  sm:block lg:flex -mb-1 ">
  <div class=" block sm:block lg:flex mx-auto mr-2">
    <Separa/>
    <Email/>
  </div>
    
</div>


  <div class="foo block sm:flex text-gray-300 ">
<div class="flex-1  sm:mt-8  ">
<div class="block sm:flex content-end">

<div class="flex  flex-1 pt-4 justify-center sm:order-1  ">
    <p class="">
      Encuéntranos en :
    </p>
    <div class="ml-1  w-6 h-6 rounded-full hover:bg-blue-600"><a href="https://www.facebook.com/cige.erp/" target="_black"> <img src={facebook} alt=""></a></div>
   <div  class="ml-1 w-6  h-6 rounded-full hover:bg-pink-800"><img src={instagram} alt=""></div>
   <div  class="ml-1 w-6 rounded-full  h-6 hover:bg-red-600"><img src={youtube} alt=""></div>

</div>

<div class=" sm:flex-1 ">
<p class="pt-4 text-center sm:text-left sm:justify-start">COPYRIGHT © CIGE PERU S.A. - 2020</p>
</div>

</div>

</div>
  </div>

<a class="whatsapp" target="_black" href="https://api.whatsapp.com/send?phone=51991172554&text=Hola!%20%C2%BFC%C3%B3mo%20podemos%20ayudarte?.%20">
<img class="" src={whatsapp} alt="">
</a>
<!-- Load Facebook SDK for JavaScript -->
      <div id="fb-root"></div>

      <!-- Your Chat Plugin code -->
      <div class="fb-customerchat"
        attribution=setup_tool
        page_id="110594707260375"
  theme_color="#0084ff"
  logged_in_greeting="Hola! ¿Cómo podemos ayudarte?"
  logged_out_greeting="Hola! ¿Cómo podemos ayudarte?">
      </div>

</footer>
<style>
.whatsapp{
position: fixed;
right: 26px;
bottom:86px;
width: 50px;
z-index: 1000;
}
.whatsapp img{
width: 100%;
height: auto;
}
.foo{
  background-color:#323232;
}
</style>