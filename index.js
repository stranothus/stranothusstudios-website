const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const { genSalt, genHash, checkHash } = require("./utils/encrypt.js");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      	cb(null, __dirname + "/public/uploads");
    },
    filename: function (req, file, cb) {
      	cb(null, file.originalname);
    }
});

const app = express();
const body = express.json();
const cookies = cookieParser();
const upload = multer({ storage: storage });
const uploadArray = upload.array("file");
const route = express.static(__dirname + "/public");
const loggedIn = (req, res, next) => {
	if(req.cookies.token) {
		try {
			let token = jwt.verify(req.cookies.token, process.env.TOKEN_SECRET);
			req.loggedIn = token;
		} catch(err) {
			res.clearCookie("token");
			req.loggedIn = undefined;
		}
	}

	next();
}

app.use(body);
app.use(uploadArray);
app.use(cookies);
app.use(loggedIn);
app.use(route);
// app.use(loggedIn);


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
		user: process.env.EMAIL_NAME,
		pass: process.env.EMAIL_PASS
	}
});

var client = new Promise((resolve, reject) => {
	MongoClient.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yp9al.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true
		},
		(err, client) => {
			if(err) console.error(err);

			resolve(client);
		}
	);
}).then(c => { client = c; });

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
 * @param {{from: string, to: string, subject: string, text: string, html: string}} mailOptions - set of options to specify what to mail who
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
				<div id = "website-image" style = "background-image: url('${image}');"></div>
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
	res.sendFile(`${__dirname}/public/views/home.html`);
});

pageRouter.get("/portfolio", (req, res) => {
	res.sendFile(`${__dirname}/public/views/portfolio.html`);
});

pageRouter.get("/contact", (req, res) => {
	res.sendFile(`${__dirname}/public/views/contact.html`);
});

pageRouter.get("/blog", (req, res) => {
	res.sendFile(`${__dirname}/public/views/blog.html`);
});

pageRouter.get("/project/:filename", (req, res) => {
	res.sendFile(`${__dirname}/public/views/project.html`);
});

pageRouter.get("/login", (req, res) => {
	res.sendFile(__dirname + "/public/views/login.html");
});

pageRouter.get("/signup", (req, res) => {
	res.sendFile(__dirname + "/public/views/signup.html");
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
			if((await readDB("Visitors", "Accounts", { "email": body.email })).length) {
				res.redirect("/page/login");
				return;
			}
			if((await readDB("Visitors", "Banned", { "ip": req.socket.remoteAddress })).length) {
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
				perms: "user",
				ip: req.socket.remoteAddress
			};

			client.db("Visitors").collection("Accounts").insertOne(userObj, (err, result) => {
				if(err) console.error(err);

				let token = jwt.sign(userObj, process.env.VERIFY_SECRET);

				sendEmail({
					from: process.env.EMAIL_NAME,
					to: body.email,
					subject: "Confirm your account",
					text: `You're almost done! You've signed up for an account on Stranothus Studios, but you're not quite done yet. You need to verify your account by clicking the link below. ${process.env.DOMAIN}/api/verify/${token}. Didn't make an account? Someone may be trying to impersonate you. Don't worry, they can't activate their account if you don't click on the link.`,
					html: `
						<!DOCTYPE html>
						<html>
							<head>
								<meta charset = "utf-8">
								<meta name = "viewport" content = "width=device-width">
								<title>Verify your account</title>
								<style>
									body {
										background-color: #303030;
										color: #EFEFEF;
									}
									h1 {
										margin: 50px 0 75px;
										font-family: "lato", sans-serif;
										font-size: 2rem;
										text-align: center;
										color: #FAC000;
									}
									p {
										width: 50vw;
										margin: 0 auto;
										font-family: "lato", sans-serif;
										font-size: 1.1rem;
										line-height: 1.5;
									}
									div {
										width: 50vw;
										margin: 25px auto;
										font-family: "lato", sans-serif;
										font-size: 0.9rem;
										line-height: 1.5;
									}
									a {
										display: block;
										width: 25vw;
										margin: 100px auto;
										padding: 10px 0;
										font-family: "lato", sans-serif;
										font-size: 1.3rem;
										text-align: center;
										border-radius: 5px;
										background-color: #FAC000;
										color: #303030;
										text-decoration: none;
									}
								</style>
							</head>
							<body>
								<h1>You're almost done!</h1>
								<p>You've signed up for an account on Stranothus Studios, but you're not quite done yet. You need to verify your account by clicking the link below.</p>
								<a href="${process.env.PROTOCOL}${process.env.DOMAIN}/api/verify/${token}">Verify</a>
								<div>Didn't make an account? Someone may be trying to impersonate you. Don't worry, they can't activate the account if you don't click on the link.</div>
							</body>
						</html>
					`
				}).then(info => {
					res.send("Check your email to confirm your account");
				})
			});
        }
    } else {
        // missing body values
        res.status(400).redirect("/pages/sign-up");
    }
});

