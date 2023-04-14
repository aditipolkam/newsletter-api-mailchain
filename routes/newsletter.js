var express = require("express");
const NEWSLETTER_COLLECTION = require("../config/vars.js");
var router = express.Router();
const MailSender = require("@mailchain/sdk/internal").MailSender;
const privateMessagingKeyFromHex =
  require("@mailchain/sdk/internal").privateMessagingKeyFromHex;

const resolveAddress = require("@mailchain/sdk/internal").resolveAddress;
const db = require("../config/firebaseConfig.js");

async function checkAddress(mail) {
  const { error: resolveAddressError } = await resolveAddress(mail);
  if (resolveAddressError) {
    return false;
  }
  return true;
}

router.get("/get-newsletter/:id", async (req, res) => {
  console.log("get-newsletter/:id");
  const newsletterId = req.params.id;
  const docRef = db.collection(NEWSLETTER_COLLECTION).doc(newsletterId);
  const docSnap = await docRef.get();
  if (!docSnap.data()) {
    res.status(404).json({
      message: "No such newsletter exists",
    });
  } else {
    const newsletter = docSnap.data();
    res.status(200).json({
      id: newsletterId,
      name: newsletter.name,
      description: newsletter.desc,
      launch: newsletter.launch,
      subscribers: newsletter.subscribers,
      owner: newsletter.owner,
    });
  }
});

router.get("/get-subscribers/:id", async (req, res) => {
  const newsletterId = req.params.id;
  const docRef = db.collection(NEWSLETTER_COLLECTION).doc(newsletterId);
  const docSnap = await docRef.get();
  if (!docSnap.data()) {
    res.status(404).json({
      message: "No such newsletter exists",
    });
  } else {
    const { subscribers } = docSnap.data();
    res.status(200).json({
      subscribers,
    });
  }
});

router.post("/subscribe-newsletter/:id", async (req, res) => {
  console.log("subscribe-newsletter/:id");
  const { mail } = req.body;
  const newsletterId = req.params.id;
  const docRef = db.collection(NEWSLETTER_COLLECTION).doc(newsletterId);
  const docSnap = await docRef.get();
  if (mail == null || mail == undefined || mail == "" || !checkAddress(mail)) {
    res.status(400).json({
      message: "Please enter a valid mail address",
    });
  }
  if (!docSnap) {
    res.status(404).json({
      message: "No such newsletter exists",
    });
  } else {
    const { subscribers } = docSnap.data();
    if (subscribers.includes(mail)) {
      res.status(201).json({
        message:
          "This address has already subscribed to the requested newsletter",
      });
    } else {
      subscribers.push(mail);
      docRef.update({ subscribers });
      res.status(200).json({
        message: "You have successfully subscribed to this newsletter",
      });
    }
  }
});

router.post("/send-newsletter/:id", async (req, res) => {
  const newsletterId = req.params.id;
  const authToken = req.headers.authorization;
  const messaging_key = req.headers["x-mailchain-messaging-key"];
  const docRef = db.collection(NEWSLETTER_COLLECTION).doc(newsletterId);
  const docSnap = await docRef.get();

  if (!messaging_key || messaging_key.length !== 130) {
    res.status(400).json({
      message: "Please provide a valid messaging key",
    });
  } else if (!authToken || authToken == "") {
    res.status(400).json({
      message: "Please provide your auth token",
    });
  } else if (!docSnap) {
    res.status(404).json({
      message: "No such newsletter exists",
    });
  } else {
    if (authToken != docSnap.data().auth_token) {
      res.status(401).json({
        message: "Unauthorized request, please check your auth token",
      });
    } else {
      const { subject, title, content } = req.body;

      const recoveredPrivateMessagingKey =
        privateMessagingKeyFromHex(messaging_key);
      const mailSender = MailSender.fromSenderMessagingKey(
        recoveredPrivateMessagingKey
      );
      // send email to subscribers
      const { subscribers } = docSnap.data();

      const { data: sentMail, error: sendMailError } =
        await mailSender.sendMail({
          // address related private messaging key
          from: docSnap.id,
          // list of recipients (blockchain or mailchain addresses)
          to: subscribers,
          subject: subject, // subject line
          content: {
            text: title, // plain text body
            html: content, // html body
          },
        });

      if (sendMailError) {
        throw sendMailError;
      }

      console.log(`Message sent successfully: ${sentMail}`);

      res.status(200).json({
        message: "Newsletter sent successfully",
      });
    }
  }
});

module.exports = router;
