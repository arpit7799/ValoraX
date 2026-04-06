const express  = require("express");
const path     = require("path");
const session  = require("express-session");
const bcrypt   = require("bcrypt");
const db       = require("./db");
require("dotenv").config();

const app = express();

// ============================================
// SESSION (only once)
// ============================================
app.use(session({
  secret:            process.env.SESSION_SECRET || "valorant_secret_key",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // XSS protection
    secure:   false,     // set true in production with HTTPS
    sameSite: 'strict',  // CSRF protection
    maxAge:   1000 * 60 * 60 * 24  // 24 hours
  }
}));

// ============================================
// GLOBAL LOCALS — currentUser in all EJS views
// ============================================
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ============================================
// CORE MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ============================================
// AUTH MIDDLEWARE
// ============================================
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") return next();
  res.status(403).send("⛔ Access Denied: Admins only.");
}

// ============================================
// FLASH HELPERS
// ============================================
function setFlash(req, message) {
  req.session.flash = message;
}

function getFlash(req) {
  const msg = req.session.flash || null;
  delete req.session.flash;
  return msg;
}

// ============================================
// HOME
// ============================================
app.get("/", (req, res) => {
  res.render("index");
});

// ============================================
// AUTH — REGISTER
// ============================================
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    res.redirect("/login");
  } catch (err) {
    console.error("Register error:", err);
    const message = err.code === "ER_DUP_ENTRY"
      ? "Username or email already exists."
      : "Registration failed. Please try again.";
    res.render("register", { error: message });
  }
});

// ============================================
// AUTH — LOGIN
// ============================================
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.render("login", { error: "No account found with that email." });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render("login", { error: "Incorrect password." });
    }

    req.session.user = {
      id:       user.id,
      username: user.username,
      role:     user.role
    };

    if (user.role === "admin") return res.redirect("/manage-items");
    res.redirect("/");

  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "Login failed. Please try again." });
  }
});

// ============================================
// AUTH — LOGOUT
// ============================================
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ============================================
// DASHBOARD
// ============================================
app.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.created_at, o.total_amount,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );
    res.render("dashboard", { orders });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.render("dashboard", { orders: [] });
  }
});

// ============================================
// MAPS
// ============================================
app.get("/maps", async (req, res) => {
  try {
    const [maps] = await db.query("SELECT * FROM maps ORDER BY name ASC");
    res.render("maps", { maps });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

// ============================================
// AGENTS
// ============================================
app.get("/agents", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM agents ORDER BY name ASC");
    res.render("agents", { agents: rows });
  } catch (err) {
    console.error("Agents error:", err);
    res.render("agents", { agents: [] });
  }
});

// ============================================
// STORE
// ============================================
app.get("/store", async (req, res) => {
  try {
    const [skins] = await db.query("SELECT * FROM skins ORDER BY name ASC");
    res.render("store", { skins });
  } catch (err) {
    console.error("Store error:", err);
    res.render("store", { skins: [] });
  }
});

// ============================================
// PURCHASE
// ============================================
app.post("/purchase", isLoggedIn, async (req, res) => {
  const { skin_id } = req.body;
  const userId      = req.session.user.id;

  try {
    const [skinRows] = await db.query(
      "SELECT * FROM skins WHERE id = ?",
      [skin_id]
    );

    if (skinRows.length === 0) {
      return res.status(404).send("Skin not found.");
    }

    const skin = skinRows[0];

    const [orderResult] = await db.query(
      "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)",
      [userId, skin.price]
    );

    const orderId = orderResult.insertId;

    await db.query(
      "INSERT INTO order_items (order_id, skin_id, quantity) VALUES (?, ?, ?)",
      [orderId, skin_id, 1]
    );

    res.render("payment_sucessfull", { skin, order_id: orderId });

  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).send("Purchase failed. Please try again.");
  }
});

// ============================================
// ADMIN — MANAGE SKINS
// ============================================

// READ — list all skins
app.get("/manage-items", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM skins ORDER BY name ASC");
    res.render("manage-items", {
      items: rows,
      flash: getFlash(req)
    });
  } catch (err) {
    console.error("Manage items error:", err);
    res.render("manage-items", { items: [], flash: null });
  }
});

// CREATE — add new skin
app.post("/manage-items/add", isAdmin, async (req, res) => {
  const { name, weapon_type, tier, price, image, video } = req.body;
  try {
    await db.query(
      "INSERT INTO skins (name, weapon_type, tier, price, image, video) VALUES (?, ?, ?, ?, ?, ?)",
      [name, weapon_type, tier, price || 0, image, video || null]
    );
    setFlash(req, `"${name}" was added to the store successfully.`);
    res.redirect("/manage-items");
  } catch (err) {
    console.error("Add skin error:", err);
    res.redirect("/manage-items");
  }
});

// READ — edit form
app.get("/manage-items/edit/:id", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM skins WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) return res.redirect("/manage-items");
    res.render("edit-items", { item: rows[0] });
  } catch (err) {
    console.error("Edit load error:", err);
    res.redirect("/manage-items");
  }
});

// UPDATE — save edited skin
app.post("/manage-items/update/:id", isAdmin, async (req, res) => {
  const { name, weapon_type, tier, price, image, video } = req.body;
  try {
    await db.query(
      `UPDATE skins
       SET name=?, weapon_type=?, tier=?, price=?, image=?, video=?
       WHERE id=?`,
      [name, weapon_type, tier, price || 0, image, video || null, req.params.id]
    );
    setFlash(req, `"${name}" was updated successfully.`);
    res.redirect("/manage-items");
  } catch (err) {
    console.error("Update skin error:", err);
    res.redirect("/manage-items");
  }
});

// DELETE — remove skin
app.get("/manage-items/delete/:id", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT name FROM skins WHERE id = ?",
      [req.params.id]
    );
    const name = rows[0]?.name || "Skin";
    await db.query("DELETE FROM skins WHERE id = ?", [req.params.id]);
    setFlash(req, `"${name}" was deleted from the store.`);
    res.redirect("/manage-items");
  } catch (err) {
    console.error("Delete skin error:", err);
    res.redirect("/manage-items");
  }
});

// ============================================
// OTHER ROUTES
// ============================================
app.get("/download",      (req, res) => res.render("download"));
app.get("/random-agents", (req, res) => res.render("random-agents"));
app.get("/agents-oop",    (req, res) => res.render("agents-oop"));

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).send(`
    <div style="font-family:sans-serif;text-align:center;padding:80px;background:#0f1923;color:white;">
      <h1 style="color:#ff4655;font-size:80px;margin:0">404</h1>
      <p style="font-size:20px">Page not found</p>
      <a href="/" style="color:#ff4655">← Return Home</a>
    </div>
  `);
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});