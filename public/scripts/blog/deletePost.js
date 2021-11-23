function deletePost(date, callback) {
	fetch("/api/blog", {
		method : "DELETE",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
			"date" : date
		})
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default deletePost;