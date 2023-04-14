var express = require("express");
require("dotenv").config();
var passport = require("passport");
var MagicLinkStrategy = require("passport-magic-link").Strategy;
var Mailchain = require("@mailchain/sdk").Mailchain;
const db = require("../config/firebaseConfig.js");
var router = express.Router();
var mailchain = Mailchain.fromSecretRecoveryPhrase(
  process.env.SECRET_RECOVERY_PHRASE
);
var NEWSLETTER_COLLECTION = require("../config/vars.js");
const server = process.env.SERVER_URL;

let createMailchainAddress = function (address) {
  switch (address) {
    case address.match(/^[\d\w\-\_]*@mailchain\.com$/)?.input: // Mailchain address:
      return address;
    case address.match(/^0x[a-fA-F0-9]{40}$/)?.input: // Ethereum address:
      return address + "@ethereum.mailchain.com";
    case address.match(/^.*\.eth$/)?.input: // ENS address:
      return address + "@ens.mailchain.com";
    case address.match(/^.*\.*@mailchain$/)?.input: // Mailchain address without .com:
      return address + ".com";
    default:
      console.error("Invalid address");
  }
};

let createNewAuthToken = async function () {
  let token = "";
  let exists = true;
  let tries = 0;
  // check weather the given token already exists
  while (exists && tries < 10) {
    token = Math.random().toString(36).substring(2, 10);
    const tokenRef = db.collection("newsletters");
    const tokenSnap = await tokenRef.where("auth_token", "==", token).get();
    if (tokenSnap.empty) {
      exists = false;
    }
    tries++;
  }
  return token.length > 0 ? token : null;
};
passport.use(
  new MagicLinkStrategy(
    {
      secret: process.env.SECRET_PASSPORT_SESSION_KEY,
      userFields: ["mailchain_address"],
      tokenField: "token",
      verifyUserAfterToken: true,
    },
    async function send(user, token) {
      var link = `${server}/login/mailchain/verify?token=${token}`;
      var sender = await mailchain.user();
      var msg = {
        to: [createMailchainAddress(user.mailchain_address)],
        from: sender.address,
        subject: "Sign in to Newsmail",
        content: {
          text:
            "Hello! Click the link below to finish signing in to NewsMail.\r\n\r\n" +
            link +
            "\r\n\r\n Copy your auth token from the dashboard which will open, use it in requests from your customized UI and get started with NewsMail handling your newsletters.",
          html:
            '<h3>Hello!</h3><p>Click the link below to finish signing in to NewsMail.</p><p><a href="' +
            link +
            '">Sign in</a></p>',
        },
      };
      return await mailchain.sendMail(msg);
    },
    function verify(user) {
      return new Promise(async function (resolve, reject) {
        try {
          const docRef = db
            .collection(NEWSLETTER_COLLECTION)
            .doc(user.mailchain_address);
          const docSnap = await docRef.get();
          if (!docSnap.exists) {
            const collectionRef = db.collection(NEWSLETTER_COLLECTION);
            const data = {
              mailchain_address: user.mailchain_address,
              auth_token: await createNewAuthToken(),
            };
            collectionRef.doc(user.mailchain_address).set(data);
            return resolve(data);
          } else {
            return resolve(docSnap.data());
          }
        } catch (err) {
          console.log(err);
          reject(err);
        }
      });
    }
  )
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, mailchain_address: user.mailchain_address });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post(
  "/login/mailchain",
  passport.authenticate("magiclink", {
    action: "requestToken",
    failureRedirect: "/login",
  }),
  function (req, res, next) {
    res.redirect("/login/mailchain/check");
  }
);

router.get("/login/mailchain/check", function (req, res, next) {
  res.render("login/mailchain/check");
});

router.get(
  "/login/mailchain/verify",
  passport.authenticate("magiclink", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/login",
  })
);

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
