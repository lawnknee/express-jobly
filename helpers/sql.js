const { BadRequestError } = require("../expressError");

/** Takes in user data, such as:
 *    { firstName, lastName, password, email, isAdmin }
 *
 *  Creates an array with the column names parameterized.
 *
 *  Returns an object like:
 *    {
 *      setCols: joins the array with comma-separated elements,
 *      values: array of values from dataToUpdate
 *    }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
