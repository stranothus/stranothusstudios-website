function editPost(index, callback) {
	fetch("/api/blog", {
		method : "PUT",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
			"title" : index.title,
			"topics" : index.topics,
			"content" : index.content,
			"index" : index.i
		})
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default editPost