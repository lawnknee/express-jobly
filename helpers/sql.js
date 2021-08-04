const { BadRequestError } = require("../expressError");

/** Takes in user data and jsToSql, like:
 *    dataToUpdate object:
 *      { firstName, age }
 *    jsToSql object:
 *      snakeCases dataToUpdate keys that are camelCased like:
 *      {firstName: first_name}
 * 
 *  Creates an array with the column names parameterized.
 *
 *  Returns an object like:
 *    {
 *      setCols: '"first_name"=$1', '"age"=$2',
 *      values: ['Aliya', 32]
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
