import express from 'express';
import mongoose from 'mongoose';
import Gallery from '../models/Gallery.js';

const router = express.Router();

let inMemoryGallery = [
  {
    _id: 'default_gallery_1',
    image: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1000&q=80',
    title: 'Interactive Executive Workshop',
    description: 'Participants engaged in interactive confidence and communication drills.',
  },
  {
    _id: 'default_gallery_2',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
    title: 'Masterclass on Public Speaking',
    description: 'Live presentation coaching and stage presence refinement session.',
  },
  {
    _id: 'default_gallery_3',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
    title: 'One-on-One Mentorship Session',
    description: 'Personalized guidance designed for career milestones and leadership growth.',
  },
  {
    _id: 'default_gallery_4',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80',
    title: 'Corporate Leadership Forum',
    description: 'Strategic group discussions addressing boardroom dynamics and team influence.',
  },
  {
    _id: 'default_gallery_5',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
    title: 'Collaborative Learning Circles',
    description: 'Peer feedback circles reinforcing constructive dialogue and public speaking.',
  },
  {
    _id: 'default_gallery_6',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    title: 'Graduation & Certification Ceremony',
    description: 'Celebrating our learners upon completing their personal growth journey.',
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/gallery
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      let items = await Gallery.find().sort({ createdAt: -1 });
      if (items.length === 0) {
        await Gallery.insertMany(
          inMemoryGallery.map(({ _id, ...item }) => item)
        );
        items = await Gallery.find().sort({ createdAt: -1 });
      }
      return res.json(items);
    }
    return res.json(inMemoryGallery);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    return res.json(inMemoryGallery);
  }
});

// POST /api/gallery
router.post('/', async (req, res) => {
  try {
    const { image, title, description } = req.body;

    if (!image || !title) {
      return res.status(400).json({ error: 'Image URL and Title are required' });
    }

    const newItemData = {
      image,
      title,
      description: description || '',
    };

    if (isDbConnected()) {
      const savedItem = await Gallery.create(newItemData);
      return res.status(201).json(savedItem);
    }

    const memoryItem = {
      _id: 'gallery_' + Date.now(),
      ...newItemData,
      createdAt: new Date().toISOString(),
    };
    inMemoryGallery.unshift(memoryItem);
    return res.status(201).json(memoryItem);
  } catch (error) {
    console.error('Error adding gallery item:', error);
    return res.status(500).json({ error: 'Server error while adding gallery item' });
  }
});

// PUT /api/gallery/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image, title, description } = req.body;
    let updatedItem = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        updatedItem = await Gallery.findByIdAndUpdate(
          id,
          { image, title, description },
          { new: true, runValidators: true }
        );
      } catch (err) {
        console.warn('DB update failed for gallery, updating memory:', err.message);
      }
    }

    const index = inMemoryGallery.findIndex((item) => String(item._id) === String(id));
    if (index !== -1) {
      inMemoryGallery[index] = {
        ...inMemoryGallery[index],
        image,
        title,
        description,
        updatedAt: new Date().toISOString(),
      };
      return res.json(updatedItem || inMemoryGallery[index]);
    }

    if (updatedItem) {
      return res.json(updatedItem);
    }

    return res.status(404).json({ error: 'Gallery item not found' });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    return res.status(500).json({ error: 'Server error while updating gallery item' });
  }
});

// DELETE /api/gallery/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const deletedItem = await Gallery.findByIdAndDelete(id);
        if (deletedItem) deleted = true;
      } catch (err) {
        console.warn('DB delete error for gallery, continuing with memory cleanup:', err.message);
      }
    }

    const beforeLen = inMemoryGallery.length;
    inMemoryGallery = inMemoryGallery.filter((item) => String(item._id) !== String(id));
    if (inMemoryGallery.length < beforeLen) {
      deleted = true;
    }

    return res.json({ success: true, message: 'Gallery item deleted successfully', id });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return res.status(500).json({ error: 'Server error while deleting gallery item' });
  }
});

export default router;
