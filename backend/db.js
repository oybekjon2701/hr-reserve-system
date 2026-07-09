const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'hr_reserve.db');
let db = null;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      email TEXT,
      role TEXT DEFAULT 'hr_manager',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_submission_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      birth_date TEXT,
      gender TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      education_level TEXT,
      university TEXT,
      specialty TEXT,
      graduation_year TEXT,
      total_experience TEXT,
      last_workplace TEXT,
      last_position TEXT,
      resignation_reason TEXT,
      computer_skill_level TEXT,
      known_programs TEXT,
      language_skills TEXT,
      desired_position TEXT,
      expected_salary TEXT,
      availability TEXT,
      ready_full_time TEXT,
      status TEXT DEFAULT 'yangi',
      score INTEGER DEFAULT 0,
      score_breakdown TEXT,
      tags TEXT DEFAULT '[]',
      summary TEXT DEFAULT '',
      ai_analysis TEXT DEFAULT '{}',
      notes TEXT DEFAULT '',
      source TEXT DEFAULT 'google_form',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      is_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes
  try { db.run('CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidates(score)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_status_history_candidate ON status_history(candidate_id)'); } catch {}

  // Seed default admin user
  const existing = db.exec('SELECT id FROM users WHERE username = \'admin\'');
  if (!existing.length || !existing[0].values.length) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO users (username, password_hash, full_name, email, role)
            VALUES ('admin', '${hash.replace(/'/g, "''")}', 'Administrator', 'admin@hr-system.uz', 'administrator')`);
  }

  saveDb();
  console.log('Database ready at:', DB_PATH);
}

// Helper: run a query and return all rows as objects
function queryAll(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run a query and return first row as object
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
function queryRun(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params.length) stmt.bind(params);
  stmt.step();
  stmt.free();
  const lastId = d.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];
  const changes = d.getRowsModified();
  saveDb();
  return { lastInsertRowid: lastId, changes };
}

// Helper: run raw SQL with no return
function queryExec(sql) {
  const d = getDb();
  d.run(sql);
  saveDb();
}

module.exports = { initDb, getDb, queryAll, queryOne, queryRun, queryExec, saveDb };
