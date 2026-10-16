import express from 'express';
import mongoose from 'mongoose';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

let inMemoryMessages = [
  {
    _id: 'sample_msg_1',
    name: 'Amina Khan',
    email: 'amina.khan@example.com',
    phone: '+91 98765 12345',
    message: 'Hello Sara, I want to inquire about upcoming weekend batches for Executive Communication.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    _id: 'sample_msg_2',
    name: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    phone: '+91 98111 22334',
    message: 'Interested in personalized one-on-one leadership coaching for my team.',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/contact - List all inquiries
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      let messages = await ContactMessage.find().sort({ createdAt: -1 });
      if (messages.length === 0 && inMemoryMessages.length > 0) {
        return res.json(inMemoryMessages);
      }
      return res.json(messages);
    }
    return res.json(inMemoryMessages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return res.json(inMemoryMessages);
  }
});

// POST /api/contact - Submit new inquiry from contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newMessage = {
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      message: message.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        const savedMessage = await ContactMessage.create(newMessage);
        return res.status(201).json(savedMessage);
      } catch (dbErr) {
        console.warn('DB write failed for contact message, storing in memory:', dbErr.message);
      }
    }

    // In-memory fallback
    const memoryMsg = {
      _id: 'msg_' + Date.now(),
      ...newMessage,
    };
    inMemoryMessages.unshift(memoryMsg);
    return res.status(201).json(memoryMsg);
  } catch (error) {
    console.error('Error saving contact message:', error);
    return res.status(500).json({ error: 'Server error saving message' });
  }
});

// DELETE /api/contact/:id - Delete message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await ContactMessage.findByIdAndDelete(id);
      } catch (err) {
        console.warn('DB delete error, continuing with memory cleanup:', err.message);
      }
    }

    inMemoryMessages = inMemoryMessages.filter((m) => String(m._id) !== String(id));
    return res.json({ success: true, message: 'Message deleted successfully', id });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

// PUT /api/contact/:id/read - Toggle read status
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const msg = await ContactMessage.findById(id);
        if (msg) {
          msg.isRead = !msg.isRead;
          await msg.save();
          return res.json(msg);
        }
      } catch (err) {
        console.warn('DB update read status error:', err.message);
      }
    }

    const index = inMemoryMessages.findIndex((m) => String(m._id) === String(id));
    if (index !== -1) {
      inMemoryMessages[index].isRead = !inMemoryMessages[index].isRead;
      return res.json(inMemoryMessages[index]);
    }

    return res.status(404).json({ error: 'Message not found' });
  } catch (error) {
    console.error('Error updating message status:', error);
    return res.status(500).json({ error: 'Failed to update message status' });
  }
});

export default router;
