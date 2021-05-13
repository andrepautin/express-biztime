"use strict";
const HTTP_201_CREATED = 201;
const express = require("express");
const db = require("../db");
const { NotFoundError } = require("../expressError");
const router = new express.Router();

/** GET "/invoices" return JSON on invoices like:
 * {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res, next) {

  const result = await db.query(`
              SELECT id, comp_code 
              FROM invoices
              ORDER BY id`);
  const invoices = result.rows;

  return res.json({ invoices });
})

/** GET "/invoices/<id>" return JSON on given invoice like:
 * {invoice: {id, amt, paid, add_date, paid_date, 
 * company: {code, name, description}}
 * 
 * throws 404 error if invoice not found
 */
router.get("/:id", async function (req, res, next) {

  const id = req.params.id;

  const iResult = await db.query(`
              SELECT id, amt, paid, add_date, paid_date 
              FROM invoices
              WHERE id=$1`, [id]);
  const invoice = iResult.rows[0];

  if (!invoice) {
    throw new NotFoundError("Invoice not found")
  };

  const cResult = await db.query(`
            SELECT c.code, c.name, c.description
            FROM invoices as i
            JOIN companies as c
            ON i.comp_code=c.code
            WHERE i.id=$1`, [id]);
  invoice.company = cResult.rows[0];

  return res.json({ invoice });
})

/** POST "/invoices" adds new invoice to database, accepts JSON like:
 * {comp_code, amt}
 * returns JSON like:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function (req, res, next) {

  const { comp_code, amt } = req.body;

  const results = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
  const invoice = results.rows[0];

  return res.status(HTTP_201_CREATED).json({ invoice });
})

/** PUT /invoices/<id> updates an invoice amount, accepts JSON like
 * {amt}
 * returns JSON like
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * throws 404 error if invoice not found
*/
router.put("/:id", async function (req, res, next) {

  const { id } = req.params;
  const { amt } = req.body;

  const results = await db.query(`
          UPDATE invoices
          SET amt=$1
          WHERE id=$2
          RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, id]);
  const invoice = results.rows[0];

  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  };

  return res.json({ invoice });
})

/** DELETE "/invoices/<id>" delete an invoice from the database
 * returns JSON like
 * {status: "deleted"}
 * throws 404 error if invoice not found
*/
router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;

  const results = await db.query(`
            DELETE FROM invoices
            WHERE id=$1
            RETURNING id `, [id]);
  const invoice = results.rows[0];

  if (!invoice) {
    throw new NotFoundError("Invoice not found")
  };

  return res.json({ status: "deleted" });
})



module.exports = router;