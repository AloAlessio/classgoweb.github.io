// Script to list all users in Firebase
const { admin } = require('../config/firebaseAdmin');
require('dotenv').config();

async function listUsers() {
    try {
        console.log('🔍 Listing all users...\n');

        // List users from Firebase Auth
        console.log('📋 Firebase Auth Users:');
        console.log('========================');
        const authUsers = await admin.auth().listUsers();
        
        if (authUsers.users.length === 0) {
            console.log('⚠️  No users found in Firebase Auth\n');
        } else {
            authUsers.users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.email || 'No email'}`);
                console.log(`   UID: ${user.uid}`);
                console.log(`   Name: ${user.displayName || 'Not set'}`);
                console.log(`   Created: ${user.metadata.creationTime}`);
                console.log(`   Verified: ${user.emailVerified ? '✅' : '❌'}`);
            });
            console.log(`\nTotal Auth Users: ${authUsers.users.length}\n`);
        }

        // List users from Firestore
        console.log('\n📁 Firestore Users Collection:');
        console.log('================================');
        const firestoreUsers = await admin.firestore()
            .collection('users')
            .get();
        
        if (firestoreUsers.empty) {
            console.log('⚠️  No users found in Firestore\n');
        } else {
            firestoreUsers.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`\n${index + 1}. ${data.email || 'No email'}`);
                console.log(`   Doc ID: ${doc.id}`);
                console.log(`   Name: ${data.name || data.nombre || 'Not set'}`);
                console.log(`   Role: ${data.role || data.rol || 'Not set'}`);
                console.log(`   Status: ${data.status || 'Not set'}`);
                
                // Show FULL data for first user to see all fields
                if (index === 0) {
                    console.log('\n   📦 Full data structure (first user):');
                    console.log(JSON.stringify(data, null, 2));
                }
            });
            console.log(`\nTotal Firestore Users: ${firestoreUsers.size}\n`);
        }

    } catch (error) {
        console.error('❌ Error listing users:', error);
    } finally {
        process.exit(0);
    }
}

// Run the script
listUsers();
