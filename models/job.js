"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * */

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

  /** Find all jobs with optional filtering criteria.
   *    Optional filtering criteria:
   *      - title (will find case-insensitive, partial matches)
   *      - minSalary
   *      - hasEquity
   *
   *  Expects a query object; defaulted to empty obj if no arguments were provided.
   *  
   *  Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(query = {}) {
    const { title, minSalary, hasEquity } = query;
    const { where, values } = Job._whereClauseBuilder({
      title,
      minSalary,
      hasEquity,
    });

    const result = await db.query(
      `SELECT id,
              title, 
              salary, 
              equity, 
              company_handle AS "companyHandle"
         FROM jobs
         ${where}
         ORDER BY title`,
      values
    );
    // TODO: join with companies table to get information about that company

    return result.rows;
  }

  /** Builds where clause based on filtering criteria in query string.
   * 
   *  Expects an object with filtering criteria (title, minSalary, hasEquity)
   *    as keys, and user inputs as values.
   *    
   *  Returns an object like:
   *    {
   *      where: 'WHERE title ILIKE $1 AND ...'
   *      values: [ value1, ... ]
   *    }
   */

  static _whereClauseBuilder({ title, minSalary, hasEquity }) {
    if (!title && !minSalary && !hasEquity) {
      return '';
    }

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

    let where = `WHERE ${whereParts.join(" AND ")}`;

    return { where, values };
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

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

    // TODO: include information about the company

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

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

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

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


module.exports = Job;