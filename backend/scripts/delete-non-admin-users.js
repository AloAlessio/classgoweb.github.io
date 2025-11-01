// Script para eliminar todos los usuarios excepto admin@classgo.com
// Uso: node backend/scripts/delete-non-admin-users.js

const { admin } = require('../config/firebaseAdmin');

async function deleteNonAdminUsers() {
    try {
        console.log('🔥 Iniciando eliminación de usuarios no-admin...');
        
        // Get all users
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .get();
        
        console.log(`📊 Total de usuarios encontrados: ${usersSnapshot.size}`);
        
        if (usersSnapshot.empty) {
            console.log('✅ No hay usuarios en la base de datos');
            return;
        }
        
        // Filter users (keep only admin@classgo.com)
        const usersToDelete = [];
        const usersToKeep = [];
        
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            const user = {
                id: doc.id,
                email: data.email,
                role: data.role,
                name: data.name || data.displayName || 'Sin nombre'
            };
            
            if (data.email === 'admin@classgo.com') {
                usersToKeep.push(user);
            } else {
                usersToDelete.push(user);
            }
        });
        
        console.log('\n✅ Usuarios que se MANTENDRÁN:');
        usersToKeep.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        });
        
        console.log('\n🗑️  Usuarios que se ELIMINARÁN:');
        if (usersToDelete.length === 0) {
            console.log('  (Ninguno)');
        } else {
            usersToDelete.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
            });
        }
        
        if (usersToDelete.length === 0) {
            console.log('\n✅ No hay usuarios para eliminar');
            return;
        }
        
        console.log('\n🔥 Eliminando usuarios de Firestore...');
        
        // Delete users from Firestore
        const batch = admin.firestore().batch();
        
        for (const user of usersToDelete) {
            const userRef = admin.firestore().collection('users').doc(user.id);
            batch.delete(userRef);
        }
        
        await batch.commit();
        console.log(`✅ ${usersToDelete.length} usuarios eliminados de Firestore`);
        
        // Delete users from Authentication
        console.log('\n🔥 Eliminando usuarios de Firebase Authentication...');
        let authDeletedCount = 0;
        
        for (const user of usersToDelete) {
            try {
                await admin.auth().deleteUser(user.id);
                authDeletedCount++;
                console.log(`  ✅ ${user.email} eliminado de Authentication`);
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.log(`  ⚠️  ${user.email} no existe en Authentication (solo en Firestore)`);
                } else {
                    console.log(`  ❌ Error al eliminar ${user.email} de Authentication:`, error.message);
                }
            }
        }
        
        console.log(`\n✅ ${authDeletedCount} usuarios eliminados de Authentication`);
        
        console.log('\n✅ Proceso completado!');
        console.log(`📊 Usuarios eliminados: ${usersToDelete.length}`);
        console.log(`📊 Usuarios restantes: ${usersToKeep.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
deleteNonAdminUsers();
