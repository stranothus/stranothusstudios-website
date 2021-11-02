import $create from "/scripts/create.js";


function setup() {
	fetch("/api/portfolio", {
		method : "GET"
	})
	.then(response => response.json())
	.then(data => {
		let portfolio = document.getElementById("portfolio");

		let loggedIn = data.splice(data.length - 1, 1)[0];
		
		for(var i = 0; i < data.length; i++) {
			let project = $create(`
				<a href = "/page/project/${i}" class = "project">
					<div>
						<h2>${data[i].title}</h2>
					</div>
				</a>
			`);
            
			project.style.backgroundImage = `url(\'${data[i].image.replace(/^\S+\/public\//i, "/")}\')`;

			portfolio.appendChild(project);
		}

		if(loggedIn) {
			let createProject = $create(`<a class = "project" id = "create-project"></a>`);
			portfolio.appendChild(createProject);
			createProject.addEventListener("click", function() {
				let createForm = $create(`
					<form action = "/api/portfolio" method = "POST" enctype = "multipart/form-data" id = "form">
						<input type = "file" name = "file" required>
						<input type "text" name = "title" placeholder = "Title" required>
						<input type "text" name = "link" placeholder = "Link" required>
						<textarea name = "about" placeholder = "About" required></textarea>
						<textarea name = "why" placeholder = "Why" required></textarea>
						<textarea name = "how" placeholder = "How" required></textarea>
						<button type = "submit">Create</button>
					</form>
				`);

				let cancelCreate = $create(`<button type = "button">Cancel</button>`);
				cancelCreate.addEventListener("click", function() {
					document.body.removeChild(createForm);
				}, { once : true });
				createForm.appendChild(cancelCreate);

				document.body.prepend(createForm);
			});
		}
	})
	.catch(err => console.log(err));
}

setup();