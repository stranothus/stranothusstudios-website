function deletePost(index, callback) {
	fetch("/api/blog", {
		method : "DELETE",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
			"index" : index
		})
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default deletePost