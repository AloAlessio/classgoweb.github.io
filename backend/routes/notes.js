// Notes Routes for ClassGo
// Handles creation, retrieval, and management of class notes

const express = require('express');
const Joi = require('joi');
const { admin } = require('../config/firebaseAdmin');
const { asyncHandler, APIError } = require('../middleware/errorMiddleware');
const { requireTutorOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation schemas
const noteCreateSchema = Joi.object({
    classId: Joi.string().required(),
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().min(1).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    type: Joi.string().valid('lesson', 'homework', 'resource', 'announcement').default('lesson'),
    isPublic: Joi.boolean().default(false)
});

const noteUpdateSchema = Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    content: Joi.string().min(1).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    type: Joi.string().valid('lesson', 'homework', 'resource', 'announcement').optional(),
    isPublic: Joi.boolean().optional()
});

/**
 * @route   GET /api/notes
 * @desc    Get notes (filtered by user role and permissions)
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
    try {
        const { uid, role } = req.user;
        const { 
            classId, 
            type, 
            limit = 20, 
            offset = 0, 
            search,
            tags 
        } = req.query;

        let notesQuery = admin.firestore().collection('notes');

        if (role === 'alumno') {
            // Students can only see public notes or notes from classes they're enrolled in
            if (classId) {
                // Verify student is enrolled in the class
                const classDoc = await admin.firestore()
                    .collection('classes')
                    .doc(classId)
                    .get();

                if (!classDoc.exists) {
                    throw new APIError('Class not found', 404);
                }

                const classData = classDoc.data();
                if (!classData.students || !classData.students.includes(uid)) {
                    throw new APIError('Access denied to class notes', 403);
                }

                notesQuery = notesQuery.where('classId', '==', classId);
            } else {
                // Get all classes the student is enrolled in
                const enrolledClassesQuery = await admin.firestore()
                    .collection('classes')
                    .where('students', 'array-contains', uid)
                    .get();

                const classIds = [];
                enrolledClassesQuery.forEach(doc => {
                    classIds.push(doc.id);
                });

                if (classIds.length > 0) {
                    notesQuery = notesQuery.where('classId', 'in', classIds.slice(0, 10)); // Firestore limit
                } else {
                    // Student not enrolled in any classes, only show public notes
                    notesQuery = notesQuery.where('isPublic', '==', true);
                }
            }

        } else if (role === 'tutor') {
            // Tutors can see their own notes or public notes
            if (classId) {
                // Verify tutor owns the class or note is public
                const classDoc = await admin.firestore()
                    .collection('classes')
                    .doc(classId)
                    .get();

                if (!classDoc.exists) {
                    throw new APIError('Class not found', 404);
                }

                const classData = classDoc.data();
                if (classData.tutorId !== uid) {
                    // Can only see public notes from classes they don't own
                    notesQuery = notesQuery
                        .where('classId', '==', classId)
                        .where('isPublic', '==', true);
                } else {
                    notesQuery = notesQuery.where('classId', '==', classId);
                }
            } else {
                // Get all classes the tutor owns plus public notes
                const ownedClassesQuery = await admin.firestore()
                    .collection('classes')
                    .where('tutorId', '==', uid)
                    .get();

                const classIds = [];
                ownedClassesQuery.forEach(doc => {
                    classIds.push(doc.id);
                });

                if (classIds.length > 0) {
                    notesQuery = notesQuery.where('classId', 'in', classIds.slice(0, 10));
                }
            }
        } else if (role === 'administrador') {
            // Admins can see all notes
            if (classId) {
                notesQuery = notesQuery.where('classId', '==', classId);
            }
        }

        // Apply additional filters
        if (type) {
            notesQuery = notesQuery.where('type', '==', type);
        }

        // Apply pagination
        notesQuery = notesQuery
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit))
            .offset(parseInt(offset));

        const notesSnapshot = await notesQuery.get();
        const notes = [];

        for (const doc of notesSnapshot.docs) {
            const noteData = doc.data();
            
            // Apply search filter if provided
            if (search) {
                const searchLower = search.toLowerCase();
                const titleMatch = noteData.title.toLowerCase().includes(searchLower);
                const contentMatch = noteData.content.toLowerCase().includes(searchLower);
                const tagsMatch = noteData.tags && noteData.tags.some(tag => 
                    tag.toLowerCase().includes(searchLower)
                );
                
                if (!titleMatch && !contentMatch && !tagsMatch) {
                    continue;
                }
            }

            // Apply tags filter if provided
            if (tags) {
                const filterTags = Array.isArray(tags) ? tags : [tags];
                const hasMatchingTag = noteData.tags && noteData.tags.some(tag => 
                    filterTags.includes(tag)
                );
                
                if (!hasMatchingTag) {
                    continue;
                }
            }

            // Get author information
            let authorInfo = { name: 'Unknown', email: '' };
            if (noteData.authorId) {
                try {
                    const authorDoc = await admin.firestore()
                        .collection('users')
                        .doc(noteData.authorId)
                        .get();
                    
                    if (authorDoc.exists) {
                        const authorData = authorDoc.data();
                        authorInfo = {
                            name: authorData.profile?.name || authorData.email || 'Unknown',
                            email: authorData.email || ''
                        };
                    }
                } catch (error) {
                    console.warn('Error fetching author info:', error);
                }
            }

            notes.push({
                id: doc.id,
                ...noteData,
                author: authorInfo,
                createdAt: noteData.createdAt?.toDate()?.toISOString() || null,
                updatedAt: noteData.updatedAt?.toDate()?.toISOString() || null
            });
        }

        res.json({
            success: true,
            data: {
                notes,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: notes.length
                }
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private (Tutor/Admin)
 */
