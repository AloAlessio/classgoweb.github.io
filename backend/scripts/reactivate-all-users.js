// Script para reactivar TODOS los usuarios inactivos
// Uso: node backend/scripts/reactivate-all-users.js

const { admin } = require('../config/firebaseAdmin');

async function reactivateAllUsers() {
    try {
        console.log('🔄 Buscando usuarios inactivos...\n');
        
        // Buscar todos los usuarios inactivos o baneados
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('status', 'in', ['inactive', 'banned'])
            .get();
        
        if (usersSnapshot.empty) {
            console.log('✅ No hay usuarios inactivos o baneados');
            return;
        }
        
        console.log(`📊 Total de usuarios a reactivar: ${usersSnapshot.size}\n`);
        
        let reactivatedCount = 0;
        
        // Reactivar cada usuario
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            try {
                await admin.firestore()
                    .collection('users')
                    .doc(userDoc.id)
                    .update({
                        status: 'active',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                
                console.log(`✅ Reactivado: ${userData.email}`);
                console.log(`   Nombre: ${userData.name || userData.displayName}`);
                console.log(`   Rol: ${userData.role}`);
                console.log(`   Estado anterior: ${userData.status} → Nuevo: active\n`);
                
                reactivatedCount++;
            } catch (error) {
                console.error(`❌ Error reactivando ${userData.email}:`, error.message);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Proceso completado`);
        console.log(`📊 Total reactivados: ${reactivatedCount} de ${usersSnapshot.size}`);
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Error en el proceso:', error.message);
    } finally {
        process.exit(0);
    }
}

console.log('🚀 Iniciando reactivación masiva de usuarios...\n');
reactivateAllUsers();
