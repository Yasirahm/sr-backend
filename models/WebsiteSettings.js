import mongoose from 'mongoose';

const websiteSettingsSchema = new mongoose.Schema(
  {
    heroImage: {
      type: String,
      default: '/images/hero.jpg',
    },
    heroHeading: {
      type: String,
      default: 'Learn. Grow. Transform.',
    },
    heroDescription: {
      type: String,
      default:
        'Professional learning and personal development programs designed to help you build confidence, improve your skills and achieve your goals.',
    },
    button1Text: {
      type: String,
      default: 'Explore Courses',
    },
    button1Link: {
      type: String,
      default: '/courses',
    },
    button2Text: {
      type: String,
      default: 'Contact Us',
    },
    button2Link: {
      type: String,
      default: '/contact',
    },
    whatsappNumber: {
      type: String,
      default: '919876543210',
    },
  },
  {
    timestamps: true,
  }
);

const WebsiteSettings =
  mongoose.models.WebsiteSettings ||
  mongoose.model('WebsiteSettings', websiteSettingsSchema);

export default WebsiteSettings;
