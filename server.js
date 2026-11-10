
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

// Hide Express information
app.disable("x-powered-by");

// Trust Render proxy
if (
    process.env.TRUST_PROXY === "true" ||
    process.env.NODE_ENV === "production"
) {
    app.set("trust proxy", 1);
}

// Allowed frontend origins
const allowedOrigins = new Set(
    [
        "https://school-management-1-vdyn.onrender.com",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5173",
        process.env.CLIENT_URL
    ]
        .filter(Boolean)
        .map(origin => origin.trim().replace(/\/$/, ""))
);

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        console.log("Request Origin:", origin);

        // Allow requests without Origin header
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin
            .trim()
            .replace(/\/$/, "");

        if (allowedOrigins.has(normalizedOrigin)) {
            return callback(null, true);
        }

        console.log("Blocked Origin:", normalizedOrigin);

        return callback(new Error("Origin not allowed by CORS"));
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],

    optionsSuccessStatus: 204
}));

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: {
        policy: "same-site"
    },

    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],

            scriptSrc: ["'self'"],

            styleSrc: ["'self'"],

            imgSrc: [
                "'self'",
                "data:",
                "blob:"
            ],

            connectSrc: [
                "'self'",
                "https://school-management-1-vdyn.onrender.com",
                "http://localhost:3000",
                "http://localhost:5000",
                "http://localhost:5173",
                ...(process.env.CLIENT_URL
                    ? [process.env.CLIENT_URL]
                    : [])
            ],

            objectSrc: ["'none'"],

            baseUri: ["'self'"],

            frameAncestors: ["'none'"]
        }
    }
}));

// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
}));

// Body parsers
app.use(express.json({
    limit: "1mb"
}));

app.use(express.urlencoded({
    extended: false,
    limit: "1mb"
}));

app.use(cookieParser());

// MongoDB sanitization
app.use(mongoSanitize());

// Development logging
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// Load existing Mongoose models
require("./school-management/models");

// Serve frontend files
app.use(express.static(
    path.join(__dirname, "school-management", "public"),
    {
        index: "index.html",
        dotfiles: "deny"
    }
));

// Authentication routes
app.use(
    "/api/auth",
    require("./school-management/routes/authRoutes")
);

// Admin dashboard routes
app.use(
    "/api/dashboard",
    require("./school-management/routes/dashboardRoutes")
);

// Student management routes
app.use(
    "/api/students",
    require("./school-management/routes/studentRoutes")
);

// Teacher management routes
app.use(
    "/api/teachers",
    require("./school-management/routes/teacherRoutes")
);

// Subject management routes
app.use(
    "/api/subjects",
    require("./school-management/routes/subjectRoutes")
);

// Attendance management routes
app.use(
    "/api/attendance",
    require("./school-management/routes/attendanceRoutes")
);

// Submission management routes
app.use(
    "/api/submissions",
    require("./school-management/routes/submissionRoutes")
);

// Assignment management routes
app.use(
    "/api/assignments",
    require("./school-management/routes/assignmentRoutes")
);

// Class management routes
app.use(
    "/api/classes",
    require("./school-management/routes/classRoutes")
);

// Assessment management routes
app.use(
    "/api/assessments",
    require("./school-management/routes/assessmentRoutes")
);

// Notice management routes
app.use(
    "/api/notices",
    require("./school-management/routes/noticeRoutes")
);

// School settings assets
app.use(
    "/school-assets",
    express.static(
        path.join(
            __dirname,
            "school-management",
            "uploads",
            "settings"
        )
    )
);

// Settings management routes
app.use(
    "/api/settings",
    require("./school-management/routes/settingsRoutes")
);

// API health check
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

// API welcome route
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to School Management API",
        version: "1.0.0"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Requested resource not found."
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Application Error:", err);

    res.status(err.statusCode || 500).json({
        success: false,

        message: err.statusCode
            ? err.message
            : "Internal server error."
    });
});

// Render port configuration
const PORT = process.env.PORT || 5000;

// Start server
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("----------------------------------");
            console.log("School Management System Started");
            console.log(
                `URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`
            );
            console.log(`Port: ${PORT}`);
            console.log("----------------------------------");
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
}

// Start only when executed directly
if (require.main === module) {
    startServer();
}

module.exports = app;
