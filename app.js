var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// const jwt = require('jsonwebtoken'); // 移除 jsonwebtoken

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'db', 'sqlite.db'); // 假設您的 db 資料夾在專案根目錄下
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功開啟資料庫');
    db.run('PRAGMA busy_timeout = 5000'); // 設定忙碌超時時間
  }
});
db.serialize();

// 硬編碼管理員帳號密碼 (簡化驗證方式，真實應用請使用資料庫和加密)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'adminpassword'; // 請自行設定一個密碼

// 查詢所有酒價
app.get('/api/quotes', (req, res) => {
  db.all('SELECT * FROM alchol_quotes', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 查詢所有酒價資料 (支援篩選查詢)
app.post('/api/prices', (req, res) => {
  const { date, price_14, price_133, price_134, price_135, price_136 } = req.body;
  let sql = `SELECT date, price_14 AS 酒, price_133 AS 米酒, price_134 AS 啤酒, price_135 AS 高粱酒, price_136 AS 其他酒 FROM alchol_prices WHERE 1=1`;
  const params = [];

  if (date) {
    // 僅查詢年份（如 100年）
    if (/^\d+年$/.test(date)) {
      sql += ` AND date LIKE ?`;
      params.push(`${date}%`);
    } else if (/^\d+年\d+月$/.test(date)) {
      // 精確查詢年月
      sql += ` AND date = ?`;
      params.push(date);
    } else if (/^\d+月$/.test(date)) {
      // 只查詢月份，找所有 xx年x月，避免1月查到11月、12月
      const monthNum = parseInt(date);
      sql += ` AND date LIKE ?`;
      params.push(`%年${monthNum}月`);
    } else {
      // 其他情況保留模糊查詢
      sql += ` AND date LIKE ?`;
      params.push(`%${date}%`);
    }
  }
  if (price_14) {
    sql += ` AND price_14 = ?`;
    params.push(price_14);
  }
  if (price_133) {
    sql += ` AND price_133 = ?`;
    params.push(price_133);
  }
  if (price_134) {
    sql += ` AND price_134 = ?`;
    params.push(price_134);
  }
  if (price_135) {
    sql += ` AND price_135 = ?`;
    params.push(price_135);
  }
  if (price_136) {
    sql += ` AND price_136 = ?`;
    params.push(price_136);
  }

  // **** 這裡進行修改：將 DESC 改為 ASC，並用年份、月份數字排序 ****
  sql += ` ORDER BY CAST(SUBSTR(date, 1, INSTR(date, '年')-1) AS INTEGER) ASC, CAST(REPLACE(SUBSTR(date, INSTR(date, '年')+1), '月', '') AS INTEGER) ASC`; // 根據日期升序排列

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增一筆酒價資料 (後端不執行 JWT 驗證，由前端控制 UI 可見性)
app.post('/api/insert', (req, res) => {
  const { date, price_14, price_133, price_134, price_135, price_136 } = req.body;

  if (!date) {
    res.status(400).send('缺少必要欄位');
    return;
  }

  // 將 "-" 或空字串轉為 NULL，否則保留原值
  const values = [price_14, price_133, price_134, price_135, price_136].map(v => (v === '-' || v === '' ? null : v));

  const sql = 'INSERT INTO alchol_prices (date, price_14, price_133, price_134, price_135, price_136) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [date, ...values], function(err) {
    if (err) {
      res.status(500).send('新增失敗: ' + err.message);
    } else {
      res.send('新增成功，ID: ' + this.lastID);
    }
  });
});

// 刪除一筆酒價資料 (後端不執行 JWT 驗證，由前端控制 UI 可見性)
app.post('/api/delete', (req, res) => {
  const { date } = req.body;

  if (!date) {
    res.status(400).send('缺少必要欄位: 日期');
    return;
  }

  const sql = `DELETE FROM alchol_prices WHERE date = ?`;
  db.run(sql, [date], function(err) {
    if (err) {
      res.status(500).send('刪除失敗: ' + err.message);
    } else if (this.changes === 0) {
      res.status(404).send('查無此日期資料，無法刪除');
    } else {
      res.send('刪除成功');
    }
  });
});

// 管理員登入路由
app.post('/api/adminLogin', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // 登入成功，返回一個標誌
    res.json({ message: '登入成功', isAdmin: true });
  } else {
    res.status(401).json({ message: '帳號或密碼錯誤', isAdmin: false });
  }
});


module.exports = app;