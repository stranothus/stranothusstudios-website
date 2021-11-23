function editComment(index, callback) {
	fetch("/api/comment/" + index.postDate, {
		method : "PUT",
		headers : {
			"Content-Type" : "application/json"
		},
		body : JSON.stringify({
            "postDate" : index.postDate,
            "commentDate" : index.commentDate,
            "content" : index.content
        })
	})
	.then(response => {
		callback();
	})
	.catch(err => console.log(err));
}

export default editComment