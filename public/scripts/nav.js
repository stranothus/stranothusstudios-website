import $create from "./create.js";
import configCookies from "./cookieSplit.js";

const nav = document.getElementById("nav");

fetch("/api/nav")
.then(response => response.text())
.then(data => {
	const newNav = $create(data);

	nav.replaceWith(newNav);
	window.scroll(0, 0);

    const cookies = configCookies();

    if(cookies.token) return;

    const linksCont = newNav.querySelector("#top-nav");

    linksCont.appendChild($create(`<li><a href = "/page/signup">Sign up</a></li>`));

})
.catch(err => console.log(err));