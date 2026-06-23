const express = require('express');
const { Client, Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const ADMIN_PASSWORD = 'admin123'; // Simple admin password
const SESSION_TOKEN = 'admin-session-token-secret-123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Database Connection Config
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres123',
};

let pool;

const mockDb = {
  bio: [
    {
      id: 1,
      name: "Soe Ye Htut",
      title: "Frontend Developer",
      description: "Motivated junior developer with a strong foundation seeking to contribute to a dynamic team. Eager to learn, enhance problem-solving skills, and work on innovative projects in a collaborative environment.",
      avatar_url: "image/image/home-img.png",
      about_image_url: "image/image/cvimage.png"
    }
  ],
  projects: [
    {
      id: 1,
      title: "Fitness Website",
      description: "This website showcases my expertise in web design, blending user experience principles with aesthetic detail. It's crafted meticulously to meet functional needs while providing an engaging visual journey.",
      image_url: "image/image/dobugym.png",
      project_url: "https://dobu-iota.vercel.app/About.html",
      type: "frontend"
    },
    {
      id: 2,
      title: "Food Website",
      description: "This website showcases innovation and creativity with a user-centric design, responsive layout, and minimalist approach for engaging visitors.",
      image_url: "image/image/mealonwheel.png",
      project_url: "#",
      type: "frontend"
    },
    {
      id: 3,
      title: "Car Sale Portal",
      description: "This used car sales portal streamlines the buying and selling of pre-owned vehicles. It features user-friendly functions like test drives, bidding, and comprehensive user and admin management.",
      image_url: "image/image/usedcarportal.png",
      project_url: "#",
      type: "frontend"
    }
  ],
  section_settings: [
    { id: 1, section_id: 'home', title: 'Home Banner', is_visible: true },
    { id: 2, section_id: 'about', title: 'About Me', is_visible: true },
    { id: 3, section_id: 'services', title: 'My Services', is_visible: true },
    { id: 4, section_id: 'experience', title: 'My Journey (Timeline)', is_visible: true },
    { id: 5, section_id: 'skills', title: 'Technical Skills', is_visible: true },
    { id: 6, section_id: 'soft-skills', title: 'Soft Skills', is_visible: true },
    { id: 7, section_id: 'portfolio', title: 'Latest Projects', is_visible: true },
    { id: 8, section_id: 'contact', title: 'Contact Me', is_visible: true }
  ],
  journey: [
    {
      id: 1,
      title: "Freelance Web Developer",
      description: "Developing frontend solutions, responsive web interfaces, and single-page apps for local and remote clients.",
      time_period: "2024 - Present"
    },
    {
      id: 2,
      title: "B.S. in Computer Science",
      description: "Studied software engineering principles, algorithms, database management systems, and web application architectures.",
      time_period: "2021 - 2024"
    }
  ],
  reviews: [],
  messages: []
};

let mockIdCounter = 100;

