require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const sgMail = require("@sendgrid/mail");

const to = process.argv[2];
if (!to) {
    console.error("Usage: node scripts/test-email.js <recipient@example.com>");
    process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

(async () => {
    console.log("Sending test email to:", to);
    console.log("From:", process.env.FROM_EMAIL);

    try {
        await sgMail.send({
            to,
            from: process.env.FROM_EMAIL,
            subject: "Test email — Consent Manager",
            html: "<p>This is a test email from your Consent Manager app. If you received this, SendGrid is configured correctly.</p>",
        });
        console.log("Email sent successfully.");
    } catch (err) {
        console.error("Failed to send email.");
        console.error("Status:", err.code);
        console.error("Message:", err.message);
        if (err.response) {
            console.error("SendGrid errors:", JSON.stringify(err.response.body.errors, null, 2));
        }
        process.exit(1);
    }
})();
