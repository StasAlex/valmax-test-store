document.addEventListener("DOMContentLoaded", function(){
    new Swiper(".x-video-swiper", {
        loop: true,
        autoplay: {
            enabled: true,
            delay: 5000,
        },
        slidesperView: 1,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
    });
});