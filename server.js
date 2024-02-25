const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);
const app = express();
app.use(express.json());
app.use(require('morgan')('dev'));

app.post('/api/departments', async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO departments(name)
    VALUES($1)
    RETURNING *
    `
    const response = await client.query(SQL, [req.body.name])
    res.send(response.rows[0])
  } catch (err) {
    next(err)
  }
});
app.post('/api/employees', async (req, res, next) => {
    try {
      const SQL = `
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING *
      `
      const response = await client.query(SQL, [req.body.name])
      res.send(response.rows[0])
    } catch (err) {
      next(err)
    }
  });

app.get('/api/departments', async (req, res, next) => {
  try {
    const SQL = `
    SELECT * from departments ORDER BY id DESC;
    `;
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (err) {
    next(err)
  }
});
app.get('/api/employees', async (req, res, next) => {
    try {
      const SQL = `
      SELECT * from employees ORDER BY id DESC;
      `;
      const response = await client.query(SQL)
      res.send(response.rows)
    } catch (err) {
      next(err)
    }
  });

app.put('/api/departments/:id', async (req, res, next) => {
  try {
    const SQL = `
    UPDATE departments
    SET name=$1
    WHERE id=$2 RETURNING *
  `
  const response = await client.query(SQL, [req.body.name, req.params.id])
  res.send(response.rows[0])
  } catch (err) {
    next(err)
  }
});
app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
      UPDATE employees
      SET name=$1, department_id=$2, updated_at=now()
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id])
    res.send(response.rows[0])
    } catch (err) {
      next(err)
    }
  });

app.delete('/api/departments/:id', async (req, res, next) => {
  try {
    const SQL = `
    DELETE from departments
    WHERE id=$1
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
  } catch (err) {
    next(err)
  }
});
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
      DELETE from employees
      WHERE id=$1
      `
      const response = await client.query(SQL, [req.params.id])
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  });

async function init() {
  await client.connect();
  console.log("connected to db");
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
    INSERT INTO departments(name) VALUES ('Marketing')
    INSERT INTO departments(name) VALUES ('HR')
    INSERT INTO departments(name) VALUES ('Sales')
    INSERT INTO employees(name, department_id) VALUES('James Bond', (SELECT id FROM categories WHERE name='Marketing'));
    INSERT INTO employees(name, department_id) VALUES('Sean Agustus', (SELECT id FROM categories WHERE name='Marketing'));
    INSERT INTO employees(name, department_id) VALUES('Alicia Keys', (SELECT id FROM categories WHERE name='Sales'));
    INSERT INTO employees(name, department_id) VALUES('Cameron Renalt', (SELECT id FROM categories WHERE name='Sales'));
    INSERT INTO employees(name, department_id) VALUES('Victoria El', (SELECT id FROM categories WHERE name='HR'));
    INSERT INTO employees(name, department_id) VALUES('Alex Reynolds', (SELECT id FROM categories WHERE name='HR'));
    `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
}

init();
