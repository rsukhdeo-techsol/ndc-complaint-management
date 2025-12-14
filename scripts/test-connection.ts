/**
 * Test script to verify Firebase Firestore connection
 * Run with: npx tsx scripts/test-connection.ts
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD-WYxHhZYf0gLh3R1gmKWGGU9K3Xy7P3g",
  authDomain: "complaint-management-d2158.firebaseapp.com",
  projectId: "complaint-management-d2158",
  storageBucket: "complaint-management-d2158.firebasestorage.app",
  messagingSenderId: "567407379222",
  appId: "1:567407379222:web:0ec5e1341a0764ed2b8637"
};

async function testConnection() {
  console.log('🔥 Testing Firebase Firestore Connection...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');

    // Test: Create a test document
    console.log('\n📝 Creating test document...');
    const testCollection = collection(db, '_connection_test');
    const testDoc = await addDoc(testCollection, {
      message: 'Connection test',
      timestamp: Timestamp.now(),
      testId: Date.now(),
    });
    console.log(`✅ Test document created with ID: ${testDoc.id}`);

    // Test: Read the document back
    console.log('\n📖 Reading documents from test collection...');
    const snapshot = await getDocs(testCollection);
    console.log(`✅ Found ${snapshot.size} document(s) in test collection`);

    // Cleanup: Delete the test document
    console.log('\n🧹 Cleaning up test document...');
    await deleteDoc(doc(db, '_connection_test', testDoc.id));
    console.log('✅ Test document deleted');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS! Firestore connection is working properly.');
    console.log('='.repeat(50));
    console.log('\nYour Firebase project is ready to use:');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);
    console.log(`   Firestore: ✅ Connected`);
    console.log(`   Storage Bucket: ${firebaseConfig.storageBucket}`);

  } catch (error: any) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('='.repeat(50));
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Firestore security rules are blocking access.');
      console.error('   You need to enable Firestore in the Firebase Console:');
      console.error('   1. Go to https://console.firebase.google.com');
      console.error('   2. Select your project: complaint-management-d2158');
      console.error('   3. Click "Firestore Database" in the left menu');
      console.error('   4. Click "Create database"');
      console.error('   5. Choose "Start in test mode" for development');
    } else {
      console.error('\nError details:', error.message);
      console.error('Error code:', error.code);
    }
  }
}

testConnection();
