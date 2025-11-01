// Database Initialization Script for ClassGo
// Run this script to set up initial collections and admin user

const { admin } = require('../config/firebaseAdmin');
require('dotenv').config();

async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...');

        // Create collections with initial structure
        const collections = ['users', 'classes', 'notes', 'enrollments', 'audit_logs'];
        
        for (const collectionName of collections) {
            console.log(`📁 Setting up ${collectionName} collection...`);
            
            // Create a sample document to initialize the collection
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

        // Create default admin user
        console.log('👤 Creating default admin user...');
        
        const adminEmail = 'admin@classgo.com';
        const adminUser = {
            email: adminEmail,
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Use a predictable document ID for admin
        const adminDocId = 'admin-user-default';
        await admin.firestore()
            .collection('users')
            .doc(adminDocId)
            .set(adminUser);

        console.log(`✅ Admin user created with ID: ${adminDocId}`);
        console.log(`📧 Admin email: ${adminEmail}`);

        // Create sample tutor user
        console.log('👩‍🏫 Creating sample tutor user...');
        
        const tutorUser = {
            email: 'tutor@classgo.com',
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const tutorDocId = 'sample-tutor-maria';
        await admin.firestore()
            .collection('users')
            .doc(tutorDocId)
            .set(tutorUser);

        console.log(`✅ Sample tutor created with ID: ${tutorDocId}`);

        // Create sample student user
        console.log('👨‍🎓 Creating sample student user...');
        
        const studentUser = {
            email: 'student@classgo.com',
            role: 'alumno',
            status: 'active',
            profile: {
                name: 'Juan Pérez',
                bio: 'Computer Science student seeking help with advanced mathematics',
                phone: '+0987654321',
                subjects: ['Mathematics', 'Computer Science'],
                experience: 'University student',
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
                    profileVisible: true,
                    contactVisible: false
                }
            },
            metadata: {
                lastLogin: null,
                loginCount: 0,
                accountCreated: admin.firestore.FieldValue.serverTimestamp()
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const studentDocId = 'sample-student-juan';
        await admin.firestore()
            .collection('users')
            .doc(studentDocId)
            .set(studentUser);

        console.log(`✅ Sample student created with ID: ${studentDocId}`);

        // Create sample class
        console.log('📚 Creating sample class...');
        
        const sampleClass = {
            title: 'Introduction to Calculus',
            description: 'Learn the fundamentals of differential and integral calculus with practical examples and exercises.',
            category: 'Mathematics',
            level: 'intermediate',
            tutorId: tutorDocId,
            maxStudents: 15,
            duration: 90,
            price: 25.00,
            status: 'scheduled',
            schedule: {
                date: new Date('2024-02-15'),
                time: '14:00',
                timezone: 'UTC-5'
            },
            students: [studentDocId],
            materials: [
                'Calculus textbook',
                'Calculator',
                'Notebook'
            ],
            tags: ['calculus', 'mathematics', 'derivatives', 'integrals'],
            requirements: 'Basic algebra knowledge required',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const classRef = await admin.firestore()
            .collection('classes')
            .add(sampleClass);

        console.log(`✅ Sample class created with ID: ${classRef.id}`);

        // Create sample note
        console.log('📝 Creating sample note...');
        
        const sampleNote = {
            classId: classRef.id,
            title: 'Derivative Rules Summary',
            content: `# Derivative Rules

## Basic Rules:
1. **Power Rule**: d/dx[x^n] = nx^(n-1)
2. **Product Rule**: d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)
3. **Chain Rule**: d/dx[f(g(x))] = f'(g(x)) × g'(x)

## Common Derivatives:
- d/dx[sin(x)] = cos(x)
- d/dx[cos(x)] = -sin(x)
- d/dx[e^x] = e^x
- d/dx[ln(x)] = 1/x

Remember to practice these rules with various examples!`,
            tags: ['derivatives', 'rules', 'reference'],
            type: 'lesson',
            isPublic: true,
            authorId: tutorDocId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const noteRef = await admin.firestore()
            .collection('notes')
            .add(sampleNote);

        console.log(`✅ Sample note created with ID: ${noteRef.id}`);

        // Create enrollment record
        console.log('📋 Creating enrollment record...');
        
        const enrollmentRecord = {
            studentId: studentDocId,
            classId: classRef.id,
            tutorId: tutorDocId,
            status: 'enrolled',
            enrollmentDate: admin.firestore.FieldValue.serverTimestamp(),
            notes: 'Student enrolled in calculus class',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const enrollmentRef = await admin.firestore()
            .collection('enrollments')
            .add(enrollmentRecord);

        console.log(`✅ Enrollment record created with ID: ${enrollmentRef.id}`);

        // Create audit log entry
        console.log('📊 Creating audit log entry...');
        
        const auditEntry = {
            action: 'database_initialization',
            userId: adminDocId,
            userRole: 'administrador',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: {
                collections_created: collections.length,
                sample_users_created: 3,
                sample_classes_created: 1,
                sample_notes_created: 1,
                sample_enrollments_created: 1
            },
            ip: 'localhost',
            userAgent: 'Database Init Script'
        };

        await admin.firestore()
            .collection('audit_logs')
            .add(auditEntry);

        console.log('✅ Audit log entry created');

        // Clean up initialization documents
        console.log('🧹 Cleaning up initialization documents...');
        
        for (const collectionName of collections) {
            try {
                await admin.firestore()
                    .collection(collectionName)
                    .doc('_init')
                    .delete();
            } catch (error) {
                console.warn(`Warning: Could not delete init doc from ${collectionName}:`, error.message);
            }
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   • ${collections.length} collections created`);
        console.log('   • 3 sample users created (admin, tutor, student)');
        console.log('   • 1 sample class created');
        console.log('   • 1 sample note created');
        console.log('   • 1 enrollment record created');
        console.log('   • Audit logging initialized');
        
        console.log('\n🔑 Default Accounts:');
        console.log(`   • Admin: admin@classgo.com (ID: ${adminDocId})`);
        console.log(`   • Tutor: tutor@classgo.com (ID: ${tutorDocId})`);
        console.log(`   • Student: student@classgo.com (ID: ${studentDocId})`);
        
        console.log('\n⚠️  Important Notes:');
        console.log('   • Set up Firebase Authentication for these users');
        console.log('   • Update .env file with your Firebase credentials');
        console.log('   • Change default passwords in production');
        console.log('   • Review and customize user roles as needed');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Run initialization if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('\n✨ Initialization script completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Initialization script failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };