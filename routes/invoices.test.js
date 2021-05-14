"use strict";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let company = { code: "test", name: "Test", description: "Used for testing" };
let company2 = { code: "test2", name: "Test2", description: "Used for creating new company" };
let invoice = { comp_code: company.code, amt: 100 };
let invoiceId;
let newInvoice = { comp_code: company.code, amt: 234 };
let newInvoiceId;

/** Do before each test */
beforeEach(async function () {
  await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ($1, $2, $3)`, [company.code, company.name, company.description]);

  let results = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING id`, [invoice.comp_code, invoice.amt]);
  invoiceId = results.rows[0].id;
});

/** Do after each test */
afterEach(function () {
    db.query(`
      DELETE FROM companies
      WHERE code=$1`, [company.code]);

    db.query(`
      DELETE FROM companies
      WHERE code=$1`, [company2.code]);

    db.query(`
      DELETE FROM invoices
      WHERE id=$1`, [newInvoiceId]);

    db.query(`
      DELETE FROM invoices
      WHERE id=$1`, [invoiceId]);
});
// end 

/** GET '/invoices' returns {invoices: [{id, comp_code}, ...]} */

describe("GET /invoices", function () {
  it("Gets a list of invoices in the database", async function () {
    let response = await request(app).get("/invoices");

    expect(response.body).toEqual({
      invoices: [{
        id: expect.any(Number),
        comp_code: invoice.comp_code,
      }]
    });
  });
});
// end

/** GET '/invoices/<invoice_id> get data on single invoice; returns
 * {invoice: {id, amt, paid, add_date, paid_date, 
 * company: {code, name, description}}*/

describe("GET /invoices/:id", function () {
  it("Gets a invoice by its id from the database", async function () {
    let response = await request(app).get(`/invoices/${invoiceId}`);

    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        amt: "100.00",
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
        company: {code:company.code, 
                  name:company.name, 
                  description:company.description}
      }
    });
  });

  it("Should return a 404 if the invoice does not exist", async function () {
    let response = await request(app).get("/invoices/0");

    expect(response.statusCode).toEqual(404);
  });
});
// end 

/** POST '/invoices' creates new invoice from data; returns
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}*/

describe("POST /invoices", function () {
  it("Should add a new invoice to the database", async function () {
    let response = await request(app)
                    .post("/invoices")
                    .send(newInvoice);

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: newInvoice.comp_code,
        amt: "234.00",
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }
    });
  });
});
// end

/** PUT '/invoices/<invoice_id>' updates invoice amt; returns 
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}*/

describe("PUT /invoices/:id", function () {
  it("Should update information on an invoice", async function () {
    let response = await request(app)
                    .put(`/invoices/${invoiceId}`)
                    .send({amt:1337});

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: invoiceId,
        comp_code: invoice.comp_code,
        amt: "1337.00",
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }
    });
  });

  it("Should return a 404 if the invoice does not exist", async function () {
    let response = await request(app)
                    .put("/invoices/0")
                    .send({amt:1337});

    expect(response.statusCode).toEqual(404);
  });
});
// end

/** DELETE '/invoices' deletes an invoice; returns {status: "deleted"} */

describe("DELETE /invoices/:id", function () {
  it("Should delete an invoice from database", async function () {
    let response = await request(app).delete(`/invoices/${invoiceId}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  it("Should return a 404 if the company code does not exist", async function () {
    let response = await request(app).delete("/invoices/0");

    expect(response.statusCode).toEqual(404);
  });
});
// end

