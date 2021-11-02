function createPost(callback) {
	let title = document.getElementById("title");
	let topics = document.getElementById("topics");
	let content = document.getElementById("content");

	fetch("/api/blog", {
		method : "POST",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
			"title" : title.value,
			"topics" : topics.value,
			"content" : content.value
		})
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default createPost