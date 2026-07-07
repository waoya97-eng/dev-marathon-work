const express = require("express");
const cors = require('cors'); // 重複しないように上に1つだけにまとめました
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

// プロジェクトルートの .env ファイルを手動で読み込む
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const delimiterIdx = trimmed.indexOf("=");
      if (delimiterIdx > 0) {
        const key = trimmed.substring(0, delimiterIdx).trim();
        let val = trimmed.substring(delimiterIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const app = express();
const port = 5955;

// ミドルウェアの設定（CORSの有効化とBODYの解析）
app.use(cors()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQLへの接続設定（hostをdbに変更済み）
const pool = new Pool({
  user: process.env.POSTGRES_USER || "user_5955", 
  host: process.env.POSTGRES_HOST || "db",
  database: process.env.POSTGRES_DB || "crm_5955", 
  password: process.env.POSTGRES_PASSWORD || "pass_5955", 
  port: process.env.POSTGRES_PORT || 5432,
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

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const reqPath = req.path;
  const parts = reqPath.split('/').filter(Boolean);

  const firstPart = parts[0];
  if (firstPart === 'customers' || firstPart === 'add-customer') {
    return next();
  }

  const searchPaths = [
    path.join(__dirname, '../web', reqPath),
  ];

  if (parts.length > 1) {
    searchPaths.push(path.join(__dirname, '../web', parts.slice(1).join('/')));
  }

  const finalSearchPaths = [];
  for (const p of searchPaths) {
    finalSearchPaths.push(p);
    finalSearchPaths.push(path.join(p, 'index.html'));
  }

  for (const filePath of finalSearchPaths) {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
      }
    } catch (e) {
      // Ignore
    }
  }

  next();
});

app.use(express.static("public"));
