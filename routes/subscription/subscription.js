const express = require("express");
const { blogsdb , userdb } = require("../db.js");
const router = express.Router();
const nodemailer = require("nodemailer");

router.get("/:plan", async (req, res) => {

    const plan = req.params.plan

    res.render('partials/subscription/subscriptionform' ,{plan})
});

router.post("/subscribed", (req, res) => {

    const user = req.oidc.user.sub;

    const {name , phone , email , plan } = req.body
  
    // // Check if the user exists in the database
    // const result = userdb.prepare("SELECT * FROM user WHERE user = ?").get(user);

    userdb.prepare("UPDATE user SET name = ?, phone = ? , plan=? WHERE user = ?")
    .run(name, phone,plan, req.oidc.user.sub);

      // Your code to process the contact form data

  // Configuring nodemailer - Update this with your email provider settings
  const transporter = nodemailer.createTransport({
    service: "gmail", // e.g., 'Gmail', 'Outlook', etc.
    auth: {
      user: "kamingoconsultancy@gmail.com", // Your email address
      pass: "tvdvqzxhvykduptj", // Your email password or generated app password
    },
  });

  const mailOptions = {
    from: "kamingoconsultancy@gmail.com", // Sender email
    to: "rajvendrarahi126@gmail.com", // Recipient email
    subject: `${name} Subscribed`,
    text: `Name: ${name}\nNumber: ${phone}\nemail: ${email}\nplan: ${plan}`,
  };

  // Sending the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      // Handle error or display a message to the user
    } else {
      console.log("Email sent: " + info.response);
      // Redirect or display a success message to the user
    }
  });


  res.send(`<div class="alert alert-success ms-auto text-center " role="alert">
  <h4 class="alert-heading">Thanks for Subscribing!</h4>
  <p>Our team will connect with you in a few minutes. 🚀</p>
  <hr>
  <p class="mb-0">If you have any urgent questions, feel free to contact us at rajvendrarahi126@gmail.com.</p>
</div>`)


});




module.exports = router;
