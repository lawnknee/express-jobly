"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies with optional filtering criteria.
   *    Optional filtering criteria:
   *      - minEmployees
   *      - maxEmployees
   *      - nameLike (will find case-insensitive, partial matches)
   *
   *  Expects a query object; defaulted to empty obj if no arguments were provided.
   *  
   *  Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(query = {}) {
    const { nameLike, minEmployees, maxEmployees } = query;

    const { where, values } = Company._whereClauseBuilder({ nameLike, minEmployees, maxEmployees });

    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ${where}
           ORDER BY name`,
      values
    );
    return companiesRes.rows;
  }

  /** Builds where clause based on filtering criteria in query string.
   * 
   *  Expects an object with filtering criteria (minEmployees, maxEmployees, nameLike)
   *    as keys, and user inputs as values.
   *    
   *  Returns an object like:
   *    {
   *      where: 'WHERE name ILIKE $1 AND ...'
   *      values: [ value1, ... ]
   *    }
   */
  static _whereClauseBuilder({ nameLike, minEmployees, maxEmployees }) {
  
    // if min employees > max employees, throws a BadRequest error.
    if ((minEmployees && maxEmployees) && (minEmployees > maxEmployees)){
      throw new BadRequestError(
        "Minimum employees cannot be greater than Maximum employees."
      );
    }

    let whereParts = [];
    let values = [];

    if (nameLike) {
      whereParts.push(`name ILIKE $${whereParts.length + 1}`);
      values.push(`%${nameLike}%`);
    }
    if (minEmployees) {
      whereParts.push(`num_employees >= $${whereParts.length + 1}`);
      values.push(minEmployees);
    }
    if (maxEmployees) {
      whereParts.push(`num_employees <= $${whereParts.length + 1}`);
      values.push(maxEmployees);
    }

    let where = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    return { where, values };
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
