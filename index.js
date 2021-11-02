const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const { genSalt, genHash, checkHash } = require("./utils/hash.js");
const { c } = require("tar");

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
const loggedIn = (req, res, next) => {
	if(req.cookies.token) {
		req.token = jwt.verify(req.cookies.token, process.env.TOKEN_SECRET);
	}

	next();
}

app.use(body);
app.use(uploadArray);
app.use(cookies);
app.use(loggedIn);
app.use(route);
// app.use(loggedIn);


const emailPassword = process.env["emailPassword"];
const gmail = "stranothusbot@gmail.com";
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth : {
		user : process.env.EMAIL_NAME,
		pass : process.env.EMAIL_PASS
	}
});

const client = new Promise((resolve, reject) => {
	MongoClient.connect("mongodb+srv://stranothus:<password>@cluster0.yp9al.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
		{
			useNewUrlParser: true,
			useUnifiedTopology: true
		},
		(err, client) => {
			if(err) console.err(err);

			resolve(client);
		}
	);
}).then(client => { return client; });

/**
 * Reads a database and returns the results of a query asynchronously
 * 
 * @param {string} db - the database to search
 * 
 * @param {string} coll - the collection of the database to search
 * 
 * @param {object} query - the query to use for the search
 * 
 * @returns {Promise<array>} results - the documents found from the query
 */
async function readDB(db, coll, query) {
	return new Promise((resolve, reject) => {
		client.db(db).collection(coll).find(query).toArray((err, results) => {
			if(err) console.error(err);

			resolve(results);
		});
	}).then(results => { return results; });
}


/**
 * Sends mail using the specified mailOptions
 * 
 * @param {{from : string, to : string, subject : string, text : string, html : string}} mailOptions - set of options to specify what to mail who
 * 
 * @returns {Promise<object>} Info - informations on the sent mail
 */
const sendEmail = async mailOptions => {
	return new Promise((resolve, reject) => transporter.sendMail(mailOptions, (err, info) => {
		if (err) console.error(err);

		resolve(info);
	}));
};

/**
 * Logs an event to logs.txt
 * 
 * @param {string} type - the type of event to log
 * 
 * @param {string} log - the log contents
 * 
 * @returns {void} void
 */
const log = (type, log) => {
	fs.readFile(__dirname + `/logs.txt`, "utf-8", (err, content) => {
		if(err) {
			throw err;
		}

		content += `\n\n${Date()} - [${type}] ${log}`;

		fs.writeFile(__dirname + `/logs.txt`, content, () => {});
	});
};

/**
 * Creates the HTML code for a portfolio project
 * 
 * @param {string} title - the title of the project
 * 
 * @param {string} image - link to the project image
 * 
 * @param {string} about - about the project
 * 
 * @param {string} how - how the project was developed
 * 
 * @param {string} why - why the project was developed
 * 
 * @returns {void} void
 */
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
};


var pageRouter = express.Router();
	app.use("/page", pageRouter); // create the page router

var apiRouter = express.Router();
	app.use("/api", apiRouter); // create the api router


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

