const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const Banner = require('../models/Banner');
const Consent = require('../models/Consent');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// GET /b/:slug — public banner page
router.get('/b/:slug', async (req, res) => {
  try {
    const banner = await Banner.findOne({ slug: req.params.slug });
    if (!banner) return res.status(404).send('Banner not found');
    res.render('public-banner', { banner, error: null, success: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading banner');
  }
});

// POST /consent/request — receive email, send JWT link
router.post('/consent/request', async (req, res) => {
  const { email, bannerId } = req.body;
  try {
    const banner = await Banner.findById(bannerId);
    if (!banner) return res.status(404).send('Banner not found');

    // Upsert consent record as pending
    await Consent.findOneAndUpdate(
      { bannerId, email },
      { status: 'pending' },
      { upsert: true, new: true }
    );

    const token = jwt.sign({ email, bannerId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const link = `${process.env.BASE_URL}/consent/submit/${token}`;

    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: `Consent request: ${banner.name}`,
      html: `
        <p>You have been asked to provide consent for <strong>${banner.name}</strong>.</p>
        <p>${banner.description || ''}</p>
        <p>Click <a href="${link}">here</a> to review and respond. This link expires in 24 hours.</p>
      `
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

// POST /consent/submit/:token — save accept/reject
router.post('/consent/submit/:token', async (req, res) => {
  const { decision } = req.body;
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).send('Invalid decision');
    }

    const banner = await Banner.findById(decoded.bannerId);
    if (!banner) return res.status(404).send('Banner not found');

    const consent = await Consent.findOneAndUpdate(
      { bannerId: decoded.bannerId, email: decoded.email },
      { status: decision },
      { upsert: true, new: true }
    );

    res.render('consent-submit', { banner, email: decoded.email, token: req.params.token, consent, error: null });
  } catch (err) {
    console.error(err);
    res.status(400).render('consent-submit', { banner: null, email: null, token: null, consent: null, error: 'This consent link is invalid or has expired.' });
  }
});

module.exports = router;
