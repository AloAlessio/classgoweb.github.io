// Complete Database and Auth Initialization Script for ClassGo
// Creates users in both Firebase Auth and Firestore

const { admin } = require('../config/firebaseAdmin');
require('dotenv').config();

async function createUserWithAuth(email, password, userData) {
    try {
        console.log(`👤 Creating user: ${email}...`);
        
        // Step 1: Create user in Firebase Auth
        let authUser;
        try {
            authUser = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: userData.profile.name,
                emailVerified: true
            });
            console.log(`✅ Firebase Auth user created: ${authUser.uid}`);
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.log(`⚠️  User ${email} already exists in Firebase Auth`);
                const existingUser = await admin.auth().getUserByEmail(email);
                authUser = existingUser;
            } else {
                throw error;
            }
        }
        
        // Step 2: Create/Update user document in Firestore
        const firestoreUserData = {
            ...userData,
            uid: authUser.uid,
            email: authUser.email,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const userDocId = `user-${authUser.uid}`;
        await admin.firestore()
            .collection('users')
            .doc(userDocId)
            .set(firestoreUserData, { merge: true });
        
        console.log(`✅ Firestore document created: ${userDocId}`);
        return { authUser, userDocId };
        
    } catch (error) {
        console.error(`❌ Error creating user ${email}:`, error.message);
        throw error;
    }
}