const mockPool = {
  query: async (sql, params = []) => {
    const q = sql.trim().toLowerCase();
    
    // DDL Statements - ignore
    if (q.startsWith("create table") || q.startsWith("alter table")) {
      return { rows: [], rowCount: 0 };
    }
    
    // SELECT COUNT(*)
    if (q.startsWith("select count(*)")) {
      let count = 0;
      if (q.includes("from bio")) count = mockDb.bio.length;
      else if (q.includes("from projects")) count = mockDb.projects.length;
      else if (q.includes("from section_settings")) count = mockDb.section_settings.length;
      else if (q.includes("from journey")) count = mockDb.journey.length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }
    
    // SELECT ALL
    if (q.startsWith("select *") || q.startsWith("select r.*")) {
      if (q.includes("from bio")) {
        return { rows: mockDb.bio, rowCount: mockDb.bio.length };
      }
      if (q.includes("from section_settings")) {
        return { rows: mockDb.section_settings, rowCount: mockDb.section_settings.length };
      }
      if (q.includes("from projects")) {
        return { rows: mockDb.projects, rowCount: mockDb.projects.length };
      }
      if (q.includes("from journey")) {
        return { rows: mockDb.journey, rowCount: mockDb.journey.length };
      }
      if (q.includes("from messages")) {
        return { rows: mockDb.messages, rowCount: mockDb.messages.length };
      }
      if (q.includes("from reviews")) {
        if (q.includes("project_id=")) {
          const projectId = params[0];
          const filtered = mockDb.reviews.filter(r => r.project_id === Number(projectId));
          return { rows: filtered, rowCount: filtered.length };
        }
        if (q.includes("join projects")) {
          const joined = mockDb.reviews.map(r => {
            const p = mockDb.projects.find(proj => proj.id === r.project_id);
            return { ...r, project_title: p ? p.title : "Unknown Project" };
          });
          return { rows: joined, rowCount: joined.length };
        }
        return { rows: mockDb.reviews, rowCount: mockDb.reviews.length };
      }
    }
    
    // INSERT INTO
    if (q.startsWith("insert into")) {
      mockIdCounter++;
      let newRow = { id: mockIdCounter };
      
      if (q.includes("insert into bio")) {
        newRow = { id: mockIdCounter, name: params[0], title: params[1], description: params[2], avatar_url: params[3], about_image_url: params[4] };
        mockDb.bio.push(newRow);
      }
      else if (q.includes("insert into projects")) {
        newRow = { id: mockIdCounter, title: params[0], description: params[1], image_url: params[2], project_url: params[3], type: params[4] };
        mockDb.projects.push(newRow);
      }
      else if (q.includes("insert into section_settings")) {
        newRow = { id: mockIdCounter, section_id: params[0], title: params[1], is_visible: params[2] };
        mockDb.section_settings.push(newRow);
      }
      else if (q.includes("insert into journey")) {
        newRow = { id: mockIdCounter, title: params[0], description: params[1], time_period: params[2], created_at: new Date() };
        mockDb.journey.push(newRow);
      }
      else if (q.includes("insert into reviews")) {
        newRow = { id: mockIdCounter, project_id: Number(params[0]), reviewer_name: params[1], rating: Number(params[2]), comment: params[3], created_at: new Date() };
        mockDb.reviews.push(newRow);
      }
      else if (q.includes("insert into messages")) {
        newRow = { id: mockIdCounter, name: params[0], email: params[1], phone: params[2], subject: params[3], message: params[4], created_at: new Date() };
        mockDb.messages.push(newRow);
      }
      
      return { rows: [newRow], rowCount: 1 };
    }
    
    // UPDATE
    if (q.startsWith("update")) {
      if (q.includes("update bio")) {
        const row = mockDb.bio.find(b => b.id === Number(params[5])) || mockDb.bio[0] || {};
        row.name = params[0];
        row.title = params[1];
        row.description = params[2];
        row.avatar_url = params[3];
        row.about_image_url = params[4];
        return { rows: [row], rowCount: 1 };
      }
      if (q.includes("update section_settings")) {
        const row = mockDb.section_settings.find(s => s.section_id === params[1]);
        if (row) {
          row.is_visible = params[0] === true || params[0] === 'true';
        }
        return { rows: [row], rowCount: row ? 1 : 0 };
      }
      if (q.includes("update projects")) {
        const row = mockDb.projects.find(p => p.id === Number(params[5]));
        if (row) {
          row.title = params[0];
          row.description = params[1];
          row.image_url = params[2];
          row.project_url = params[3];
          row.type = params[4];
        }
        return { rows: [row], rowCount: row ? 1 : 0 };
      }
      if (q.includes("update journey")) {
        const row = mockDb.journey.find(j => j.id === Number(params[3]));
        if (row) {
          row.title = params[0];
          row.description = params[1];
          row.time_period = params[2];
        }
        return { rows: [row], rowCount: row ? 1 : 0 };
      }
    }
    
    // DELETE
    if (q.startsWith("delete from")) {
      let deletedRow = null;
      const targetId = Number(params[0]);
      
      if (q.includes("from projects")) {
        const index = mockDb.projects.findIndex(p => p.id === targetId);
        if (index !== -1) {
          deletedRow = mockDb.projects.splice(index, 1)[0];
        }
      }
      else if (q.includes("from journey")) {
        const index = mockDb.journey.findIndex(j => j.id === targetId);
        if (index !== -1) {
          deletedRow = mockDb.journey.splice(index, 1)[0];
        }
      }
      else if (q.includes("from reviews")) {
        const index = mockDb.reviews.findIndex(r => r.id === targetId);
        if (index !== -1) {
          deletedRow = mockDb.reviews.splice(index, 1)[0];
        }
      }
      else if (q.includes("from messages")) {
        const index = mockDb.messages.findIndex(m => m.id === targetId);
        if (index !== -1) {
          deletedRow = mockDb.messages.splice(index, 1)[0];
        }
      }
      
      return { rows: deletedRow ? [deletedRow] : [], rowCount: deletedRow ? 1 : 0 };
    }
    
    return { rows: [], rowCount: 0 };
  }
};

// Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === `Bearer ${SESSION_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Initialize DB and Tables
async function initDB() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    console.log("Connecting to cloud database...");
    pool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await pool.query("SELECT 1");
      console.log("Cloud database connected successfully.");
    } catch (err) {
      console.warn("Cloud database connection failed. Falling back to in-memory mock database:", err.message);
      pool = mockPool;
      return;
    }
  } else {
    if (process.env.VERCEL) {
      console.warn("No DATABASE_URL configured on Vercel. Running in-memory mock mode.");
      pool = mockPool;
      return;
    }

    try {
      // Step 1: Connect to default 'postgres' database to ensure 'portfolio_db' exists locally
      const client = new Client({ ...dbConfig, database: 'postgres' });
      await client.connect();
      const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'portfolio_db'");
      if (res.rowCount === 0) {
        console.log("Database 'portfolio_db' does not exist. Creating it...");
        await client.query("CREATE DATABASE portfolio_db");
        console.log("Database 'portfolio_db' created successfully.");
      }
      await client.end();

      // Step 2: Initialize Connection Pool to local 'portfolio_db'
      pool = new Pool({ ...dbConfig, database: 'portfolio_db' });
      await pool.query("SELECT 1");
      console.log("Local database connected successfully.");
    } catch (err) {
      console.warn("Local database connection failed. Falling back to in-memory mock database:", err.message);
      pool = mockPool;
      return;
    }
  }

  // Step 3: Create Tables
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS bio (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      avatar_url VARCHAR(255),
      about_image_url VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(255),
      project_url VARCHAR(255),
      type VARCHAR(50) NOT NULL -- 'frontend' or 'ui_ux'
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      reviewer_name VARCHAR(100) NOT NULL,
      rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      subject VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS section_settings (
      id SERIAL PRIMARY KEY,
      section_id VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(100) NOT NULL,
      is_visible BOOLEAN DEFAULT TRUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journey (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      time_period VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTablesSql);
    // Alter bio table to ensure about_image_url column exists dynamically
    await pool.query("ALTER TABLE bio ADD COLUMN IF NOT EXISTS about_image_url VARCHAR(255)");
    console.log("Tables created or checked successfully.");

    // Seed Bio if empty
    const bioCount = await pool.query("SELECT COUNT(*) FROM bio");
    if (parseInt(bioCount.rows[0].count) === 0) {
      console.log("Seeding default bio...");
      await pool.query(
        "INSERT INTO bio (name, title, description, avatar_url, about_image_url) VALUES ($1, $2, $3, $4, $5)",
        [
          "Soe Ye Htut",
          "Frontend Developer",
          "Motivated junior developer with a strong foundation seeking to contribute to a dynamic team. Eager to learn, enhance problem-solving skills, and work on innovative projects in a collaborative environment.",
          "image/image/home-img.png",
          "image/image/cvimage.png"
        ]
      );
    }

    // Seed Projects if empty
    const projCount = await pool.query("SELECT COUNT(*) FROM projects");
    if (parseInt(projCount.rows[0].count) === 0) {
      console.log("Seeding default projects...");
      const defaultProjects = [
        {
          title: "Fitness Website",
          description: "This website showcases my expertise in web design, blending user experience principles with aesthetic detail. It's crafted meticulously to meet functional needs while providing an engaging visual journey.",
          image_url: "image/image/dobugym.png",
          project_url: "https://dobu-iota.vercel.app/About.html",
          type: "frontend"
        },
        {
          title: "Food Website",
          description: "This website showcases innovation and creativity with a user-centric design, responsive layout, and minimalist approach for engaging visitors.",
          image_url: "image/image/mealonwheel.png",
          project_url: "#",
          type: "frontend"
        },
        {
          title: "Car Sale Portal",
          description: "This used car sales portal streamlines the buying and selling of pre-owned vehicles. It features user-friendly functions like test drives, bidding, and comprehensive user and admin management.",
          image_url: "image/image/usedcarportal.png",
          project_url: "#",
          type: "frontend"
        }
      ];

      for (const proj of defaultProjects) {
        await pool.query(
          "INSERT INTO projects (title, description, image_url, project_url, type) VALUES ($1, $2, $3, $4, $5)",
          [proj.title, proj.description, proj.image_url, proj.project_url, proj.type]
        );
      }
    }

    // Seed Section Settings if empty
    const secCount = await pool.query("SELECT COUNT(*) FROM section_settings");
    if (parseInt(secCount.rows[0].count) === 0) {
      console.log("Seeding default section settings...");
      const defaultSections = [
        { id: 'home', title: 'Home Banner' },
        { id: 'about', title: 'About Me' },
        { id: 'services', title: 'My Services' },
        { id: 'experience', title: 'My Journey (Timeline)' },
        { id: 'skills', title: 'Technical Skills' },
        { id: 'soft-skills', title: 'Soft Skills' },
        { id: 'portfolio', title: 'Latest Projects' },
        { id: 'contact', title: 'Contact Me' }
      ];
      for (const sec of defaultSections) {
        await pool.query(
          "INSERT INTO section_settings (section_id, title, is_visible) VALUES ($1, $2, $3)",
          [sec.id, sec.title, true]
        );
      }
    }

    // Seed Journey if empty
    const journeyCount = await pool.query("SELECT COUNT(*) FROM journey");
    if (parseInt(journeyCount.rows[0].count) === 0) {
      console.log("Seeding default journey items...");
      const defaultJourney = [
        {
          title: "Freelance Web Developer",
          description: "Developing frontend solutions, responsive web interfaces, and single-page apps for local and remote clients.",
          time_period: "2024 - Present"
        },
        {
          title: "B.S. in Computer Science",
          description: "Studied software engineering principles, algorithms, database management systems, and web application architectures.",
          time_period: "2021 - 2024"
        }
      ];
      for (const item of defaultJourney) {
        await pool.query(
          "INSERT INTO journey (title, description, time_period) VALUES ($1, $2, $3)",
          [item.title, item.description, item.time_period]
        );
      }
    }
  } catch (err) {
    console.error("Error setting up database tables/seeding:", err.message);
  }
}