apiRouter.get("/verify/:token", (req, res) => {
	let params = req.params;
	let token = params.token;

	if(!token) {
		res.status(400).send();
		return;
	}
	
	token = jwt.verify(token, process.env.VERIFY_SECRET);

	if(!token) {
		res.status(400).send();
		return;
	}

	client.db("Visitors").collection("Accounts").updateOne({ "email": token.email }, { "$set": { "confirmed": true }}, (err, result) => {
		if(err) console.error(err);

		token.confirmed = true;

		let newToken = jwt.sign(token, process.env.VERIFY_SECRET);

		res.cookie("token", newToken);
		res.redirect("/page/home");
	});
});

apiRouter.post("/contact", (req, res) => {
	var body = req.body;

	if(body.name && body.email && body.purpose && body.additional) {
		sendEmail({
		    service: "gmail",
			user: process.env.EMAIL_NAME,
			to: "stranothus@gmail.com",
			subject: "Stranothus Studios Contact",
			content: `${body.name} has contacted you to discuss a website to ${body.purpose}. Additional information: ${body.additional}\n\nContact them at ${body.email}`
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

		results.push(req.loggedIn ? req.loggedIn.perms === "admin" : false);

		res.json(results);
	})
	.post(async (req, res) => {
		//create a new portfolio post or edit an old one
		let body = req.body;

		if(req.loggedIn && req.files && body.title && body.link && body.about && body.why && body.how && !body.created) {
			if(req.loggedIn.perms !== "admin") {
				res.send("You ain't admin");
				return;
			}
			let index = (await readDB("Content", "Portfolio", {})).length;
			client.db("Content").collection("Portfolio").insertOne({
				"image": req.files[0].path.replace(/^([a-zA-Z\/\-]+?)\/public/, ""),
				"title": body.title,
				"link": body.link,
				"about": body.about,
				"why": body.why,
				"how": body.how,
				"date": new Date()
			}, (err, result) => {
				if(err) console.error(err);

				log("POST", "Portfolio expanded '/page/project/" + index + "'");
				res.redirect("/page/project/" + index);
			});
		} else if(req.loggedIn && body.date) {
			if(req.loggedIn.perms !== "admin") {
				res.send("You ain't admin");
				return;
			}

			client.db("Content").collection("Portfolio").updateOne({ "date": new Date(body.date) }, { "$set": {
				...(req.files.length? { "image": req.files[0].path.replace(/^([a-zA-Z\/\-]+?)\/public/, "") }: {}),
				...(body.title ? { "title": body.title } : {}),
				...(body.link ? { "link": body.link } : {}),
				...(body.about ? { "about": body.about } : {}),
				...(body.why ? { "why": body.why } : {}),
				...(body.how ? { "how": body.how } : {})
			}}, (err, result) => {
				if(err) console.error(err);

				log("POST", `Portfolio project '/page/project/${body.index}' edited`);
				res.redirect("back");
			});
		} else {
			log("FAIL", "Malformed portfolio project edit or create");
			res.send("Failure ;-;");
		}
	})
	.delete((req, res) => {
		//delete a portfolio post
		let body = req.body;

		if(req.loggedIn && body.date) {
			if(req.loggedIn.perms !== "admin") {
				res.send("You ain't admin");
				return;
			}
			client.db("Content").collection("Portfolio").deleteOne({ "date": new Date(body.date) }, (err, result) => {
				if(err) console.error(err);

				res.send("Success!");
			});
		} else {
			log("FAIL", "Malformed portfolio project delete");
			res.send("Failure ;-;");
		}
	});

apiRouter.route("/blog")
	.get( async (req, res) => {
		//get the entire portfolio database
		let results = await readDB("Content", "Blog", {});

		results.push(req.loggedIn ? req.loggedIn.perms === "admin" : false);

		res.json(results);
	})
	.put((req, res) => {
		//edit a blog post
		let body = req.body;

		if(req.loggedIn && body.title && body.topics && body.content && body.date) {
			if(req.loggedIn.perms !== "admin") {
				res.send("You ain't admin");
				return;
			}

			client.db("Content").collection("Blog").updateOne({ "date": new Date(body.date) }, { "$set": {
				"title": body.title,
				"content": body.content,
				"topics": body.topics.split(/,\s*/)
			}}, (err, result) => {
				if(err) console.error(err);

				log("POST", `Blog post edited`);
				res.send("Success!");
			});
		} else {
			log("FAIL", "Malformed blog post edit");
			res.send("Failure ;-;");
		}
	})
	.post((req, res) => {
		//create a new blog post
		let body = req.body;
		
		if(req.loggedIn && body.title && body.topics && body.content) {
			if(req.loggedIn.perms !== "admin") {
				res.send("You ain't admin");
				return;
			}
	
			client.db("Content").collection("Blog").insertOne({
				"title": body.title,
				"date": new Date(),
				"content": body.content,
				"topics": body.topics.split(/,\s*/)
			}, (err, result) => {
				if(err) console.error(err);
	
				log("POST", `Blog post created`);
				res.send("Success!");
			});
		} else {
			log("FAIL", "Malformed blog post create");
			res.send("Failure ;-;");
		}
	})
	.delete((req, res) => {
		//delete a blog post
		let body = req.body;

		if(req.loggedIn && body.date) {
			if(req.loggedIn.perms !== "admin") {
				res.send("You ain't admin");
				return;
			}
			client.db("Content").collection("Blog").deleteOne({ "date": new Date(body.date) }, (err, result) => {
				if(err) console.error(err);

				log("DELETE", `Blog post deleted`);
				res.send("Success!");
			});
		} else {
			log("FAIL", "Malformed blog post delete");
			res.send("Failure ;-;");
		}
	});

apiRouter.post("/login", async (req, res) => {
	let body = req.body;

	if(body.password && body.email) {
		let user = await readDB("Visitors", "Accounts", { "email": body.email });
		
		if(!user.length) {
			res.redirect("back");
		} else if(await checkHash(body.password, user[0].hash)) {
			res.cookie("token", jwt.sign(user[0], process.env.TOKEN_SECRET));
			res.redirect("/page/home");
		} else {
			res.redirect("back");
		}
	} else {
		res.redirect("back");
	}
});

apiRouter.get("/refresh", (req, res) => {
	if(req.loggedIn) {
		client.db("Visitors").collection("Accounts").findOne({ "hash": req.loggedIn.hash }, (err, result) => {
			if(err) console.error(err);

			if(result) {
				let token = jwt.sign(result, process.env.TOKEN_SECRET);

				res.cookie("token", token);
				res.redirect("back");
			} else {
				res.clearCookie("token");
				res.redirect("/page/login");
			}
		})
	} else {
		res.redirect("/page/login");
	}
});

apiRouter.get("/logout", (req, res) => {
	log("GET", "Logout");
	res.clearCookie("token");
	res.redirect("/page/home");
});


app.listen("3030", err => {
	if(err) throw err;
	log("N/A", "Server restarted");
	console.log("Listening");
});