import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';

const router = express.Router();

// Initial seed courses used when MongoDB has no records or during demo fallback
let inMemoryCourses = [
  {
    _id: 'default_course_1',
    title: 'Executive Communication & Public Speaking',
    description:
      'Improve communication, confidence and presentation skills. Master articulate speech, executive presence, and persuasive delivery.',
    duration: '4 Weeks',
    price: '₹4,999',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    whatsappMessage:
      'Hello Sara Aijaz, I am interested in the Executive Communication & Public Speaking course. Please provide me with more details.',
  },
  {
    _id: 'default_course_2',
    title: 'Personal Growth & Emotional Intelligence',
    description:
      'Develop self-awareness, emotional resilience, stress mastery, and habits that drive sustained personal and professional transformation.',
    duration: '4 Weeks',
    price: '₹4,499',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    whatsappMessage:
      'Hello Sara Aijaz, I am interested in the Personal Growth & Emotional Intelligence course. Please provide me with more details.',
  },
  {
    _id: 'default_course_3',
    title: 'Professional Grooming & Corporate Etiquette',
    description:
      'Build an unforgettable impression through polished workplace etiquette, non-verbal cues, business dining, and executive styling.',
    duration: '3 Weeks',
    price: '₹3,999',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
    whatsappMessage:
      'Hello Sara Aijaz, I am interested in the Professional Grooming & Corporate Etiquette course. Please provide me with more details.',
  },
  {
    _id: 'default_course_4',
    title: 'Confidence Building & Mindset Mastery',
    description:
      'Overcome imposter syndrome, eliminate hesitation, and unlock unwavering self-belief in boardrooms, interviews, and everyday conversations.',
    duration: '5 Weeks',
    price: '₹5,499',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    whatsappMessage:
      'Hello Sara Aijaz, I am interested in the Confidence Building & Mindset Mastery course. Please provide me with more details.',
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      let courses = await Course.find().sort({ createdAt: -1 });
      // If DB is connected but empty, seed initial courses
      if (courses.length === 0) {
        await Course.insertMany(
          inMemoryCourses.map(({ _id, ...course }) => course)
        );
        courses = await Course.find().sort({ createdAt: -1 });
      }
      return res.json(courses);
    }
    // Fallback if MongoDB is not running or still connecting
    return res.json(inMemoryCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Return in-memory fallback on DB error so UI does not fail
    return res.json(inMemoryCourses);
  }
});

// POST /api/courses
router.post('/', async (req, res) => {
  try {
    const { title, description, duration, price, image, whatsappMessage } = req.body;

    if (!title || !description || !duration || !price || !image) {
      return res.status(400).json({ error: 'Please provide all required course fields' });
    }

    const newCourseData = {
      title,
      description,
      duration,
      price,
      image,
      whatsappMessage:
        whatsappMessage ||
        `Hello Sara Aijaz, I am interested in the ${title} course. Please provide me with more details.`,
    };

    if (isDbConnected()) {
      const savedCourse = await Course.create(newCourseData);
      return res.status(201).json(savedCourse);
    }

    // In-memory fallback
    const memoryCourse = {
      _id: 'course_' + Date.now(),
      ...newCourseData,
      createdAt: new Date().toISOString(),
    };
    inMemoryCourses.unshift(memoryCourse);
    return res.status(201).json(memoryCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ error: 'Server error while creating course' });
  }
});

// PUT /api/courses/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, price, image, whatsappMessage } = req.body;

    let updatedCourse = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        updatedCourse = await Course.findByIdAndUpdate(
          id,
          { title, description, duration, price, image, whatsappMessage },
          { new: true, runValidators: true }
        );
      } catch (err) {
        console.warn('DB update failed, attempting memory update:', err.message);
      }
    }

    // Also update in-memory cache
    const index = inMemoryCourses.findIndex((c) => String(c._id) === String(id));
    if (index !== -1) {
      inMemoryCourses[index] = {
        ...inMemoryCourses[index],
        title,
        description,
        duration,
        price,
        image,
        whatsappMessage,
        updatedAt: new Date().toISOString(),
      };
      return res.json(updatedCourse || inMemoryCourses[index]);
    }

    if (updatedCourse) {
      return res.json(updatedCourse);
    }

    return res.status(404).json({ error: 'Course not found' });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ error: 'Server error while updating course' });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const deletedCourse = await Course.findByIdAndDelete(id);
        if (deletedCourse) deleted = true;
      } catch (err) {
        console.warn('DB delete error, continuing with memory cleanup:', err.message);
      }
    }

    const beforeLen = inMemoryCourses.length;
    inMemoryCourses = inMemoryCourses.filter((c) => String(c._id) !== String(id));
    if (inMemoryCourses.length < beforeLen) {
      deleted = true;
    }

    return res.json({ success: true, message: 'Course deleted successfully', id });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ error: 'Server error while deleting course' });
  }
});

export default router;
