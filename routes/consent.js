const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/email');
const Banner = require('../models/Banner');
const Consent = require('../models/Consent');

// GET /b/:slug — public preference center page
router.get('/b/:slug', async (req, res) => {
  try {
    const banner = await Banner.findOne({ slug: req.params.slug });
    if (!banner) return res.status(404).send('Preference center not found');
    res.render('public-banner', { banner, error: null, success: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading preference center');
  }
});

// POST /consent/request — receive email, send JWT link
router.post('/consent/request', async (req, res) => {
  const { email, bannerId } = req.body;
  try {
    const banner = await Banner.findById(bannerId);
    if (!banner) return res.status(404).send('Preference center not found');

    // Upsert consent record as pending
    await Consent.findOneAndUpdate(
      { bannerId, email },
      { status: 'pending', subscriptions: [] },
      { upsert: true, new: true }
    );

    const token = jwt.sign({ email, bannerId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const link = `${process.env.BASE_URL}/consent/submit/${token}`;

    await sendEmail({
      to: email,
      subject: `Consent request: ${banner.name}`,
      html: `
        <p>You have been asked to manage your subscription preferences for <strong>${banner.name}</strong>.</p>
        <p>${banner.description || ''}</p>
        <p>Click <a href="${link}">here</a> to review and set your preferences. This link expires in 24 hours.</p>
      `,
    });

    res.render('public-banner', { banner, error: null, success: 'A consent verification email has been sent to ' + email });
  } catch (err) {
    console.error(err);
    try {
      const banner = await Banner.findById(req.body.bannerId);
      res.render('public-banner', { banner, error: 'Failed to send consent email. Please try again.', success: null });
    } catch {
      res.status(500).send('Error processing request');
    }
  }
});

// GET /consent/submit/:token — show accept/reject form
router.get('/consent/submit/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const banner = await Banner.findById(decoded.bannerId);
    if (!banner) return res.status(404).send('Banner not found');

    const consent = await Consent.findOne({ bannerId: decoded.bannerId, email: decoded.email });
    res.render('consent-submit', { banner, email: decoded.email, token: req.params.token, consent, error: null });
  } catch (err) {
    res.status(400).render('consent-submit', { banner: null, email: null, token: null, consent: null, error: 'This consent link is invalid or has expired.' });
  }
});

// POST /consent/submit/:token — save per-subscription preferences
router.post('/consent/submit/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const banner = await Banner.findById(decoded.bannerId);
    if (!banner) return res.status(404).send('Preference center not found');

    // subs[] contains the names of checked (enabled) subscriptions
    const checked = req.body.subs
      ? (Array.isArray(req.body.subs) ? req.body.subs : [req.body.subs])
      : [];
    const enabledSet = new Set(checked);

    const subscriptions = banner.subscriptionTypes.map(name => ({
      name,
      enabled: enabledSet.has(name)
    }));

    const consent = await Consent.findOneAndUpdate(
      { bannerId: decoded.bannerId, email: decoded.email },
      { status: 'submitted', subscriptions },
      { upsert: true, new: true }
    );

    res.render('consent-submit', { banner, email: decoded.email, token: req.params.token, consent, error: null });
  } catch (err) {
    console.error(err);
    res.status(400).render('consent-submit', { banner: null, email: null, token: null, consent: null, error: 'This consent link is invalid or has expired.' });
  }
});

module.exports = router;
