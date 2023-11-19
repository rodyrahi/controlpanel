const express = require("express");
const { blogsdb } = require("../db.js");
const router = express.Router();


router.get("/", async (req, res) => {

    const blogs = blogsdb.prepare(`SELECT * FROM blogs`).all()
    const isadmin = req.oidc.user.sid === 'F9VW4W-vVX1eMzju-Ta25D0E1w6ieVso'?true : false
    res.render('partials/blog/allblogs' , {blogs , isadmin})
});

router.post("/createblog", (req, res) => {
    const { tittle, author, body , id } = req.body;
    
   
    const result = blogsdb.prepare("SELECT * FROM blogs WHERE id= ?").get(id);
  
    if (!result) {
        blogsdb
        .prepare(`INSERT INTO blogs (tittle, author, body) VALUES (?,? ,?) `)
        .run(tittle, author, body);
    } else {
        blogsdb
        .prepare("UPDATE blogs SET tittle = ?, author = ? , body = ? WHERE id = ? ")
        .run(tittle, author, body, id);
    }
  
    console.log("done");
    res.redirect("/blog");
  });




module.exports = router;
