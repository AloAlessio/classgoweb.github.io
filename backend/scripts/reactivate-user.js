// Script para reactivar usuarios inactivos
// Uso: node backend/scripts/reactivate-user.js <email>

const { admin } = require('../config/firebaseAdmin');

async function reactivateUser(email) {
    try {
        console.log(`🔄 Buscando usuario: ${email}...`);
        
        // Buscar usuario en Firestore
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        
        if (usersSnapshot.empty) {
            console.log('❌ Usuario no encontrado en Firestore');
            return;
        }
        
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log(`📊 Estado actual: ${userData.status}`);
        
        if (userData.status === 'active') {
            console.log('✅ Usuario ya está activo');
            return;
        }
        
        // Reactivar usuario
        await admin.firestore()
            .collection('users')
            .doc(userDoc.id)
            .update({
                status: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('✅ Usuario reactivado exitosamente');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Nombre: ${userData.name || userData.displayName}`);
        console.log(`🎭 Rol: ${userData.role}`);
        console.log(`🟢 Nuevo estado: active`);
        
    } catch (error) {
        console.error('❌ Error reactivando usuario:', error.message);
    } finally {
        process.exit(0);
    }
}

// Obtener email desde argumentos de línea de comandos
const email = process.argv[2];

if (!email) {
    console.log('❌ Error: Debes proporcionar un email');
    console.log('📝 Uso: node backend/scripts/reactivate-user.js <email>');
    console.log('📝 Ejemplo: node backend/scripts/reactivate-user.js admin@classgo.com');
    process.exit(1);
}

console.log('🚀 Iniciando reactivación de usuario...\n');
reactivateUser(email);
