require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var passport = require("passport");
var http = require("http");

var authRouter = require("./routes/auth");
var indexRouter = require("./routes/index");
var newsletterRouter = require("./routes/newsletter");

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SECRET_PASSPORT_SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.authenticate("session"));

app.use("/", authRouter);
app.use("/", indexRouter);
app.use("/", newsletterRouter);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.set("port", port);

var server = http.createServer(app);

server.listen(port, function () {
  console.log("Example app listening on port 3000!");
});
