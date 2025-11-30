// Conversations Routes for ClassGo
// Handles messaging between students and tutors

const express = require('express');
const crypto = require('crypto');
const { admin } = require('../config/firebaseAdmin');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
    const { uid } = req.user;

    try {
        const conversationsRef = admin.firestore().collection('conversations');
        
        // Get conversations where user is a participant
        const snapshot = await conversationsRef
            .where('participants', 'array-contains', uid)
            .orderBy('lastMessageTime', 'desc')
            .get();

        const conversations = await Promise.all(snapshot.docs.map(async (doc) => {
            const convData = doc.data();
            
            // Get other participant's info
            const otherParticipantId = convData.participants.find(p => p !== uid);
            let otherParticipant = null;
            
            if (otherParticipantId) {
                const userDoc = await admin.firestore()
                    .collection('users')
                    .doc(otherParticipantId)
                    .get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    otherParticipant = {
                        uid: userDoc.id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        avatar: userData.profile?.avatar || null
                    };
                }
            }

            return {
                id: doc.id,
                participants: convData.participants,
                lastMessage: convData.lastMessage || null,
                lastMessageTime: convData.lastMessageTime,
                unreadCount: convData.unreadCount?.[uid] || 0,
                otherParticipant,
                createdAt: convData.createdAt
            };
        }));

        res.json({
            success: true,
            data: {
                conversations
            }
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }
}));

/**
 * @route   GET /api/conversations/contacts/list
 * @desc    Get list of available contacts (tutors for students, students for tutors)
 * @access  Private
 */
router.get('/contacts/list', authenticateUser, asyncHandler(async (req, res) => {
    const { uid, role } = req.user;

    try {
        let contacts = [];

        if (role === 'alumno' || role === 'student') {
            // Students can see tutors from their enrolled classes
            const classesSnapshot = await admin.firestore()
                .collection('classes')
                .where('students', 'array-contains', uid)
                .get();

            const tutorIds = new Set();
            classesSnapshot.docs.forEach(doc => {
                const classData = doc.data();
                if (classData.tutorId) {
                    tutorIds.add(classData.tutorId);
                }
            });

            // Get tutor details
            for (const tutorId of tutorIds) {
                const tutorDoc = await admin.firestore()
                    .collection('users')
                    .doc(tutorId)
                    .get();

                if (tutorDoc.exists) {
                    const tutorData = tutorDoc.data();
                    contacts.push({
                        uid: tutorDoc.id,
                        name: tutorData.name,
                        email: tutorData.email,
                        role: tutorData.role,
                        avatar: tutorData.profile?.avatar || null
                    });
                }
            }

        } else if (role === 'tutor') {
            // Tutors can see students from their classes
            const classesSnapshot = await admin.firestore()
                .collection('classes')
                .where('tutorId', '==', uid)
                .get();

            const studentIds = new Set();
            classesSnapshot.docs.forEach(doc => {
                const classData = doc.data();
                if (classData.students && Array.isArray(classData.students)) {
                    classData.students.forEach(studentId => studentIds.add(studentId));
                }
            });

            // Get student details
            for (const studentId of studentIds) {
                const studentDoc = await admin.firestore()
                    .collection('users')
                    .doc(studentId)
                    .get();

                if (studentDoc.exists) {
                    const studentData = studentDoc.data();
                    contacts.push({
                        uid: studentDoc.id,
                        name: studentData.name,
                        email: studentData.email,
                        role: studentData.role,
                        avatar: studentData.profile?.avatar || null
                    });
                }
            }

        } else if (role === 'admin' || role === 'administrador') {
            // Admins can see all users
            const usersSnapshot = await admin.firestore()
                .collection('users')
                .where('uid', '!=', uid)
                .limit(100)
                .get();

            contacts = usersSnapshot.docs.map(doc => {
                const userData = doc.data();
                return {
                    uid: doc.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    avatar: userData.profile?.avatar || null
                };
            });
        }

        res.json({
            success: true,
            data: {
                contacts
            }
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
}));

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Get messages from a specific conversation
 * @access  Private
 */
router.get('/:conversationId/messages', authenticateUser, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { uid } = req.user;
    const { limit = 50, before } = req.query;

    try {
        // Verify user is participant
        const conversationDoc = await admin.firestore()
            .collection('conversations')
            .doc(conversationId)
            .get();

        if (!conversationDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData.participants.includes(uid)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You are not a participant in this conversation.'
            });
        }

        // Get messages
        let messagesQuery = admin.firestore()
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(parseInt(limit));

        if (before) {
            messagesQuery = messagesQuery.startAfter(new Date(before));
        }

        const messagesSnapshot = await messagesQuery.get();

        const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp
        }));

        res.json({
            success: true,
            data: {
                conversationId,
                messages: messages.reverse(), // Return in chronological order
                hasMore: messagesSnapshot.size === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}));

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    Send a message in a conversation
 * @access  Private
 */
