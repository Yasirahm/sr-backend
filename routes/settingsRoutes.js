import express from 'express';
import mongoose from 'mongoose';
import WebsiteSettings from '../models/WebsiteSettings.js';

const router = express.Router();

let inMemorySettings = {
  heroImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1920&q=80',
  heroHeading: 'Learn. Grow. Transform.',
  heroDescription:
    'Professional learning and personal development programs designed to help you build confidence, improve your skills and achieve your goals.',
  button1Text: 'Explore Courses',
  button1Link: '/courses',
  button2Text: 'Contact Us',
  button2Link: '/contact',
  whatsappNumber: '919876543210',
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      let settings = await WebsiteSettings.findOne();
      if (!settings) {
        settings = await WebsiteSettings.create(inMemorySettings);
      }
      return res.json(settings);
    }
    return res.json(inMemorySettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.json(inMemorySettings);
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const {
      heroImage,
      heroHeading,
      heroDescription,
      button1Text,
      button1Link,
      button2Text,
      button2Link,
      whatsappNumber,
    } = req.body;

    const updatePayload = {
      heroImage: heroImage !== undefined ? heroImage : inMemorySettings.heroImage,
      heroHeading: heroHeading !== undefined ? heroHeading : inMemorySettings.heroHeading,
      heroDescription: heroDescription !== undefined ? heroDescription : inMemorySettings.heroDescription,
      button1Text: button1Text !== undefined ? button1Text : inMemorySettings.button1Text,
      button1Link: button1Link !== undefined ? button1Link : inMemorySettings.button1Link,
      button2Text: button2Text !== undefined ? button2Text : inMemorySettings.button2Text,
      button2Link: button2Link !== undefined ? button2Link : inMemorySettings.button2Link,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : inMemorySettings.whatsappNumber,
    };

    if (isDbConnected()) {
      let settings = await WebsiteSettings.findOne();
      if (!settings) {
        settings = await WebsiteSettings.create(updatePayload);
      } else {
        Object.assign(settings, updatePayload);
        await settings.save();
      }
      return res.json(settings);
    }

    inMemorySettings = { ...inMemorySettings, ...updatePayload };
    return res.json(inMemorySettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Server error while updating settings' });
  }
});

export default router;
