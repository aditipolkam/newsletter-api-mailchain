var express = require("express");

var router = express.Router();
const db = require("../config/firebaseConfig.js");
const NEWSLETTER_COLLECTION = require("../config/vars.js");

async function fetchAuthToken(req, res, next) {
  const docRef = db
    .collection(NEWSLETTER_COLLECTION)
    .doc(req.user.mailchain_address);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    res.locals.auth_token = null;
  } else {
    res.locals.auth_token = docSnap.data().auth_token;
  }
  next();
}
/* GET home page. */
router.get(
  "/",
  function (req, res, next) {
    if (!req.user) {
      return res.render("home");
    }
    next();
  },
  fetchAuthToken,
  function (req, res, next) {
    console.log("req.user: ", req.user);
    res.locals.filter = null;
    res.render("index", { user: req.user });
  }
);

//create newsletter
router.post(
  "/",
  function (req, res, next) {
    req.body.title = req.body.title.trim();
    req.body.desc = req.body.desc.trim();
    next();
  },
  function (req, res, next) {
    if (req.body.title !== "" || req.body.desc !== "") {
      return next();
    }
  },
  function (req, res, next) {
    const docRef = db.collection(NEWSLETTER_COLLECTION).doc(req.body.user);
    const data = {
      name: req.body.title,
      desc: req.body.desc,
      launch: new Date(),
      subscribers: [],
    };
    docRef.update(data);
    res.redirect("/");
  }
);

module.exports = router;