async function initializeCompleteDatabase() {
    try {
        console.log('🚀 Starting complete database initialization with authentication...');

        // Create collections with initial structure
        const collections = ['users', 'classes', 'notes', 'enrollments', 'audit_logs'];
        
        for (const collectionName of collections) {
            console.log(`📁 Setting up ${collectionName} collection...`);
            
            const sampleDoc = {
                _initialized: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                description: `Initial document for ${collectionName} collection`
            };
            
            await admin.firestore()
                .collection(collectionName)
                .doc('_init')
                .set(sampleDoc);
        }

        console.log('\n🔐 Creating users with authentication...');

        // Create admin user
        const adminData = {
            role: 'administrador',
            status: 'active',
            profile: {
                name: 'ClassGo Administrator',
                bio: 'Default system administrator',
                phone: '',
                subjects: [],
                experience: 'System Administrator',
                rating: 5.0,
                ratingCount: 1
            },
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacy: {
                    profileVisible: true,
                    contactVisible: false
                }
            },
            metadata: {
                lastLogin: null,
                loginCount: 0,
                accountCreated: admin.firestore.FieldValue.serverTimestamp()
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const adminResult = await createUserWithAuth('admin@classgo.com', 'admin123', adminData);

        // Create tutor user
        const tutorData = {
            role: 'tutor',
            status: 'active',
            profile: {
                name: 'Maria González',
                bio: 'Experienced mathematics and physics tutor with 5+ years of experience',
                phone: '+1234567890',
                subjects: ['Mathematics', 'Physics', 'Calculus'],
                experience: '5+ years teaching mathematics and physics',
                rating: 4.8,
                ratingCount: 45
            },
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    sms: true
                },
                privacy: {
                    profileVisible: true,
                    contactVisible: true
                }
            },
            metadata: {
                lastLogin: null,
                loginCount: 0,
                accountCreated: admin.firestore.FieldValue.serverTimestamp()
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const tutorResult = await createUserWithAuth('tutor@classgo.com', 'tutor123', tutorData);

        // Create student user
        const studentData = {
            role: 'alumno',
            status: 'active',
            profile: {
                name: 'Juan Pérez',
                bio: 'Computer Science student interested in advanced mathematics',
                phone: '+0987654321',
                subjects: ['Mathematics', 'Computer Science'],
                experience: 'Undergraduate student',
                rating: 0,
                ratingCount: 0
            },
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacy: {
                    profileVisible: false,
                    contactVisible: false
                }
            },
            metadata: {
                lastLogin: null,
                loginCount: 0,
                accountCreated: admin.firestore.FieldValue.serverTimestamp()
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const studentResult = await createUserWithAuth('student@classgo.com', 'student123', studentData);

        console.log('\n📚 Creating sample classes...');

        // Create sample classes
        const mathClass = {
            title: 'Calculus I - Fundamentals',
            description: 'Introduction to differential and integral calculus',
            tutor: {
                id: tutorResult.userDocId,
                name: 'Maria González',
                email: 'tutor@classgo.com'
            },
            subject: 'Mathematics',
            level: 'Intermediate',
            duration: 120, // minutes
            price: 25.00,
            maxStudents: 15,
            currentStudents: 3,
            schedule: {
                dayOfWeek: 'Tuesday',
                startTime: '18:00',
                endTime: '20:00'
            },
            location: {
                type: 'online',
                platform: 'Zoom',
                link: 'https://zoom.us/j/example'
            },
            status: 'active',
            tags: ['calculus', 'mathematics', 'differential', 'integral'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const mathClassRef = await admin.firestore()
            .collection('classes')
            .add(mathClass);

        const physicsClass = {
            title: 'Physics II - Mechanics',
            description: 'Classical mechanics: forces, motion, and energy',
            tutor: {
                id: tutorResult.userDocId,
                name: 'Maria González',
                email: 'tutor@classgo.com'
            },
            subject: 'Physics',
            level: 'Advanced',
            duration: 90, // minutes
            price: 30.00,
            maxStudents: 10,
            currentStudents: 2,
            schedule: {
                dayOfWeek: 'Thursday',
                startTime: '19:00',
                endTime: '20:30'
            },
            location: {
                type: 'online',
                platform: 'Google Meet',
                link: 'https://meet.google.com/example'
            },
            status: 'active',
            tags: ['physics', 'mechanics', 'forces', 'energy'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const physicsClassRef = await admin.firestore()
            .collection('classes')
            .add(physicsClass);

        console.log('\n📝 Creating sample notes...');

        // Create sample notes
        const sampleNotes = [
            {
                title: 'Derivative Rules Summary',
                content: 'Key derivative rules: Power rule: d/dx(x^n) = nx^(n-1), Product rule, Chain rule...',
                author: {
                    id: tutorResult.userDocId,
                    name: 'Maria González',
                    role: 'tutor'
                },
                classId: mathClassRef.id,
                subject: 'Mathematics',
                tags: ['derivatives', 'calculus', 'rules'],
                isPublic: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Newton\'s Laws of Motion',
                content: 'First Law: Inertia, Second Law: F=ma, Third Law: Action-reaction pairs...',
                author: {
                    id: tutorResult.userDocId,
                    name: 'Maria González',
                    role: 'tutor'
                },
                classId: physicsClassRef.id,
                subject: 'Physics',
                tags: ['newton', 'laws', 'motion', 'mechanics'],
                isPublic: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];

        for (const note of sampleNotes) {
            await admin.firestore().collection('notes').add(note);
        }

        console.log('\n🎯 Creating enrollments...');

        // Create sample enrollments
        const enrollments = [
            {
                studentId: studentResult.userDocId,
                classId: mathClassRef.id,
                enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            },
            {
                studentId: studentResult.userDocId,
                classId: physicsClassRef.id,
                enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            }
        ];

        for (const enrollment of enrollments) {
            await admin.firestore().collection('enrollments').add(enrollment);
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Test users created:');
        console.log(`   • Admin: admin@classgo.com (password: admin123)`);
        console.log(`   • Tutor: tutor@classgo.com (password: tutor123)`);
        console.log(`   • Student: student@classgo.com (password: student123)`);
        console.log('\n🔗 Backend server: http://localhost:3000');
        console.log('📚 API documentation: http://localhost:3000/api');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Run initialization
if (require.main === module) {
    initializeCompleteDatabase()
        .then(() => {
            console.log('\n✅ Initialization complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeCompleteDatabase, createUserWithAuth };