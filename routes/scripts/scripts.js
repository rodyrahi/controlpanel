const express = require("express");
const router = express.Router();
const { userdb, scriptsdb } = require("../db.js");

router.get("/scripts", (req, res) => {
  const result = scriptsdb
    .prepare("SELECT * FROM scripts WHERE user=?")
    .all(req.oidc.user.sub);

  res.render("partials/scripts", { result: result });
});
router.post("/createscript", (req, res) => {
  const { scriptname, script, id } = req.body;

  const result = scriptsdb.prepare("SELECT * FROM scripts WHERE id= ?").get(id);

  if (!result) {
    scriptsdb
      .prepare(`INSERT INTO scripts (name , script ,user) VALUES (?,? ,?) `)
      .run(scriptname, script, req.oidc.user.sub);
  } else {
    scriptsdb
      .prepare("UPDATE scripts SET name = ?, script = ? WHERE id = ? ")
      .run(scriptname, script, id);
  }

  console.log("done");
  res.redirect("/scripts");
});

router.get("/deletescript/:id", (req, res) => {
  const id = req.params.id;

  // Assuming you have a database connection and a table named 'scripts'
  scriptsdb.prepare("DELETE FROM scripts WHERE id = ?").run(id);

  res.redirect("/scripts"); // Redirect to the scripts page after successful deletion
});

module.exports = router;
