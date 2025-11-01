// Firebase Admin SDK configuration
const admin = require('firebase-admin');
require('dotenv').config();

let isInitialized = false;

const initFirebaseAdmin = () => {
    if (!isInitialized) {
        try {
            console.log('🔥 Initializing Firebase Admin SDK...');
            
            const projectId = process.env.FIREBASE_PROJECT_ID;
            if (!projectId) {
                throw new Error('FIREBASE_PROJECT_ID environment variable is required');
            }

            let config = {
                projectId: projectId
            };

            // Check if we have full service account credentials
            if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                console.log('📋 Using service account credentials');
                config.credential = admin.credential.cert({
                    projectId: projectId,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                });
                
                // Add database URL if provided
                if (process.env.FIREBASE_DATABASE_URL) {
                    config.databaseURL = process.env.FIREBASE_DATABASE_URL;
                }
            } else {
                console.log('🔧 Using Application Default Credentials (development mode)');
                console.log('⚠️  For production, configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY');
            }

            // Initialize Firebase Admin
            admin.initializeApp(config);

            // Test connection
            const db = admin.firestore();
            
            // Set Firestore settings for better performance
            db.settings({
                ignoreUndefinedProperties: true
            });

            console.log(`✅ Firebase Admin initialized successfully`);
            console.log(`📦 Project ID: ${projectId}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            
            isInitialized = true;

            // Test Firestore connection
            testFirestoreConnection();

        } catch (error) {
            console.error('❌ Firebase Admin initialization error:', error.message);
            console.error('📝 Check your .env file configuration');
            throw error;
        }
    } else {
        console.log('🔥 Firebase Admin already initialized');
    }
};

// Test Firestore connection
const testFirestoreConnection = async () => {
    try {
        console.log('🧪 Testing Firestore connection...');
        
        const db = admin.firestore();
        const testDoc = db.collection('_health').doc('connection-test');
        
        await testDoc.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'connected',
            environment: process.env.NODE_ENV || 'development'
        });
        
        console.log('✅ Firestore connection successful');
        
        // Clean up test document
        await testDoc.delete();
        
    } catch (error) {
        console.error('❌ Firestore connection test failed:', error.message);
        console.warn('⚠️  Backend will continue but database operations may fail');
    }
};

// Get Firebase Admin instance
const getAdmin = () => {
    if (!isInitialized) {
        initFirebaseAdmin();
    }
    return admin;
};

// Get Firestore database instance
const getFirestore = () => {
    return getAdmin().firestore();
};

// Get Firebase Auth instance
const getAuth = () => {
    return getAdmin().auth();
};

module.exports = {
    initFirebaseAdmin,
    admin: getAdmin(),
    getFirestore,
    getAuth,
    testFirestoreConnection
};