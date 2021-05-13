"use strict";
const express = require("express");
const db = require("../db");
const { NotFoundError } = require("../expressError");
const router = new express.Router();

/** GET "/companies" returns a list of the companies
* should look like: 
* {companies: [{code, name}, ...]} 
*/
router.get("/", async function (req, res, next) {

  const results = await db.query(`
    SELECT code, name
    FROM companies
    ORDER BY name`);
  const companies = results.rows;

  return res.json({ companies });
});

/** GET "/companies/<code> 
* takes company code and returns JSON on that company if found
* should look like:
* {company: {code, name, description, invoices: [id, ...]} 
* throws error if company not found
*/
router.get("/:code", async function (req, res, next) {

  const code = req.params.code;

  const cResults = await db.query(`
    SELECT code, name, description
    FROM companies
    WHERE code = $1`,[code]);
  const company = cResults.rows[0];

  if (!company) {
    throw new NotFoundError("Company not found");
  };

  const iResults = await db.query(`
                        SELECT id 
                        FROM invoices
                        WHERE comp_code=$1`, [code]);
  company.invoices = iResults.rows.map(i => i.id);

  return res.json({ company });
});

/** POST "/companies" adds a new company to DB
* accepts JSON like:
* {code, name, description}
* returns JSON for new company like:
* {company: {code, name, description}} 
*/
router.post("/", async function (req, res, next) {

  const { code, name, description } = req.body;

  const results = await db.query(`
    INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`, [code, name, description]);
  const company = results.rows[0];

  return res.json({ company });
});

/** PUT "/companies/<code> edits an existing company 
* accepts JSON like:
* {name, description}
* returns updated company with JSON like:
* {company: {code, name, description}}
* throws error if company not found 
*/
router.put("/:code", async function (req, res, next) {

  const { name, description } = req.body;
  const code = req.params.code;

  const results = await db.query(`
    UPDATE companies
    SET name=$1,
        description=$2
    WHERE code=$3
    RETURNING code, name, description`,[name, description, code]);
  const company = results.rows[0];

  if (!company) {
    throw new NotFoundError("Company not found");
  };

  return res.json({ company });
});

/** DELETE "/companies/<code> deletes a company from DB
* returns JSON like:
* {status: "deleted"}
* returns a 404 if company not found
*/
router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;

  const results = await db.query(`
    DELETE
    FROM companies
    WHERE code=$1
    RETURNING code`, [code]);
  const company = results.rows[0];

  if (!company) {
    throw new NotFoundError("Company not found");
  };
  
  return res.json({ status: "deleted" });
});

module.exports = router;