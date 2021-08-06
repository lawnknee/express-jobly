"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "test job",
    salary: 200000,
    equity: 0.5,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "test job",
      salary: 200000,
      equity: "0.5",
      companyHandle: "c1",
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      { companyHandle: "c1", equity: "0.01", salary: 10000, title: "job1" },
      { companyHandle: "c2", equity: "0.07", salary: 200000, title: "job2" },
    ]);
  });
});

describe("findAll with filters", function () {
  test("works: all filters", async function () {
    let query = {
      title: "1",
      minSalary: 10000,
      hasEquity: true,
    };
    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      { companyHandle: "c1", equity: "0.01", salary: 10000, title: "job1" },
    ]);
  });

  test("works: title filter only", async function () {
    let query = {
      title: "2",
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      { companyHandle: "c2", equity: "0.07", salary: 200000, title: "job2" },
    ]);
  });

  test("works: minSalary filter only", async function () {
    let query = {
      minSalary: 100000,
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      { companyHandle: "c2", equity: "0.07", salary: 200000, title: "job2" },
    ]);
  });

  test("works: equity filter only", async function () {
    let query = {
      hasEquity: true,
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      { companyHandle: "c1", equity: "0.01", salary: 10000, title: "job1" },
      { companyHandle: "c2", equity: "0.07", salary: 200000, title: "job2" },
    ]);
  });
});

/************************************** _whereBuilder */

describe("_whereBuilder", function () {
  test("filter with whereBuilder", function () {
    let query = {
      title: "1",
      minSalary: 10000,
      hasEquity: true,
    };

    let where = Job._whereClauseBuilder(query);

    expect(where).toEqual({
      values: ["%1%", 10000, 0],
      where: "WHERE title ILIKE $1 AND salary >= $2 AND equity > $3",
    });
  });
  
  test("filter with whereBuilder", function () {
    let query = {
      title: "1",
      minSalary: 10000,
      hasEquity: true,
    };

    let where = Job._whereClauseBuilder(query);

    expect(where).toEqual({
      values: ["%1%", 10000, 0],
      where: "WHERE title ILIKE $1 AND salary >= $2 AND equity > $3",
    });
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(jobIds.id1);
    expect(job).toEqual({
      id: jobIds.id1,
      companyHandle: "c1",
      equity: "0.01",
      salary: 10000,
      title: "job1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New job title",
    salary: 100000,
    equity: "0.05",
  };

  test("works", async function () {
    let job = await Job.update(jobIds.id1, updateData);
    expect(job).toEqual({
      id: jobIds.id1,
      companyHandle: "c1",
      ...updateData,
    });
  });

  test("not found: invalid id", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request: no data given", async function () {
    try {
      await Job.update(jobIds.id1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds.id1);
    const res = await db.query("SELECT id FROM jobs WHERE id=$1", [jobIds.id1]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/**

Creating a job instance
done working

Find all
done working, no filter
done working, with filters

jobWhereBuilder
done working, combo
done working, with title
done working, with minSalary
done working, with hasEquity

get
done working
done notfound, invalid id

update
done working
done badreq, no data given
done notfound, invalid id

delete
- working
- notfound, invalid id

*/
