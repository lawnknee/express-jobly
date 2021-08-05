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
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const OK = 200;
const CREATED = 201;
const BADREQUEST = 400;
const UNAUTH = 401;
const FORBIDDEN = 403;

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "test POST job",
    salary: 10000,
    equity: 0.1,
    companyHandle: "c1",
  };

  test("works: admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(CREATED);
    expect(resp.body).toEqual({
      job: {
        companyhandle: "c1",
        equity: "0.1",
        id: expect.any(Number),
        salary: 10000,
        title: "test POST job",
      },
    });
  });

  test("forbidden for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(FORBIDDEN);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);

    expect(resp.statusCode).toEqual(UNAUTH);
  });

  test("badrequest: invalid info", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "test job1",
        salary: "10000",
        equity: true,
        companyHandle: "c1",
        id: 10,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(BADREQUEST);
    expect(resp.body).toEqual({
      error: {
        message: [
          "instance.salary is not of a type(s) integer",
          "instance.equity is not of a type(s) number",
          'instance is not allowed to have the additional property "id"',
        ],
        status: 400,
      },
    });
  });

  test("badrequest: missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({})
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(BADREQUEST);
    expect(resp.body).toEqual({
      error: {
        message: [
          'instance requires property "title"',
          'instance requires property "companyHandle"',
        ],
        status: 400,
      },
    });
  });
});

/************************************** GET /jobs */

/*
Creating a job
done - working, admins only
done unauth anon
done forbidden non-admin
done badreq invalid info
done badreq missing data

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
