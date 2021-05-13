"use strict";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let company = { code: "test", name: "Test", description: "Used for testing"}
let company2 = {code: "test2", name: "Test2", description: "Used for creating new company"};

beforeEach(function () {
  db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ($1, $2, $3)`, [company.code, company.name, company.description]);
});

afterEach(function () {
  db.query(`
    DELETE FROM companies
    WHERE code=$1`, [company.code]);
  db.query(`
    DELETE FROM companies
    WHERE code=$1`, [company2.code]);
});

describe("GET /companies", function () {
  it("Gets a list of companies in the database", async function () {
    let response = await request(app).get("/companies");
    expect(response.body).toEqual({ companies: [{code: company.code, name: company.name}] });
  });
});

describe("GET /companies/:code", function () {
  it("Gets a single company by its code from the database", async function () {
    let response = await request(app).get(`/companies/${company.code}`);
    company.invoices = [];
    expect(response.body).toEqual({company});
  });

  it("Should return a 404 if the company code does not exist", async function() {
    let response = await request(app).get("/companies/disney");
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies", function() {
  it("Should add a new company to the database", async function() {
    let response = await request(app).post("/companies").send(company2);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({company: company2});
  });
});

describe("PUT /companies/:code", function() {
  it("Should update information on a company", async function() {
    let response = await request(app).put(`/companies/${company.code}`).send({name: company.name, description: "New description test"});
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: {code: company.code, name: company.name, description: "New description test"}});
  });

  it("Should return a 404 if the company code does not exist", async function() {
    let response = await request(app).put("/companies/disney").send({name: "Disney", description: "Mickey Mouse"});
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", function() {
  it("Should delete a company from database", async function() {
    let response = await request(app).delete(`/companies/${company.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({status: "deleted"});
  });

  it("Should return a 404 if the company code does not exist", async function() {
    let response = await request(app).delete("/companies/disney");
    expect(response.statusCode).toEqual(404);
  });
});


