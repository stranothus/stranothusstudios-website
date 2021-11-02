const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");

const storage = multer.diskStorage({
    destination : function (req, file, cb) {
      	cb(null, __dirname + "/public/uploads");
    },
    filename : function (req, file, cb) {
      	cb(null, file.originalname);
    }
});

const app = express();
const body = express.json();
const cookies = cookieParser();
const upload = multer({ storage : storage });
const uploadArray = upload.array("file");
const route = express.static(__dirname + "/public");

app.use(body);
app.use(uploadArray);
app.use(cookies);
app.use(route);
// app.use(loggedIn);


const emailPassword = process.env["emailPassword"];
const gmail = "stranothusbot@gmail.com";
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth : {
		user : gmail,
		pass : emailPassword
	}
});

/**
 * Sends mail
 * 
 * @param mailOptions {from : string, to : string, subject : string, text : string, html : string}
 * 
 * @returns Promise<object>
 */
const sendEmail = mailOptions => {
	return new Promise((resolve, reject) => transporter.sendMail(mailOptions, (err, info) => {
		if (err) console.error(err);

		resolve(info);
	}));
};

const log = (type, log) => {
	fs.readFile(__dirname + `/logs.txt`, "utf-8", (err, content) => {
		if(err) {
			throw err;
		}

		content += `\n\n${Date()} - [${type}] ${log}`;

		fs.writeFile(__dirname + `/logs.txt`, content, () => {});
	});
} 

const projectHTML = (title, image, about, how, why) => {
	return (`
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset = "utf-8">
				<meta name = "viewport" content = "width=device-width">
				<title>${title}</title>
				<link href = "/styles/footer.css" rel = "stylesheet" type = "text/css" />
				<link href = "/styles/general.css" rel = "stylesheet" type = "text/css" />
				<link href = "/styles/project.css" rel = "stylesheet" type = "text/css" />
			</head>
			<body>
				<div id = "website-image" style = "background-image : url('${image}');"></div>
				<div id = "info-cont">
					<div class = "info-box">
						<h2>About</h2>
						<p>${about}</p>
					</div>
					<div class = "info-box">
						<h2>Why</h2>
						<p>${why}</p>
					</div>
					<div class = "info-box">
						<h2>How</h2>
						<p>${how}</p>
					</div>
				</div>
				<footer id = "footer"></footer>
				<script type = "module" src = "/scripts/footer.js"></script>
				<script type = "module" src = "/scripts/portfolio/project.js"></script>
			</body>
		</html>
	`);
}


var pageRouter = express.Router();
	app.use("/page", pageRouter);

var apiRouter = express.Router();
	app.use("/api", apiRouter);


app.get("/", (req, res) => {
	res.redirect("/page/home");
});


pageRouter.get("/home", (req, res) => {
	res.sendFile(__dirname + "/public/views/home.html");
});

pageRouter.get("/portfolio", (req, res) => {
	res.sendFile(__dirname + "/public/views/portfolio.html");
});

pageRouter.get("/contact", (req, res) => {
	res.sendFile(__dirname + "/public/views/contact.html");
});

pageRouter.get("/blog", (req, res) => {
	res.sendFile(__dirname + "/public/views/blog.html");
});

pageRouter.get("/project/:filename", (req, res) => {
	res.sendFile(`${__dirname}/public/views/project.html`);
});

pageRouter.get("/login", (req, res) => {
	log("GET", "'/page/login' loaded");
	res.sendFile(__dirname + "/public/views/login.html");
});


apiRouter.get("/nav", (req, res) => {
	res.sendFile(__dirname + "/public/resources/nav.html");
});

apiRouter.get("/footer", (req, res) => {
	res.sendFile(__dirname + "/public/resources/footer.html");
});

apiRouter.post("/contact", (req, res) => {
	var body = req.body;

	if(body.name && body.email && body.purpose && body.additional) {
		/*sendEmail({
		    service : "gmail",
			user : "stranothusbot@gmail.com",
			password : process.env["emailPassword"],
			to : "stranothus@gmail.com",
			subject : "Stranothus Studios Contact",
			content : `${body.name} has contacted you to discuss a website to ${body.purpose}. Additional information: ${body.additional}\n\nContact them at ${body.email}`
		});*/
		
		log("POST", `${body.name} has contacted you to discuss a website to ${body.purpose}. Additional information: ${body.additional}\n\nContact them at ${body.email}`);
		res.status(200).redirect("/page/contact");
	} else {
		log("FAIL", "Malformed contact email sent");
		res.status(400).send();
	}
});

