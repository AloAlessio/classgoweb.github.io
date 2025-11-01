// Script para sincronizar UIDs de Authentication con Firestore
// Uso: node sync-uids.js

const { admin } = require('../config/firebaseAdmin');

async function syncUIDs() {
    try {
        console.log('🔄 Sincronizando UIDs de Authentication con Firestore...\n');
        
        // Get all users from Authentication
        const authUsers = await admin.auth().listUsers();
        
        console.log(`📊 Usuarios en Authentication: ${authUsers.users.length}\n`);
        
        for (const authUser of authUsers.users) {
            console.log(`👤 Procesando: ${authUser.email}`);
            console.log(`   UID: ${authUser.uid}`);
            
            // Find matching user in Firestore by email
            const firestoreQuery = await admin.firestore()
                .collection('users')
                .where('email', '==', authUser.email)
                .get();
            
            if (firestoreQuery.empty) {
                console.log(`   ⚠️  No se encontró documento en Firestore para ${authUser.email}`);
                
                // Create new document in Firestore
                const newUserDoc = {
                    email: authUser.email,
                    name: authUser.displayName || authUser.email.split('@')[0],
                    displayName: authUser.displayName || authUser.email.split('@')[0],
                    role: authUser.email.includes('admin') ? 'administrador' : 
                          authUser.email.includes('tutor') ? 'tutor' : 'alumno',
                    status: 'active',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastLogin: null
                };
                
                await admin.firestore()
                    .collection('users')
                    .doc(authUser.uid)
                    .set(newUserDoc);
                
                console.log(`   ✅ Documento creado en Firestore con UID: ${authUser.uid}\n`);
                
            } else {
                // Update existing document with correct UID
                const oldDoc = firestoreQuery.docs[0];
                const oldData = oldDoc.data();
                
                console.log(`   📄 Documento encontrado con ID: ${oldDoc.id}`);
                
                if (oldDoc.id !== authUser.uid) {
                    console.log(`   🔄 Migrando de ${oldDoc.id} a ${authUser.uid}`);
                    
                    // Create new document with correct UID
                    await admin.firestore()
                        .collection('users')
                        .doc(authUser.uid)
                        .set({
                            ...oldData,
                            name: oldData.name || authUser.displayName || oldData.profile?.name || 'Sin nombre',
                            displayName: authUser.displayName || oldData.displayName || oldData.name || 'Sin nombre',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    
                    // Delete old document
                    await admin.firestore()
                        .collection('users')
                        .doc(oldDoc.id)
                        .delete();
                    
                    console.log(`   ✅ Documento migrado y UID actualizado\n`);
                } else {
                    // Just update displayName if needed
                    await admin.firestore()
                        .collection('users')
                        .doc(oldDoc.id)
                        .update({
                            name: oldData.name || authUser.displayName || 'Sin nombre',
                            displayName: authUser.displayName || oldData.displayName || oldData.name || 'Sin nombre',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    
                    console.log(`   ✅ UID correcto, documento actualizado\n`);
                }
            }
        }
        
        console.log('🎉 ¡Sincronización completada!\n');
        
        // List all users in Firestore
        const allUsers = await admin.firestore().collection('users').get();
        
        console.log('📋 Usuarios en Firestore:');
        allUsers.forEach(doc => {
            if (doc.id !== '_init') {
                const data = doc.data();
                console.log(`   • ${data.email} (${data.role}) - UID: ${doc.id}`);
            }
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
syncUIDs();
