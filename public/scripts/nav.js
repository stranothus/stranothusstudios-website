import $create from "./create.js";

var nav = document.getElementById("nav");

fetch("/api/nav")
.then(response => response.text())
.then(data => {
	let newNav = $create(data);

	nav.replaceWith(newNav);
	window.scroll(0, 0);
	let navTop = newNav.offsetTop;

	window.addEventListener("scroll", function() {
		if(document.documentElement.scrollTop > navTop) {
			newNav.style.position = "fixed";
			newNav.style.boxShadow = "0 5px 5px 0 #000000A0";
		} else {
			newNav.style.position = "relative";
			newNav.style.boxShadow = "none";
		}
	});
	
	window.addEventListener("resize", function() {
	    let scroll = document.documentElement.getBoundingClientRect().top;
	    window.scroll(0, 0);
	    navTop = newNav.offsetTop;
	    window.scroll(0, -scroll);
	});
})
.catch(err => console.log(err));