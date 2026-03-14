const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");

// Read config lazily (at call time) so dotenv has always loaded first
const getProvider = () => (process.env.EMAIL_PROVIDER || "sendgrid").toLowerCase();
const isDisabled = () => process.env.EMAIL_ENABLED === "false";

// Lazy-init SMTP transporter
let smtpTransport = null;
function getSmtpTransport() {
    if (!smtpTransport) {
        smtpTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return smtpTransport;
}

/**
 * Send an email via the configured provider.
 * @param {{ to: string, subject: string, html: string }} options
 */
async function sendEmail({ to, subject, html }) {
    if (isDisabled()) {
        console.log("[EMAIL DISABLED] Would have sent:");
        console.log(`  To:      ${to}`);
        console.log(`  Subject: ${subject}`);
        // Extract and print any URLs from the HTML for easy copy-paste during testing
        const urls = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
        if (urls.length > 0) {
            console.log("  Links:");
            urls.forEach((url) => console.log(`    ${url}`));
        }
        return;
    }

    if (getProvider() === "smtp") {
        await getSmtpTransport().sendMail({
            from: process.env.FROM_EMAIL,
            to,
            subject,
            html,
        });
    } else {
        // Default: sendgrid
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
            to,
            from: process.env.FROM_EMAIL,
            subject,
            html,
        });
    }
}

module.exports = { sendEmail };
