"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");
const { findAll } = require("../models/company");
const { ForbiddenError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: "New",
    equity: "http://new.img",
    company_handle: "DescNew",
  };
});
/*
Creating a job
- working, admins only
- unauth anon
- forbidden non-admin
- badreq duplicate
- badreq invalid info
- badreq missing data

Getting all jobs
- working, no filter, anon
- working, any user

Getting filter jobs 
- working with filters
- badreq invalid info

jobsWhereBuilder
- working, title filter
- working minSalary filter
- working, hasEquity filter
- working, combo filter

Getting specific jobId
- working, anon
- working, any user
- notfound, invalid jobid

Updating job posting
- working, admin only
- unauth anon
- forbidden non-admin 
- badreq invalid info
- badreq change primary key

Delete job posting
- working, admin only
- unauth anon
- forbidden non-admin
- notfound admin, invalid jobid
*/
