"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const OK = 200;
const CREATED = 201;
const BADREQUEST = 400;
const UNAUTH = 401;
const FORBIDDEN = 403;
const NOTFOUND = 404;

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
        companyHandle: "c1",
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

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 10000,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 200000,
          equity: "0.7",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("works: validates incoming request with filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "j1", minSalary: 5000, hasEquity: true });

    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 10000,
          equity: "0.1",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("invalid: invalid incoming request with filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ badTitle: "2", minSalary: "one", hasEquity: "true" });

    expect(resp.body).toEqual({
      error: {
        message: [
          "instance.minSalary is not of a type(s) integer",
          'instance is not allowed to have the additional property "badTitle"',
        ],
        status: 400,
      },
    });
    expect(resp.statusCode).toEqual(BADREQUEST);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("working for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds.id1}`);
    expect(resp.statusCode).toEqual(OK);
    expect(resp.body).toEqual({
      job: {
        companyHandle: "c1",
        equity: "0.1",
        id: expect.any(Number),
        salary: 10000,
        title: "j1",
      },
    });
  });

  test("working for logged in user", async function () {
    const resp = await request(app)
      .get(`/jobs/${jobIds.id1}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(OK);
    expect(resp.body).toEqual({
      job: {
        companyHandle: "c1",
        equity: "0.1",
        id: expect.any(Number),
        salary: 10000,
        title: "j1",
      },
    });
  });

  test("notfound for invalid jobId", async function () {
    const resp = await request(app)
      .get(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(NOTFOUND);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works: admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.id1}`)
      .send({
        title: "patch job title",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(OK);
    expect(resp.body).toEqual({
      job: {
        companyHandle: "c1",
        id: expect.any(Number),
        equity: "0.1",
        salary: 10000,
        title: "patch job title",
      },
    });
  });
  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${jobIds.id1}`).send({
      title: "should not work",
    });

    expect(resp.statusCode).toEqual(UNAUTH);
    expect(resp.body).toEqual({
      error: { message: "Unauthorized", status: 401 },
    });
  });
  test("forbidden for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.id1}`)
      .send({
        title: "should not work",
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(FORBIDDEN);
    expect(resp.body).toEqual({
      error: { message: "Bad Request", status: 403 },
    });
  });
  test("bad request: Invalid info", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.id1}`)
      .send({
        badKeyRequest: "should not work",
        title: "test title",
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.status).toEqual(BADREQUEST);
    expect(resp.body).toEqual({
      error: {
        message: [
          'instance is not allowed to have the additional property "badKeyRequest"',
        ],
        status: 400,
      },
    });
  });

  test("bad request: changing primary key", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.id1}`)
      .send({
        id: 2000,
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.status).toEqual(BADREQUEST);
    expect(resp.body).toEqual({
      error: {
        message: [
          'instance is not allowed to have the additional property "id"',
        ],
        status: 400,
      },
    });
  });

  // TODO: test no one can change companyHandle
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works: admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds.id1}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(OK);
    expect(resp.body).toEqual({ deleted: expect.any(Number) });
  });
  test("unauth anon", async function () {
    const resp = await request(app).delete(`/jobs/${jobIds.id2}`);

    expect(resp.statusCode).toEqual(UNAUTH);
    expect(resp.body).toEqual({
      error: { message: "Unauthorized", status: 401 },
    });
  });
  test("forbidden non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds.id2}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(FORBIDDEN);
    expect(resp.body).toEqual({
      error: { message: "Bad Request", status: 403 },
    });
  });
  test("notfound for invalid jobId", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(NOTFOUND);
    expect(resp.body).toEqual({ error: { message: "No job: 0", status: 404 } });
  });
});