apiRouter.post("/sign-up", async (req, res) => {
    let body = req.body;

    if(body.email && body.name && body.password && body.confirmPassword) {
        if(!body.email.match(/[a-z0-9!#$%&'*+/=?^_\`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
            // invalid email
            res.status(400).redirect("back");
        } else if(body.password !== body.confirmPassword) {
            // nonmatching passwords
            res.status(400).redirect("back");
        } else if(!/[A-Z].*[A-Z]/.test(body.password) || !/[0-9].*[0-9]/.test(body.password) || body.password.length < 8) {
            // weak password (must have at least 2 uppercase letters and 2 digits with a total password length of 8 or more characters)
            res.status(400).redirect("back");
        } else {
			if((await readDB("Visitors", "Accounts", { "email" : body.email })).length) {
				res.redirect("/pages/login");
				return;
			}
			if((await readDB("Visitors", "Banned", { "ip" : req.socket.remoteAddress })).length) {
				res.send("No you are bad and banned have a horrible life");
				return;
			}


			// create account
			let salt = await genSalt(Math.floor(Math.random() * 10));
			let hash = await genHash(body.password, salt);

			let userObj = {
				hash: hash,
				email: body.email,
				name: body.name,
				created: new Date(),
				confirmed: false,
				ip: req.socket.remoteAddress
			};

			client.db("Visitors").collection("Accounts").insertOne(userObj, (err, result) => {
				if(err) console.error(err);

				let token = jwt.sign(userObj, process.env.VERIFY_SECRET);

				sendEmail({
					from: process.env.EMAIL_NAME,
					to: body.email,
					subject: "Confirm your account",
					text: "idk confirm your account",
					html: "idk confirm your account"
				})
			});
        }
    } else {
        // missing body values
        res.status(400).redirect("/pages/sign-up");
    }
});

apiRouter.post("/contact", (req, res) => {
	var body = req.body;

	if(body.name && body.email && body.purpose && body.additional) {
		sendEmail({
		    service : "gmail",
			user : process.env.EMAIL_NAME,
			to : "stranothus@gmail.com",
			subject : "Stranothus Studios Contact",
			content : `${body.name} has contacted you to discuss a website to ${body.purpose}. Additional information: ${body.additional}\n\nContact them at ${body.email}`
		});
		res.status(200).redirect("/page/contact");
	} else {
		log("FAIL", "Malformed contact email sent");
		res.status(400).send();
	}
});

apiRouter.route("/portfolio")
	.get(async (req, res) => {
		//get the entire portfolio database
		let results = await readDB("Content", "Portfolio", {});

		results.push(req.token ? req.token.perms === "Admin" : false);

		res.json(results);
	})
	.post((req, res) => {
		//create a new portfolio post or edit an old one
		let body = req.body;

		if(req.loggedIn && req.files && body.title && body.link && body.about && body.why && body.how && !body.index) {
			if(req.token.perms !== "Admin") {
				res.send("You ain't admin");
				return;
			}
			let index = (await readDB("Content", "Portfolio", {})).length;
			client.db("Content").collection("Portfolio").insertOne({
				"image" : req.files[0].path.replace(/^([a-zA-Z\/\-]+?)\/public/, ""),
				"title" : body.title,
				"link" : body.link,
				"about" : body.about,
				"why" : body.why,
				"how" : body.how
			}, (err, result) => {
				if(err) console.error(err);

				log("POST", "Portfolio expanded '/page/project/" + index + "'");
				res.redirect("/page/project/" + index);
			});
		} else if(req.loggedIn && body.index + 1) {
			if(req.token.perms !== "Admin") {
				res.send("You ain't admin");
				return;
			}
			client.db("Content").collection("Portfolio").updateOne({ "index": body.index }, {
				...(req.files.length? { "image" : req.files[0].path.replace(/^([a-zA-Z\/\-]+?)\/public/, "") } : {}),
				...(body.title ? { "title" : body.title } : {}),
				...(body.link ? { "link" : body.link } : {}),
				...(body.about ? { "about" : body.about } : {}),
				...(body.why ? { "why" : body.why } : {}),
				...(body.how ? { "how" : body.how } : {})
			}, (err, result) => {
				if(err) console.error(err);

				log("POST", `Portfolio project '/page/project/${body.index}' edited`);
				res.redirect("/page/project/" + index);
			});
		} else {
			log("FAIL", "Malformed portfolio project edit or create");
			res.send("Failure ;-;");
		}
	})
	.delete((req, res) => {
		//delete a portfolio post
		let body = req.body;

		if(req.loggedIn && body.index + 1) {
			if(req.token.perms !== "Admin") {
				res.send("You ain't admin");
				return;
			}
			client.db("Content").collection("Portfolio").deleteOne({ "index": body.index }, (err, result) => {
				if(err) console.error(err);

				res.send("Success!");
			});
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