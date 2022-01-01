import $create from "/scripts/create.js";

const projectIndex = window.location.href.split("/").reverse()[0];

function setup() {
	fetch("/api/portfolio", {
		method : "GET"
	})
	.then(response => response.json())
	.then(data => {
		let index = data[projectIndex];
		let loggedIn = data.splice(data.length - 1, 1)[0];
		
		let headerImage = document.getElementById("header-image");
		let headerStuff = $create(`<div id = "header-stuff"><a href = "${index.link}" target = "_blank"><h1>${index.title}</h1></a></div>`);
		let about = document.getElementById("about");
		let why = document.getElementById("why");
		let how = document.getElementById("how");

		headerImage.style.backgroundImage = `url(\'${index.image.replace(/^\S+\/public\//i, "/")}\'`;

		headerImage.parentElement.nextSibling.before(headerStuff);

		let aboutP = $create(`<p>${index.about}</p>`);
		about.appendChild(aboutP);

		let whyP = $create(`<p>${index.why}</p>`);
		why.appendChild(whyP);

		let howP = $create(`<p>${index.how}</p>`);
		how.appendChild(howP);

		if(loggedIn) {
			let deleteButton = $create(`<button data-date = "${data[projectIndex].date}">Delete</button>`);
			deleteButton.addEventListener("click", function() {
				if(confirm(`Delete ${index.title}?`)) {
					fetch("/api/portfolio", {
						method : "DELETE",
						headers : {
							"Content-Type" : "application/json"
						},
						body : JSON.stringify({
							date : this.dataset.date
						})
					}).then(response => {
						window.location.href = "/page/portfolio";
					})
				}
			});
			document.body.firstElementChild.nextElementSibling.before(deleteButton);

			let editButton = $create(`<button data-date = "${data[projectIndex].date}">Edit</button>`);
			editButton.addEventListener("click", function() {
				let editForm = $create(`
					<form action = "/api/portfolio" method = "POST" enctype = "multipart/form-data" id = "form">
						<input type = "hidden" value = "${this.dataset.date}" name = "date">
						<input type = "file" name = "file">
						<input type "text" name = "title" placeholder = "Title">
						<input type "text" name = "link" placeholder = "Link">
						<textarea name = "about" placeholder = "About"></textarea>
						<textarea name = "why" placeholder = "Why"></textarea>
						<textarea name = "how" placeholder = "How"></textarea>
						<button type = "submit">Edit</button>
					</form>
				`);

				let cancelEdit = $create(`<button type = "button">Cancel</button>`);
				cancelEdit.addEventListener("click", function() {
					document.body.removeChild(editForm);
				}, { once : true });
				editForm.appendChild(cancelEdit);

				document.body.prepend(editForm);
			});
			document.body.firstElementChild.nextElementSibling.before(editButton);
		}
	})
	.catch(err => console.log(err));
}

setup();