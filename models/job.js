"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { _whereClauseBuilder } = require("./company");

class Job {
  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id,
                     title,
                     salary,
                     equity,
                     company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );

    const job = result.rows[0];

    return job;
  }

  static async findAll(query = {}) {
    const { title, minSalary, hasEquity } = query;
    const { where, values } = Job._whereClauseBuilder({
      title,
      minSalary,
      hasEquity,
    });

    const result = await db.query(
      `SELECT title, 
              salary, 
              equity, 
              company_handle AS "companyHandle"
         FROM jobs
         ${where}
         ORDER BY title`,
      values
    );

    return result.rows;
  }

  static _whereClauseBuilder({ title, minSalary, hasEquity }) {
    let whereParts = [];
    let values = [];

    if (title) {
      whereParts.push(`title ILIKE $${whereParts.length + 1}`);
      values.push(`%${title}%`);
    }
    if (minSalary) {
      whereParts.push(`salary >= $${whereParts.length + 1}`);
      values.push(minSalary);
    }
    if (hasEquity) {
      whereParts.push(`equity > $${whereParts.length + 1}`);
      values.push(0);
    }

    let where =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    return { where, values };
  }

  static async get(id) {
    const result = await db.query(
      `SELECT id, 
              title, 
              salary, 
              equity, 
              company_handle AS "companyHandle"
          FROM jobs
          WHERE id = $1`,
      [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, 
                  title, 
                  salary,
                  equity, 
                  company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

/* 

Creating a job instance
- working
- badreq duplicate

Find all
- working, no filter
- working, with filters

jobWhereBuilder
- working, with title
- working, with minSalary
- working, with hasEquity
- working, combo

get
- working
- notfound, invalid id

update
- working
- badreq, no data given
- notfound, invalid id

delete
- working
- notfound, invalid id

*/

module.exports = Job;
