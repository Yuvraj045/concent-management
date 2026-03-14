const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
const User = require("../models/User");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// GET /register
router.get("/register", (req, res) => {
    res.render("register", { error: null, success: null });
});

// POST /register
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    console.log(process.env.SENDGRID_API_KEY);
    try {
        const existing = await User.findOne({ email });
        if (existing)
            return res.render("register", {
                error: "Email already registered.",
                success: null,
            });

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ email, password: hashed });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        const link = `${process.env.BASE_URL}/verify-email/${token}`;
        console.log(process.env.SENDGRID_API_KEY);
        await sgMail.send({
            to: email,
            from: process.env.FROM_EMAIL,
            subject: "Verify your email",
            html: `<p>Click <a href="${link}">here</a> to verify your email. Link expires in 1 hour.</p>`,
        });

        res.render("register", {
            error: null,
            success:
                "Registration successful! Check your email to verify your account.",
        });
    } catch (err) {
        console.error(err);
        res.render("register", {
            error: "Registration failed. Please try again.",
            success: null,
        });
    }
});

// GET /verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.userId, { isVerified: true });
        res.render("login", {
            error: null,
            success: "Email verified! You can now log in.",
        });
    } catch (err) {
        res.render("login", {
            error: "Verification link is invalid or expired.",
            success: null,
        });
    }
});

// GET /login
router.get("/login", (req, res) => {
    res.render("login", { error: null, success: null });
});

// POST /login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.render("login", {
                error: "Invalid email or password.",
                success: null,
            });
        if (!user.isVerified)
            return res.render("login", {
                error: "Please verify your email first.",
                success: null,
            });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.render("login", {
                error: "Invalid email or password.",
                success: null,
            });

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.redirect("/dashboard");
    } catch (err) {
        console.error(err);
        res.render("login", {
            error: "Login failed. Please try again.",
            success: null,
        });
    }
});

// GET /logout
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

// GET /reset-password
router.get("/reset-password", (req, res) => {
    res.render("reset-password", {
        error: null,
        success: null,
        step: "request",
    });
});

// POST /reset-password (request reset link)
router.post("/reset-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return res.render("reset-password", {
                error: null,
                success: "If that email exists, a reset link has been sent.",
                step: "request",
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        user.resetToken = token;
        user.resetExpiry = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const link = `${process.env.BASE_URL}/reset-password/confirm/${token}`;
        await sgMail.send({
            to: email,
            from: process.env.FROM_EMAIL,
            subject: "Reset your password",
            html: `<p>Click <a href="${link}">here</a> to reset your password. Link expires in 1 hour.</p>`,
        });

        res.render("reset-password", {
            error: null,
            success: "If that email exists, a reset link has been sent.",
            step: "request",
        });
    } catch (err) {
        console.error(err);
        res.render("reset-password", {
            error: "Failed to send reset email.",
            success: null,
            step: "request",
        });
    }
});

// GET /reset-password/confirm/:token
router.get("/reset-password/confirm/:token", async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (
            !user ||
            user.resetToken !== req.params.token ||
            user.resetExpiry < new Date()
        ) {
            return res.render("reset-password", {
                error: "Reset link is invalid or expired.",
                success: null,
                step: "request",
            });
        }
        res.render("reset-password", {
            error: null,
            success: null,
            step: "confirm",
            token: req.params.token,
        });
    } catch (err) {
        res.render("reset-password", {
            error: "Reset link is invalid or expired.",
            success: null,
            step: "request",
        });
    }
});

// POST /reset-password/confirm/:token
router.post("/reset-password/confirm/:token", async (req, res) => {
    const { password } = req.body;
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (
            !user ||
            user.resetToken !== req.params.token ||
            user.resetExpiry < new Date()
        ) {
            return res.render("reset-password", {
                error: "Reset link is invalid or expired.",
                success: null,
                step: "request",
            });
        }

        user.password = await bcrypt.hash(password, 12);
        user.resetToken = undefined;
        user.resetExpiry = undefined;
        await user.save();

        res.render("login", {
            error: null,
            success: "Password reset successful! You can now log in.",
        });
    } catch (err) {
        console.error(err);
        res.render("reset-password", {
            error: "Failed to reset password.",
            success: null,
            step: "request",
        });
    }
});

module.exports = router;
