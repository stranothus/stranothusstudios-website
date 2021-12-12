const sharp = require("sharp");
const file = "F3967F5D-3031-4593-9E6B-6D1653C04D9C.png";

sharp(`./public/uploads/${file}`).resize(200, 200).jpeg({ quality: 90 }).toFile(`./public/uploads/resized/${file}`)