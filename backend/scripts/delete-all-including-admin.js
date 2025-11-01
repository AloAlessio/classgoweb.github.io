// Script para eliminar TODOS los usuarios (incluyendo admin)
// ADVERTENCIA: Esto eliminará TODO de Authentication Y Firestore
// Uso: node backend/scripts/delete-all-including-admin.js

const { admin } = require('../config/firebaseAdmin');

async function deleteEverything() {
    try {
        console.log('⚠️⚠️⚠️  ADVERTENCIA: Esto eliminará TODOS los usuarios  ⚠️⚠️⚠️');
        console.log('⚠️  Incluyendo el admin y TODOS los datos');
        console.log('\n🔥 Iniciando eliminación completa en 3 segundos...\n');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 1. Eliminar usuarios de Firestore
        console.log('1️⃣ Eliminando usuarios de Firestore...');
        const usersSnapshot = await admin.firestore().collection('users').get();
        
        if (!usersSnapshot.empty) {
            const batch = admin.firestore().batch();
            let count = 0;
            
            usersSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                count++;
                console.log(`  ✅ Marcado para eliminar: ${doc.data().email}`);
            });
            
            await batch.commit();
            console.log(`✅ ${count} usuarios eliminados de Firestore\n`);
        } else {
            console.log('ℹ️  Firestore ya está vacío\n');
        }
        
        // 2. Eliminar usuarios de Authentication
        console.log('2️⃣ Eliminando usuarios de Authentication...');
        
        // Obtener todos los usuarios de Authentication (máximo 1000 por página)
        let allUsers = [];
        let nextPageToken;
        
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            allUsers.push(...listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        
        console.log(`📊 Total de usuarios en Authentication: ${allUsers.length}`);
        
        if (allUsers.length > 0) {
            for (const user of allUsers) {
                try {
                    await admin.auth().deleteUser(user.uid);
                    console.log(`  ✅ ${user.email || user.uid} eliminado de Authentication`);
                } catch (error) {
                    console.log(`  ❌ Error al eliminar ${user.email || user.uid}:`, error.message);
                }
            }
            console.log(`\n✅ ${allUsers.length} usuarios eliminados de Authentication`);
        } else {
            console.log('ℹ️  Authentication ya está vacío');
        }
        
        console.log('\n✅✅✅ PROCESO COMPLETADO ✅✅✅');
        console.log('📊 Usuarios restantes: 0');
        console.log('🔥 Base de datos completamente limpia');
        console.log('\n💡 Ahora puedes crear usuarios frescos desde el registro o panel admin\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Ejecutar
deleteEverything();
