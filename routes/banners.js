const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Banner = require('../models/Banner');
const Consent = require('../models/Consent');

// GET /dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const banners = await Banner.find({ owner: req.user.userId });
    res.render('dashboard', { banners, user: req.user });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { banners: [], user: req.user });
  }
});

// GET /banners/new
router.get('/banners/new', auth, (req, res) => {
  res.render('banner-form', { error: null, user: req.user });
});

// POST /banners/new
router.post('/banners/new', auth, async (req, res) => {
  const { name, description, subscriptionTypes } = req.body;
  try {
    const types = subscriptionTypes
      ? (Array.isArray(subscriptionTypes) ? subscriptionTypes : subscriptionTypes.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + uuidv4().slice(0, 8);

    await Banner.create({ name, description, subscriptionTypes: types, owner: req.user.userId, slug });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('banner-form', { error: 'Failed to create banner. Please try again.', user: req.user });
  }
});

// GET /banners/:id
router.get('/banners/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!banner) return res.status(404).send('Banner not found');

    const consents = await Consent.find({ bannerId: banner._id }).sort({ updatedAt: -1 });
    res.render('banner-detail', { banner, consents, user: req.user, baseUrl: process.env.BASE_URL });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading banner');
  }
});

// POST /banners/:id/delete
router.post('/banners/:id/delete', auth, async (req, res) => {
  try {
    await Banner.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    await Consent.deleteMany({ bannerId: req.params.id });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

module.exports = router;
