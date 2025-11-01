// Script para verificar usuarios en Authentication vs Firestore
// Uso: node backend/scripts/check-users-status.js

const { admin } = require('../config/firebaseAdmin');

async function checkUsersStatus() {
    try {
        console.log('🔍 Verificando estado de usuarios...\n');
        
        // 1. Verificar Firestore
        console.log('📁 FIRESTORE (Base de datos):');
        const usersSnapshot = await admin.firestore().collection('users').get();
        
        if (usersSnapshot.empty) {
            console.log('  ❌ Colección "users" está VACÍA');
        } else {
            console.log(`  ✅ ${usersSnapshot.size} usuarios encontrados:`);
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`    - ${data.email} (${data.role || 'sin rol'}) - ${data.name || 'sin nombre'}`);
            });
        }
        
        // 2. Verificar Authentication
        console.log('\n🔐 FIREBASE AUTHENTICATION:');
        let allUsers = [];
        let nextPageToken;
        
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            allUsers.push(...listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        
        if (allUsers.length === 0) {
            console.log('  ❌ Authentication está VACÍO');
        } else {
            console.log(`  ✅ ${allUsers.length} usuarios encontrados:`);
            allUsers.forEach(user => {
                console.log(`    - ${user.email || 'Sin email'} (UID: ${user.uid.substring(0, 8)}...)`);
            });
        }
        
        // 3. Análisis
        console.log('\n📊 ANÁLISIS:');
        const firestoreCount = usersSnapshot.size;
        const authCount = allUsers.length;
        
        if (firestoreCount === authCount && firestoreCount > 0) {
            console.log('  ✅ Sincronizados: Mismo número de usuarios en ambos lados');
        } else if (firestoreCount === 0 && authCount === 0) {
            console.log('  ✅ Limpio: No hay usuarios en ningún lado');
        } else if (authCount > firestoreCount) {
            console.log(`  ⚠️  DESINCRONIZADO: ${authCount - firestoreCount} usuarios en Authentication sin datos en Firestore`);
            console.log('     Estos usuarios pueden hacer login pero no tienen perfil.');
        } else if (firestoreCount > authCount) {
            console.log(`  ⚠️  DESINCRONIZADO: ${firestoreCount - authCount} usuarios en Firestore sin cuenta en Authentication`);
            console.log('     Estos usuarios tienen datos pero no pueden hacer login.');
        }
        
        console.log('\n💡 Recomendación:');
        if (authCount > firestoreCount && firestoreCount === 0) {
            console.log('  → Ejecuta: node backend/scripts/delete-all-including-admin.js');
            console.log('    Para limpiar usuarios huérfanos de Authentication');
        } else if (firestoreCount === 0 && authCount === 0) {
            console.log('  → Todo limpio. Puedes crear usuarios nuevos.');
        } else {
            console.log('  → Sistema funcionando correctamente.');
        }
        
        console.log('');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Ejecutar
checkUsersStatus();
