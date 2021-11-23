function deleteComment(index, callback) {
	fetch("/api/comment/" + index.postDate, {
		method : "DELETE",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
			"postDate" : index.postDate,
            "commentDate" : index.commentDate
		})
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default deleteComment;