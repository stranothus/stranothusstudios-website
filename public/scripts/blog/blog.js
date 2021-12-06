import $create from "/scripts/create.js";
import createPost from "./createPost.js";
import editPost from "./editPost.js";
import deletePost from "./deletePost.js";
import createComment from "./createComment.js";
import editComment from "./editComment.js";
import deleteComment from "./deleteComment.js";

const jumpTo = window.location.href.match(/#([\S]+)$/);
const cookies = document.cookie.split('; ').reduce((prev, current) => {
    const [name, ...value] = current.split('=');
    prev[name] = value.join('=');
    return prev;
  }, {});
const loggedIn = cookies.token;

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
		let admin = data.splice(data.length - 1, 1)[0];
		
		data = data.reverse();

		if(admin) {
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
			
			let postElement = $create(`
				<div class = "post" id = "post-${data.length - i - 1}">
					<h2>${index.title}</h2>
					<h5>${new Date(index.date).toLocaleDateString()}</h5>
				</div>
			`);

			let markedContent = $create(`<div id = "post-content">${marked.marked(index.content)}</div>`);
			let codes = markedContent.querySelectorAll("pre code");
			
			if(codes) {
    			codes.forEach(el => {
    			    hljs.highlightElement(el);
    			});
			}
			
			postElement.appendChild(markedContent);

			for(let e = 0; e < index.comments.length; e++) {
				let endex = index.comments[e];

				let comment = $create(`
					<div class = "comment">
						<h2>${endex.name}</h2>
						<h5>${new Date(endex.date).toLocaleDateString()}</h5>
					</div>
				`);

				let markedContent = $create(`<div id = "comment-content">${marked.marked(endex.content)}</div>`);
				let codes = markedContent.querySelectorAll("pre code");
				
				if(codes) {
					codes.forEach(el => {
						hljs.highlightElement(el);
					});
				}
				
				comment.appendChild(markedContent);

				if(endex.email || admin) {
					let editButton = $create(`<button>Edit</button>`);
                
					editButton.dataset.index = JSON.stringify(index);
					editButton.dataset.endex = JSON.stringify(endex);
	
					editButton.addEventListener("click", function() {
						let i = JSON.parse(this.dataset.index);
						let e = JSON.parse(this.dataset.endex);
	
						let editCommmentElement = $create(`
							<div class = "edit-comment">
								<input type = "hidden" name = "postDate" id = "postDate" value = "${i.date}">
								<input type = "hidden" name = "commentDate" id = "commentDate" value = "${e.date}">
								<textarea id = "content">${document.createTextNode(e.content).textContent}</textarea>
							</div>
						`);
	
						editCommmentElement.classList.add("post");
	
						let saveEditElement = $create(`<button>Save edit</button>`);
	
						saveEditElement.addEventListener("click", function() {
							let p = this.parentElement;
	
							editComment({
								"postDate" : p.querySelector("#postDate").value,
								"commentDate" : p.querySelector("#commentDate").value,
								"content" : p.querySelector("#content").value
							}, setup);
						});
	
						editCommmentElement.appendChild(saveEditElement);
	
						this.parentElement.replaceWith(editCommmentElement);
					});
	
					comment.prepend(editButton);
	
	
					let deleteButton = $create(`<button>Delete</button>`);
	
					deleteButton.dataset.postDate = index.date;
					deleteButton.dataset.commentDate = endex.date;
	
					deleteButton.addEventListener("click", function() {
						deleteComment({
							"postDate": new Date(this.dataset.postDate),
							"commentDate": new Date(this.dataset.commentDate)
						}, setup);
					});
	
					comment.prepend(deleteButton);
				}
	
				postElement.appendChild(comment);
			}

			if(loggedIn) {
				let createCommentElement = $create(`
					<div id = "create-comment">
						<textarea id = "content" placeholder = "Leave a reply..."></textarea>
					</div>
				`);

				let button = $create("<button>Post</button>");

				button.dataset.date = index.date;

				button.addEventListener("click", function() {
					createComment(this.parentElement.querySelector("#content").value, this.dataset.date, setup);
				});

				createCommentElement.appendChild(button);

				postElement.appendChild(createCommentElement);
			}
            
			if(admin) {
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

					saveEditElement.dataset.date = i.date;

					saveEditElement.addEventListener("click", function() {
						let date = this.dataset.date;

						let p = this.parentElement;

						editPost({
							"title" : p.querySelector("#title").value,
							"content" : p.querySelector("#content").value,
							"topics" : p.querySelector("#topics").value,
							"date" : new Date(date)
						}, setup);
					});

					editPostElement.appendChild(saveEditElement);

					this.parentElement.replaceWith(editPostElement);
				});

				postElement.prepend(editButton);


				let deleteButton = $create(`<button>Delete</button>`);

				deleteButton.dataset.title = index.title;
				deleteButton.dataset.date = index.date;

				deleteButton.addEventListener("click", function() {
					if(confirm(`Delete "${this.dataset.title}"?`)) {
						deletePost(new Date(this.dataset.date), setup);
					}
				});

				postElement.prepend(deleteButton);
			}

			blogContent.appendChild(postElement);

            let h5 = postElement.querySelector("h5");
            let height = postElement.getBoundingClientRect().height;
            let short = h5.getBoundingClientRect().top - postElement.getBoundingClientRect().top - 50;

            postElement.style.height = short + "px";

            let expandButton = $create(`<button data-expanded="false">More</button>`);

            expandButton.addEventListener("click", function() {
                let bool = this.dataset.expanded === "true";
                let from = bool ? short : height;
                let to = bool ? height : short;

                postElement.animate([
                    { height: to + "px" },
                    { height: from + "px"}
                ], {
                    duration: 400,
                    ease: "ease-out",
                    fill: "forwards"
                });

                this.textContent = bool ? "More" : "Less";

                this.dataset.expanded = !bool;
            });

            postElement.prepend(expandButton);
            
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