router.post('/', requireTutorOrAdmin, asyncHandler(async (req, res) => {
    try {
        const { error, value } = noteCreateSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const { uid, role } = req.user;
        const { classId, title, content, tags = [], type, isPublic } = value;

        // Verify class exists and user has permission
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            throw new APIError('Class not found', 404);
        }

        const classData = classDoc.data();
        
        // Only class tutor or admin can create notes for the class
        if (role !== 'administrador' && classData.tutorId !== uid) {
            throw new APIError('Access denied - only class tutor can create notes', 403);
        }

        // Create the note
        const noteData = {
            classId,
            title,
            content,
            tags,
            type,
            isPublic,
            authorId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const noteRef = await admin.firestore()
            .collection('notes')
            .add(noteData);

        // Get the created note
        const createdNote = await noteRef.get();
        const noteWithId = {
            id: createdNote.id,
            ...createdNote.data(),
            createdAt: createdNote.data().createdAt?.toDate()?.toISOString() || null,
            updatedAt: createdNote.data().updatedAt?.toDate()?.toISOString() || null
        };

        res.status(201).json({
            success: true,
            data: {
                note: noteWithId,
                message: 'Note created successfully'
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   GET /api/notes/:id
 * @desc    Get a specific note by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, role } = req.user;

        const noteDoc = await admin.firestore()
            .collection('notes')
            .doc(id)
            .get();

        if (!noteDoc.exists) {
            throw new APIError('Note not found', 404);
        }

        const noteData = noteDoc.data();

        // Check permissions
        if (role === 'alumno') {
            // Students can only access public notes or notes from enrolled classes
            if (!noteData.isPublic) {
                const classDoc = await admin.firestore()
                    .collection('classes')
                    .doc(noteData.classId)
                    .get();

                if (!classDoc.exists) {
                    throw new APIError('Associated class not found', 404);
                }

                const classData = classDoc.data();
                if (!classData.students || !classData.students.includes(uid)) {
                    throw new APIError('Access denied to this note', 403);
                }
            }
        } else if (role === 'tutor') {
            // Tutors can access their own notes or public notes
            if (!noteData.isPublic) {
                const classDoc = await admin.firestore()
                    .collection('classes')
                    .doc(noteData.classId)
                    .get();

                if (!classDoc.exists) {
                    throw new APIError('Associated class not found', 404);
                }

                const classData = classDoc.data();
                if (classData.tutorId !== uid) {
                    throw new APIError('Access denied to this note', 403);
                }
            }
        }
        // Admins can access all notes

        // Get author information
        let authorInfo = { name: 'Unknown', email: '' };
        if (noteData.authorId) {
            try {
                const authorDoc = await admin.firestore()
                    .collection('users')
                    .doc(noteData.authorId)
                    .get();
                
                if (authorDoc.exists) {
                    const authorData = authorDoc.data();
                    authorInfo = {
                        name: authorData.profile?.name || authorData.email || 'Unknown',
                        email: authorData.email || ''
                    };
                }
            } catch (error) {
                console.warn('Error fetching author info:', error);
            }
        }

        const noteWithAuthor = {
            id: noteDoc.id,
            ...noteData,
            author: authorInfo,
            createdAt: noteData.createdAt?.toDate()?.toISOString() || null,
            updatedAt: noteData.updatedAt?.toDate()?.toISOString() || null
        };

        res.json({
            success: true,
            data: {
                note: noteWithAuthor
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note
 * @access  Private (Author/Admin)
 */
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, role } = req.user;

        const { error, value } = noteUpdateSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const noteDoc = await admin.firestore()
            .collection('notes')
            .doc(id)
            .get();

        if (!noteDoc.exists) {
            throw new APIError('Note not found', 404);
        }

        const noteData = noteDoc.data();

        // Check permissions - only author or admin can update
        if (role !== 'administrador' && noteData.authorId !== uid) {
            throw new APIError('Access denied - only note author or admin can update', 403);
        }

        // Update the note
        const updateData = {
            ...value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await admin.firestore()
            .collection('notes')
            .doc(id)
            .update(updateData);

        // Get updated note
        const updatedNote = await admin.firestore()
            .collection('notes')
            .doc(id)
            .get();

        const noteWithId = {
            id: updatedNote.id,
            ...updatedNote.data(),
            createdAt: updatedNote.data().createdAt?.toDate()?.toISOString() || null,
            updatedAt: updatedNote.data().updatedAt?.toDate()?.toISOString() || null
        };

        res.json({
            success: true,
            data: {
                note: noteWithId,
                message: 'Note updated successfully'
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Private (Author/Admin)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, role } = req.user;

        const noteDoc = await admin.firestore()
            .collection('notes')
            .doc(id)
            .get();

        if (!noteDoc.exists) {
            throw new APIError('Note not found', 404);
        }

        const noteData = noteDoc.data();

        // Check permissions - only author or admin can delete
        if (role !== 'administrador' && noteData.authorId !== uid) {
            throw new APIError('Access denied - only note author or admin can delete', 403);
        }

        // Delete the note
        await admin.firestore()
            .collection('notes')
            .doc(id)
            .delete();

        res.json({
            success: true,
            data: {
                message: 'Note deleted successfully'
            }
        });

    } catch (error) {
        throw error;
    }
}));

module.exports = router;