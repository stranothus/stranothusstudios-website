document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if(anchor.getAttribute("href")) {
        anchor.onclick = function(e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        };
    }
});