// REST API Endpoints

// 1. Auth Endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: SESSION_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// 2. Bio Endpoints
app.get('/api/bio', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bio ORDER BY id DESC LIMIT 1");
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/bio', authenticateAdmin, async (req, res) => {
  const { name, title, description, avatar_url, about_image_url } = req.body;
  try {
    // Check if bio row exists
    const check = await pool.query("SELECT id FROM bio LIMIT 1");
    let result;
    if (check.rowCount > 0) {
      result = await pool.query(
        "UPDATE bio SET name=$1, title=$2, description=$3, avatar_url=$4, about_image_url=$5 WHERE id=$6 RETURNING *",
        [name, title, description, avatar_url, about_image_url, check.rows[0].id]
      );
    } else {
      result = await pool.query(
        "INSERT INTO bio (name, title, description, avatar_url, about_image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, title, description, avatar_url, about_image_url]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2.5 Section Settings Endpoints
app.get('/api/sections', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM section_settings ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/sections', authenticateAdmin, async (req, res) => {
  const { sections } = req.body;
  try {
    for (const sec of sections) {
      await pool.query(
        "UPDATE section_settings SET is_visible=$1 WHERE section_id=$2",
        [sec.is_visible, sec.section_id]
      );
    }
    const result = await pool.query("SELECT * FROM section_settings ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Projects Endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/projects', authenticateAdmin, async (req, res) => {
  const { title, description, image_url, project_url, type } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO projects (title, description, image_url, project_url, type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, image_url, project_url, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/projects/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, project_url, type } = req.body;
  try {
    const result = await pool.query(
      "UPDATE projects SET title=$1, description=$2, image_url=$3, project_url=$4, type=$5 WHERE id=$6 RETURNING *",
      [title, description, image_url, project_url, type, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/projects/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM projects WHERE id=$1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully', project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Reviews Endpoints
app.get('/api/projects/:projectId/reviews', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM reviews WHERE project_id=$1 ORDER BY id DESC", [projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:projectId/reviews', async (req, res) => {
  const { projectId } = req.params;
  const { reviewer_name, rating, comment } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO reviews (project_id, reviewer_name, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [projectId, reviewer_name, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/reviews', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, p.title as project_title 
      FROM reviews r 
      JOIN projects p ON r.project_id = p.id 
      ORDER BY r.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/reviews/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM reviews WHERE id=$1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully', review: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Messages Endpoints
app.post('/api/messages', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO messages (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, phone, subject, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/messages', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM messages ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/messages/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM messages WHERE id=$1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully', message: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5.5 Journey (Experience & Education) Endpoints
app.get('/api/journey', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM journey ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/journey', authenticateAdmin, async (req, res) => {
  const { title, description, time_period } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO journey (title, description, time_period) VALUES ($1, $2, $3) RETURNING *",
      [title, description, time_period]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/journey/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, time_period } = req.body;
  try {
    const result = await pool.query(
      "UPDATE journey SET title=$1, description=$2, time_period=$3 WHERE id=$4 RETURNING *",
      [title, description, time_period, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Journey item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/journey/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM journey WHERE id=$1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Journey item not found' });
    }
    res.json({ message: 'Journey item deleted successfully', journey: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Image Upload Endpoint
app.post('/api/admin/upload', authenticateAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const https = require('https');

  try {
    const imgbbKey = process.env.IMGBB_API_KEY;

    // 1. If ImgBB API key is provided, use ImgBB (recommended for Vercel and local)
    if (imgbbKey) {
      console.log("Uploading to ImgBB cloud storage...");
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${req.file.originalname}"\r\nContent-Type: ${req.file.mimetype}\r\n\r\n`);
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const bodyBuffer = Buffer.concat([header, req.file.buffer, footer]);

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length
        }
      };

      const fileUrl = await new Promise((resolve, reject) => {
        const imgbbReq = https.request(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, requestOptions, (imgbbRes) => {
          let responseData = '';
          imgbbRes.on('data', chunk => responseData += chunk);
          imgbbRes.on('end', () => {
            if (imgbbRes.statusCode === 200) {
              try {
                const parsed = JSON.parse(responseData);
                if (parsed.success && parsed.data && parsed.data.url) {
                  resolve(parsed.data.url);
                } else {
                  reject(new Error(parsed.error ? parsed.error.message : "Unknown ImgBB error"));
                }
              } catch (e) {
                reject(new Error("Failed to parse ImgBB response"));
              }
            } else {
              reject(new Error(`ImgBB returned status ${imgbbRes.statusCode}`));
            }
          });
        });

        imgbbReq.on('error', reject);
        imgbbReq.write(bodyBuffer);
        imgbbReq.end();
      });

      console.log("Uploaded successfully to ImgBB:", fileUrl);
      return res.json({ fileUrl });
    }

    // 2. If no ImgBB key is provided and we are on Vercel, ask user to configure it
    if (process.env.VERCEL) {
      return res.status(400).json({ 
        error: "Image uploads are disabled on Vercel because the filesystem is read-only. To enable them, please sign up for a free key at https://imgbb.com/ and add the 'IMGBB_API_KEY' environment variable in your Vercel project settings." 
      });
    }

    // 3. Local mode only: Try Catbox first
    try {
      console.log("Uploading to Catbox cloud storage (local mode)...");
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const header1 = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`);
      const header2 = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${req.file.originalname}"\r\nContent-Type: ${req.file.mimetype}\r\n\r\n`);
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const bodyBuffer = Buffer.concat([header1, header2, req.file.buffer, footer]);

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const fileUrl = await new Promise((resolve, reject) => {
        const catboxReq = https.request('https://catbox.moe/user/api.php', requestOptions, (catboxRes) => {
          let responseData = '';
          catboxRes.on('data', chunk => responseData += chunk);
          catboxRes.on('end', () => {
            if (catboxRes.statusCode === 200) {
              resolve(responseData.trim());
            } else {
              reject(new Error(`Catbox returned status ${catboxRes.statusCode}`));
            }
          });
        });

        catboxReq.on('error', reject);
        catboxReq.write(bodyBuffer);
        catboxReq.end();
      });

      console.log("Uploaded successfully to Catbox:", fileUrl);
      return res.json({ fileUrl });

    } catch (catboxErr) {
      console.warn("Catbox upload failed, saving locally:", catboxErr.message);

      // 4. Local mode only fallback: Save file to local uploads directory
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + path.extname(req.file.originalname);
      const localPath = path.join(uploadsDir, filename);
      fs.writeFileSync(localPath, req.file.buffer);
      const fileUrl = `/uploads/${filename}`;
      console.log("Saved file locally:", fileUrl);
      return res.json({ fileUrl });
    }

  } catch (err) {
    console.error("Upload error:", err.message);
    return res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

// Serve uploads folder statically
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files from current directory
app.use(express.static(__dirname));

// Direct any dashboard/admin fallback if needed, but static serving does it.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server after DB init (conditional for Vercel serverless mode)
if (!process.env.VERCEL) {
  initDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  });
} else {
  // In Vercel serverless functions, we initialize the DB, but don't call app.listen()
  initDB();
}

module.exports = app;
