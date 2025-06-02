var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'db', 'sqlite.db');
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功開啟資料庫');
    db.run('PRAGMA busy_timeout = 5000');
  }
});
db.serialize();

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

// 查詢所有酒價資料
app.get('/api/prices', (req, res) => {
  db.all(`SELECT date, price_14 AS 酒, price_133 AS 米酒, price_134 AS 啤酒, price_135 AS 高粱酒, price_136 AS 其他酒 
    FROM alchol_prices 
    ORDER BY CAST(substr(date, 1, instr(date, '年')-1) AS INTEGER) ASC, 
             CASE WHEN instr(date, '月') > 0 THEN CAST(substr(date, instr(date, '年')+1, instr(date, '月')-instr(date, '年')-1) AS INTEGER) ELSE 0 END ASC`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 支援 POST 查詢酒價資料
app.post('/api/prices', (req, res) => {
  const { date, price_14, price_133, price_134, price_135, price_136 } = req.body;
  let sql = 'SELECT date, price_14 AS 酒, price_133 AS 米酒, price_134 AS 啤酒, price_135 AS 高粱酒, price_136 AS 其他酒 FROM alchol_prices WHERE 1=1';
  const params = [];
  if (date) {
    // 僅查詢「X月」時，查詢所有年份的該月
    const monthMatch = date.match(/^([0-9]{1,2})月$/);
    // 僅查詢「X年」時，查詢該年所有資料
    const yearMatch = date.match(/^([0-9]{2,3})年$/);
    if (monthMatch) {
      // 僅查詢 xx年2月 這種格式，避免 12月、11月被包含
      sql += ' AND date GLOB ?';
      params.push('*年' + date);
    } else if (yearMatch) {
      sql += ' AND date LIKE ?';
      params.push(date + '%');
    } else {
      sql += ' AND date = ?';
      params.push(date);
    }
  }
  if (price_14) { sql += ' AND price_14 = ?'; params.push(price_14); }
  if (price_133) { sql += ' AND price_133 = ?'; params.push(price_133); }
  if (price_134) { sql += ' AND price_134 = ?'; params.push(price_134); }
  if (price_135) { sql += ' AND price_135 = ?'; params.push(price_135); }
  if (price_136) { sql += ' AND price_136 = ?'; params.push(price_136); }
  sql += ` ORDER BY CAST(substr(date, 1, instr(date, '年')-1) AS INTEGER) ASC, 
             CASE WHEN instr(date, '月') > 0 THEN CAST(substr(date, instr(date, '年')+1, instr(date, '月')-instr(date, '年')-1) AS INTEGER) ELSE 0 END ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增一筆酒價資料
app.post('/api/insert', (req, res) => {
  const { date, price_14, price_133, price_134, price_135, price_136 } = req.body;
  if (!date || !price_14 || !price_133 || !price_134 || !price_135 || !price_136) {
    res.status(400).send('缺少必要欄位');
    return;
  }
  const sql = 'INSERT INTO alchol_prices (date, price_14, price_133, price_134, price_135, price_136) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [date, price_14, price_133, price_134, price_135, price_136], function(err) {
    if (err) {
      res.status(500).send('新增失敗: ' + err.message);
    } else {
      res.send('新增成功，ID: ' + this.lastID);
    }
  });
});

// 刪除一筆酒價資料
app.post('/api/delete', (req, res) => {
  const { date, price_14, price_133, price_134, price_135, price_136 } = req.body;
  if (!date || !price_14 || !price_133 || !price_134 || !price_135 || !price_136) {
    res.status(400).send('缺少必要欄位');
    return;
  }
  const sql = 'DELETE FROM alchol_prices WHERE date = ? AND price_14 = ? AND price_133 = ? AND price_134 = ? AND price_135 = ? AND price_136 = ?';
  db.run(sql, [date, price_14, price_133, price_134, price_135, price_136], function(err) {
    if (err) {
      res.status(500).send('刪除失敗: ' + err.message);
    } else if (this.changes === 0) {
      res.send('查無此資料，未刪除');
    } else {
      res.send('刪除成功');
    }
  });
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