router.post('/:conversationId/messages', authenticateUser, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { text } = req.body;
    const { uid, name } = req.user;

    if (!text || text.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Message text is required'
        });
    }

    try {
        const conversationRef = admin.firestore()
            .collection('conversations')
            .doc(conversationId);

        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData.participants.includes(uid)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You are not a participant in this conversation.'
            });
        }

        // Create message
        const messageData = {
            senderId: uid,
            senderName: name,
            text: text.trim(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        };

        const messageRef = await conversationRef
            .collection('messages')
            .add(messageData);

        // Update conversation metadata
        const otherParticipantId = conversationData.participants.find(p => p !== uid);
        const updateData = {
            lastMessage: text.trim().substring(0, 100),
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp()
        };

        // Increment unread count for other participant
        if (otherParticipantId) {
            updateData[`unreadCount.${otherParticipantId}`] = admin.firestore.FieldValue.increment(1);
        }

        await conversationRef.update(updateData);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: messageRef.id,
                conversationId,
                ...messageData,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}));

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation or get existing one
 * @access  Private
 */
router.post('/', authenticateUser, asyncHandler(async (req, res) => {
    const { otherUserId } = req.body;
    const { uid } = req.user;

    if (!otherUserId) {
        return res.status(400).json({
            success: false,
            error: 'otherUserId is required'
        });
    }

    if (otherUserId === uid) {
        return res.status(400).json({
            success: false,
            error: 'Cannot create conversation with yourself'
        });
    }

    try {
        // Check if conversation already exists
        const existingConversation = await admin.firestore()
            .collection('conversations')
            .where('participants', 'array-contains', uid)
            .get();

        let conversationId = null;

        for (const doc of existingConversation.docs) {
            const data = doc.data();
            if (data.participants.includes(otherUserId)) {
                conversationId = doc.id;
                break;
            }
        }

        // If conversation exists, return it
        if (conversationId) {
            return res.json({
                success: true,
                message: 'Conversation already exists',
                data: {
                    conversationId,
                    isNew: false
                }
            });
        }

        // Create new conversation
        const conversationData = {
            participants: [uid, otherUserId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessage: null,
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
            unreadCount: {
                [uid]: 0,
                [otherUserId]: 0
            }
        };

        const newConversationRef = await admin.firestore()
            .collection('conversations')
            .add(conversationData);

        res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            data: {
                conversationId: newConversationRef.id,
                isNew: true
            }
        });

    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
}));

/**
 * @route   PATCH /api/conversations/:conversationId/mark-read
 * @desc    Mark messages as read
 * @access  Private
 */
router.patch('/:conversationId/mark-read', authenticateUser, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { uid } = req.user;

    try {
        const conversationRef = admin.firestore()
            .collection('conversations')
            .doc(conversationId);

        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData.participants.includes(uid)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Reset unread count for this user
        await conversationRef.update({
            [`unreadCount.${uid}`]: 0
        });

        res.json({
            success: true,
            message: 'Messages marked as read'
        });

    } catch (error) {
        console.error('Error marking as read:', error);
        throw error;
    }
}));

/**
 * @route   DELETE /api/conversations/:conversationId/messages
 * @desc    Delete all messages in a conversation (clear chat history)
 * @access  Private
 */
router.delete('/:conversationId/messages', authenticateUser, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { uid } = req.user;

    try {
        const conversationRef = admin.firestore()
            .collection('conversations')
            .doc(conversationId);

        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData.participants.includes(uid)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You are not a participant in this conversation.'
            });
        }

        // Get all messages in the conversation
        const messagesSnapshot = await conversationRef
            .collection('messages')
            .get();

        // Delete all messages in batches (Firestore limit is 500 per batch)
        const batch = admin.firestore().batch();
        let deleteCount = 0;

        messagesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deleteCount++;
        });

        if (deleteCount > 0) {
            await batch.commit();
        }

        // Update conversation metadata
        await conversationRef.update({
            lastMessage: null,
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
            [`unreadCount.${conversationData.participants[0]}`]: 0,
            [`unreadCount.${conversationData.participants[1]}`]: 0
        });

        console.log(`🗑️ Deleted ${deleteCount} messages from conversation ${conversationId}`);

        res.json({
            success: true,
            message: `Chat history cleared. ${deleteCount} messages deleted.`,
            data: {
                deletedCount: deleteCount
            }
        });

    } catch (error) {
        console.error('Error deleting messages:', error);
        throw error;
    }
}));

/**
 * @route   DELETE /api/conversations/:conversationId
 * @desc    Delete entire conversation (including all messages)
 * @access  Private
 */
router.delete('/:conversationId', authenticateUser, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { uid } = req.user;

    try {
        const conversationRef = admin.firestore()
            .collection('conversations')
            .doc(conversationId);

        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData.participants.includes(uid)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You are not a participant in this conversation.'
            });
        }

        // Delete all messages first
        const messagesSnapshot = await conversationRef
            .collection('messages')
            .get();

        const batch = admin.firestore().batch();
        messagesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete the conversation document
        batch.delete(conversationRef);

        await batch.commit();

        console.log(`🗑️ Deleted conversation ${conversationId} and all its messages`);

        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
}));

module.exports = router;
