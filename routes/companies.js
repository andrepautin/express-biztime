"use strict";
const express = require("express");
const db = require("../db");
const { NotFoundError } = require("../expressError");
const router = new express.Router();

/* returns a list of the companies
    should look like: 
    {companies: [{code, name}, ...]} */
router.get("/", async function(req, res, next) {
    const results = await db.query(`
    SELECT code, name
    FROM companies
    ORDER BY name`);
    const companies = results.rows;
    return res.json({ companies });
});

/* takes company code and returns information on that company if found
     throws error if company not found
     should look like:
    {company: {code, name, description}} */
router.get("/:code", async function(req, res, next) {
    const code = req.params.code;
    const results = await db.query(`
    SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [code])
    const company = results.rows[0];
    if (results.rowCount === 0) {
        throw new NotFoundError("Company not found");
    }
    return res.json({ company });
});

/* adds a new company to DB
    accepts JSON like:
    {code, name, description}
    returns JSON for new company like:
    {company: {code, name, description}} */
router.post("/", async function(req, res, next) {
    const {code, name, description} = req.body;
    const results = await db.query(`
    INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
        [code, name, description]);
    const company = results.rows[0];
    return res.json({ company });
})

/* edits an existing company 
    throws error if company not found
    accepts JSON like:
    {name, description}
    returns updated company with JSON like:
    {company: {code, name, description}}
*/
router.put("/:code", async function(req, res, next) {
    const {name, description} = req.body;
    const results = await db.query(`
    UPDATE companies
        SET name=$1,
            description=$2
        WHERE code=$3
        RETURNING code, name, description`,
        [name, description, req.params.code]);
    const company = results.rows[0];
    if (results.rowCount === 0) {
        throw new NotFoundError("Company not found");
    }
    return res.json({ company });
})

/* deletes a company from DB
    returns a 404 if company not found
    returns JSON like:
    {status: "deleted"}*/
router.delete("/:code", async function(req, res, next) {
    const code = req.params.code;
    await db.query(`
    DELETE
    FROM companies
    WHERE code=$1
    RETURNING code`,
    [code]);
    if (results.rowCount === 0) {
        throw new NotFoundError("Company not found");
    }
    return res.json({ status: "deleted" })
})

module.exports = router;