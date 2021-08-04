"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

let jsToSql = {
  firstName: "first_name",
  lastName: "last_name",
  isAdmin: "is_admin",
};

describe("sqlForPartialUpdate", function () {
  test("valid input: updating partial user data", function () {
    expect(
      sqlForPartialUpdate({ firstName: "Aliya", age: 32 }, jsToSql)
    ).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("invalid input", function () {
    try {
      sqlForPartialUpdate({}, jsToSql);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
