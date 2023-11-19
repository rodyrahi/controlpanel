const express = require("express");
const { blogsdb } = require("../db.js");
const router = express.Router();


router.get("/", async (req, res) => {

    const blogs = blogsdb.prepare(`SELECT * FROM blogs`).all()
    const isadmin = req.oidc.user.sid === 'F9VW4W-vVX1eMzju-Ta25D0E1w6ieVso'?true : false
    res.render('partials/blog/allblogs' , {blogs , isadmin})
});




module.exports = router;
