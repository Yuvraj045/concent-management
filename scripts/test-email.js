require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sendEmail } = require("../services/email");

const to = process.argv[2];
if (!to) {
    console.error("Usage: node scripts/test-email.js <recipient@example.com>");
    process.exit(1);
}

console.log(`Provider: ${process.env.EMAIL_PROVIDER || "sendgrid"}`);
console.log(`Email enabled: ${process.env.EMAIL_ENABLED !== "false"}`);

(async () => {
    try {
        await sendEmail({
            to,
            subject: "Test email — Consent Manager",
            html: `<p>This is a test email from your Consent Manager app.</p><p>If you received this, your email provider is configured correctly.</p><p><a href="${process.env.BASE_URL}">Visit app</a></p>`,
        });
        console.log("Done.");
    } catch (err) {
        console.error("Failed to send email:", err.message);
        if (err.response) {
            console.error("Provider errors:", JSON.stringify(err.response.body?.errors, null, 2));
        }
        process.exit(1);
    }
})();
