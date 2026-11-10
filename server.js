
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const app = express();

app.disable("x-powered-by");

if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}

app.use(helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"]
        }
    }
}));
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    process.env.CLIENT_URL
];

app.use(cors({
    origin: (origin, callback) => {
        console.log("Request Origin:", origin);

        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// Load existing Mongoose models.
require("./school-management/models");

// Serve the actual frontend folder.
app.use(express.static(
    path.join(__dirname, "school-management", "public"),
    { index: "index.html", dotfiles: "deny" }
));

// Authentication routes.
app.use(
    "/api/auth",
    require("./school-management/routes/authRoutes")
);

    // Admin dashboard routes.
app.use(
    "/api/dashboard",
    require("./school-management/routes/dashboardRoutes")
);

   // Student management routes.
app.use(
    "/api/students",
    require("./school-management/routes/studentRoutes")
);

  // Teacher management routes.
app.use(
    "/api/teachers",
    require("./school-management/routes/teacherRoutes")
);
    // Subject management routes.
app.use(
    "/api/subjects",
     require("./school-management/routes/subjectRoutes"));
     
    //attendance management routes.
app.use(
    "/api/attendance",
     require("./school-management/routes/attendanceRoutes"));

      // Submission management routes.

app.use(
    "/api/submissions",
     require("./school-management/routes/submissionRoutes"));

     // Assignment management routes.
app.use(
    "/api/assignments",
     require("./school-management/routes/assignmentRoutes"));




    // Class management routes.
app.use(
    "/api/classes",
    require("./school-management/routes/classRoutes")
);



    // assessments management routes
app.use(
    "/api/assessments",
     require("./school-management/routes/assessmentRoutes"));

    // Notice management routes.
app.use(
    "/api/notices",
     require("./school-management/routes/noticeRoutes"));

app.use(
    "/school-assets",
    express.static(
        path.join(__dirname, "school-management", "uploads", "settings")
    )
);

      // Settings management routes.
app.use(
    "/api/settings",
     require("./school-management/routes/settingsRoutes"));


app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "School Management API is running.",
        database: mongoose.connection.readyState === 1
            ? "connected"
            : "disconnected",
        environment: process.env.NODE_ENV || "development"
    });
});

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to School Management API",
        version: "1.0.0"
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Requested resource not found."
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.statusCode
            ? err.message
            : "Internal server error."
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("----------------------------------");
            console.log("School Management System Started");
            console.log(`URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
            console.log(`Port: ${PORT}`);
            console.log("----------------------------------");
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
