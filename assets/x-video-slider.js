document.addEventListener("DOMContentLoaded", function(){
    new Swiper(".x-video-swiper", {
        loop: true,
        slidesperView: 1,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
    });
});