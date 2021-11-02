import $create from "./create.js";

const oldFooter = document.getElementById("footer");

fetch("/api/footer")
.then(response => response.text())
.then(async data => {
    let footer = $create(data);
	oldFooter.replaceWith(footer);

	let allLinks = document.getElementById("all-links");
	let links = allLinks.getElementsByTagName("li");
	let largest = 0;

	for(let i = 0; i < links.length; i++) {
		largest = links[i].getBoundingClientRect().width > largest ? links[i].getBoundingClientRect().width : largest;
	}

	for(let i = 0; i < links.length; i++) {
		links[i].style.width = largest + "px";
	}
	
	let datas = await fetch("/api/portfolio").then(response => response.json());
	datas = datas.reverse();
	datas.splice(0, 1);
	
	for(let i = 0; i < datas.length; i++) {
	    allLinks.appendChild($create(`
	        <li><a href = "/page/project/${datas.length - i - 1}">${datas[i].title}</a></li>
	    `));
	}
	
	datas = await fetch("/api/blog").then(response => response.json());
	datas = datas.reverse();
	datas.splice(0, 1);
	
	for(let i = 0; i < datas.length; i++) {
	    allLinks.appendChild($create(`
	        <li><a href = "/page/blog#post-${i}">${datas[i].title}</a></li>
	    `));
	}
})
.catch(err => console.log(err));