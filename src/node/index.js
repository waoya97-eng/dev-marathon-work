const express = require("express");
const cors = require('cors'); // 重複しないように上に1つだけにまとめました
const { Pool } = require("pg");

const app = express();
const port = 5955;

// ミドルウェアの設定（CORSの有効化とBODYの解析）
app.use(cors()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQLへの接続設定（hostをdbに変更済み）
const pool = new Pool({
  user: "user_5955", 
  host: "db",
  database: "crm_5955", 
  password: "pass_5955", 
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customerData = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [id]);
    
    if (customerData.rows.length > 0) {
      res.json(customerData.rows[0]);
    } else {
      res.status(404).send("Customer not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error " + err);
  }
});

app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;
    
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM customers WHERE customer_id = $1", [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Customer not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, industry, contact, location } = req.body;
    const result = await pool.query(
      "UPDATE customers SET company_name = $1, industry = $2, contact = $3, location = $4, updated_date = CURRENT_TIMESTAMP WHERE customer_id = $5 RETURNING *",
      [companyName, industry, contact, location, id]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, customer: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "Customer not found" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

app.use(express.static("public"));