apiRouter.route("/portfolio")
	.get((req, res) => {
		//get the entire portfolio database
		readDB("/portfolio.json", (err, content) => {
			if(err) throw err;

			let c = JSON.parse(content);

			c.push(req.cookies.password === process.env["admin_password"]);
			
			res.json(c);
		});
	})
	.post((req, res) => {
		//create a new portfolio post or edit an old one
		let body = req.body;
		console.log(body.index);
		if(req.loggedIn && req.files && body.title && body.link && body.about && body.why && body.how && !body.index) {
			let index = 0;
			updateDB("/portfolio.json",
				contents => {
					index = contents.length;

					contents.push({
						"image" : req.files[0].path.replace(/^([a-zA-Z\/\-]+?)\/public/, ""),
						"title" : body.title,
						"link" : body.link,
						"about" : body.about,
						"why" : body.why,
						"how" : body.how
					});

					return contents;
				},
				() => {
					log("POST", "Portfolio expanded '/page/project/" + index + "'");
					res.redirect("/page/project/" + index);
				}
			);
		} else if(req.loggedIn && body.index + 1) {
			updateDB("/portfolio.json",
				contents => {
					if(contents.length > body.index) {
						let index = contents[body.index];

						log("POST", `Portfolio project '/page/project/${body.index}' of previosu construct '${JSON.stringify(index, null, 4)}' edited`);
						
						contents[body.index] = {
							"image" : !!req.files[0] ? req.files[0].path.replace(/^([a-zA-Z\/\-]+?)\/public/, "") : index.image,
							"title" : body.title || index.title,
							"link" : body.link || index.link,
							"about" : body.about || index.about,
							"why" : body.why || index.why,
							"how" : body.how || index.how
						};
					} else {
						log("FAIL", "Malformed portfolio project edit");
					}

					return contents;
				},
				() => {
					res.redirect("/page/project/" + body.index);
				}
			);
		} else {
			log("FAIL", "Malformed portfolio project edit or create");
			res.send("Failure ;-;");
		}
	})
	.delete((req, res) => {
		//delete a portfolio post
		let body = req.body;

		if(req.loggedIn && body.index + 1) {
			updateDB("/portfolio.json",
				contents => {
					if(contents.length > body.index) {
						log("DELETE", `Portfolio project of construct '${JSON.stringify(contents[body.index], null, 4)}' deleted`)
						contents.splice(body.index, 1);
					} else {
						log("FAIL", "Malformed portfolio project delete");
					}

					return contents;
				},
				() => {
					res.send("Success!");
				}
			)
		} else {
			log("FAIL", "Malformed portfolio project delete");
			res.send("Failure ;-;");
		}
	});

apiRouter.route("/blog")
	.get((req, res) => {
		//get the entire blog database
		readDB("/blog.json", (err, content) => {
			if(err) throw err;

			let c = JSON.parse(content);

			c.push(req.loggedIn);

			res.json(c);
		});
	})
	.put((req, res) => {
		//edit a blog post
		let body = req.body;

		if(req.loggedIn && body.title && body.topics && body.content && body.index + 1) {
			updateDB("/blog.json",
				contents => {
					if(contents.length > body.index && body.index > 0) {
						log("PUT", `Blog post '${body.index}' of previous construct '${JSON.stringify(contents[body.index], null, 4)}' edited`);
						contents[body.index] = {
							"title" : body.title,
							"date" : contents[body.index].date,
							"content" : body.content,
							"topics" : body.topics.split(/,\s*/)
						}
					} else {
						log("FAIL", "Malformed blog post edit");
					}

					return contents;
				},
				() => {
					log("FAIL", "Malformed blog post edit");
					res.send("Success!");
				}
			);
		} else {
			log("FAIL", "Malformed blog post edit");
			res.send("Failure ;-;");
		}
	})
	.post((req, res) => {
		//create a new blog post
		let body = req.body;
		
		if(req.loggedIn && body.title && body.topics && body.content) {
			updateDB("/blog.json",
				contents => {
					contents.push({
						"title" : body.title,
						"date" : new Date(),
						"content" : body.content,
						"topics" : body.topics.split(/,\s*/)
					});

					return contents;
				},
				() => {
					log("POST", `Blog post created`);
					res.send("Success!");
				}
			);
		} else {
			log("FAIL", "Malformed blog post create");
			res.send("Failure ;-;");
		}
	})
	.delete((req, res) => {
		//delete a blog post
		let body = req.body;

		if(req.loggedIn && body.index + 1) {
			updateDB("/blog.json",
				contents => {
					if(contents.length > body.index) {
						log("DELETE", `Blog post of previous construct '${JSON.stringify(contents[body.index], null, 4)}' deleted`);
						contents.splice(body.index, 1);
					} else {
						log("FAIL", "Malformed blog post delete");
					}

					return contents;
				},
				() => {
					res.send("Success!");
				}
			)
		} else {
			log("FAIL", "Malformed blog post delete");
			res.send("Failure ;-;");
		}
	});

apiRouter.post("/login", (req, res) => {
	let body = req.body;

	if(body.password === process.env["admin_password"] && body.securityQuestionDog === process.env["dog"] && body.securityQuestionOrigin === process.env["origin"]) {
		log("POST", "Login success");
		res.cookie("password", body.password);
	} else {
		log("POST", `Login attempt failed with password input '${body.password}' and secruity answers '${body.securityQuestionDog}' and '${body.securityQuestionOrigin}'`);
	}

	res.redirect("/page/home");
});

apiRouter.get("/logout", (req, res) => {
	log("GET", "Logout");
	res.clearCookie("password");
	res.redirect("/page/home");
});


app.listen("8080", err => {
	if(err) throw err;
	log("N/A", "Server restarted");
	console.log("Listening");
});