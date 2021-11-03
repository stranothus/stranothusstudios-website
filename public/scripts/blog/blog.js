import $create from "/scripts/create.js";
import createPost from "./createPost.js";
import editPost from "./editPost.js";
import deletePost from "./deletePost.js";

const jumpTo = window.location.href.match(/#([\S]+)$/);

function setup() {
	fetch("/api/blog", {
		method : "GET"
	})
	.then(response => response.json())
	.then(data => {
		let blogNav = document.getElementById("blog-nav");
		let blogContent = document.getElementById("blog-content");

		blogNav.innerHTML = "";
		blogContent.innerHTML = "";

		let topics = {};
		let loggedIn = data.splice(data.length - 1, 1)[0];
		
		data = data.reverse();

		if(loggedIn) {
			let createPostElement = $create(`
				<div id = "create-post">
					<input type = "text" id = "title" placeholder = "Title...">
					<input type = "text" id = "topics" placeholder = "Topics...">
					<textarea id = "content" placeholder = "Content..."></textarea>
				</div>
			`);

			let button = $create("<button>Post</button>");

			button.addEventListener("click", function() {
				createPost(setup);
			});

			createPostElement.appendChild(button);

			blogContent.appendChild(createPostElement);
		}
		
		for(let i = 0; i < data.length; i++) {
			let index = data[i];

			index["i"] = data.length - i - 1;

			let markedContent = $create(`<div id = "post-content">${marked.marked(index.content)}</div>`);
			let codes = markedContent.querySelectorAll("pre code");
			
			if(codes) {
    			codes.forEach(el => {
    			    hljs.highlightElement(el);
    			});
			}
			
			let postElement = $create(`
				<div class = "post" id = "post-${data.length - i - 1}">
					${loggedIn ? `
					` : ``}
					<h2>${index.title}</h2>
					<h5>${new Date(index.date).toLocaleDateString()}</h5>
				</div>
			`);
			
			postElement.appendChild(markedContent);
            
			if(loggedIn) {
				let editButton = $create(`<button>Edit</button>`);
                
				editButton.dataset.index = JSON.stringify(index);

				editButton.addEventListener("click", function() {
					let i = JSON.parse(this.dataset.index);

					let editPostElement = $create(`
						<div class = "edit-post">
							<input type = "text" name = "title" id = "title" value = "${i.title}">
							<input type = "text" name = "topics" id = "topics" value = "${i.topics.join(", ")}">
							<textarea id = "content">${document.createTextNode(index.content).textContent}</textarea>
						</div>
					`);

					editPostElement.classList.add("post");

					let saveEditElement = $create(`<button>Save edit</button>`);

					saveEditElement.dataset.index = index.i;

					saveEditElement.addEventListener("click", function() {
						let index = Number(this.dataset.index);

						let p = this.parentElement;

						editPost({
							"title" : p.querySelector("#title").value,
							"content" : p.querySelector("#content").value,
							"topics" : p.querySelector("#topics").value,
							"i" : index
						}, setup);
					});

					editPostElement.appendChild(saveEditElement);

					this.parentElement.replaceWith(editPostElement);
				});

				postElement.prepend(editButton);


				let deleteButton = $create(`<button>Delete</button>`);

				deleteButton.dataset.title = index.title;
				deleteButton.dataset.index = index.i;

				deleteButton.addEventListener("click", function() {
					if(confirm(`Delete "${this.dataset.title}"?`)) {
						deletePost(this.dataset.index, setup);
					}
				});

				postElement.prepend(deleteButton);
			}

			blogContent.appendChild(postElement);
			
			let postContent = postElement.querySelector("#post-content");
			let anchors = postContent.querySelectorAll("a");

			anchors.forEach(anchor => {
			    if(anchor.getAttribute("href").startsWith("#")) {
    			    anchor.addEventListener('click', function (e) {
    					e.preventDefault();
                        
    					document.querySelector(this.getAttribute('href')).scrollIntoView({
    						behavior: 'smooth'
    					});
    				});
			    }
			});

			for(let e = 0; e < index.topics.length; e++) {
				if(typeof topics[index.topics[e]] === "undefined") {
					let folder = $create(`
						<div class = "topics-folder">
							<h3>${index.topics[e]}</h3>
						</div>
					`);

					topics[index.topics[e]] = folder;

					blogNav.appendChild(folder);
				}

				let topic = $create(`<a href = "#post-${data.length - i - 1}">${index.title}</a>`);

				topic.addEventListener('click', function (e) {
					e.preventDefault();

					document.querySelector(this.getAttribute('href')).scrollIntoView({
						behavior: 'smooth'
					});
				});

				topics[index.topics[e]].appendChild(topic);
			}
		}

		if(jumpTo) {
			window.scrollTo({
				top : document.querySelector(jumpTo[0]).getBoundingClientRect().top,
				left : 0,
				behavior : 'smooth'
			});
		}
	})
	.catch(err => console.log(err));
}


setup();