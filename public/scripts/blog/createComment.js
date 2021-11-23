function createComment(content, date, callback) {
	fetch("/api/comment/" + date, {
		method : "POST",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
			"postDate" : date,
			"content" : content
		})
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default createComment