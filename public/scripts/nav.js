import $create from "./create.js";

var nav = document.getElementById("nav");

fetch("/api/nav")
.then(response => response.text())
.then(data => {
	let newNav = $create(data);

	nav.replaceWith(newNav);
	window.scroll(0, 0);
})
.catch(err => console.log(err));