import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDocs, collection, query, where, deleteDoc, addDoc } from 'firebase/firestore';
import fs from 'fs';
import { getHotelTaraMenu } from '../src/lib/hotelTaraMenu';
import { DEFAULT_CATEGORIES } from '../src/lib/translations';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, config.firestoreDatabaseId);

async function runRefresh() {
  const ownerId = 'hotel_tara_owner';
  console.log('🔄 Starting full data refresh for Hotel Tara (owner:', ownerId, ')...');

  // 1. Restaurant Profile
  console.log('1. Updating user restaurant profile...');
  await setDoc(doc(db, 'users', ownerId), {
    uid: ownerId,
    email: 'sushant@hoteltara.com',
    restaurantName: 'हॉटेल तारा (Hotel Tara)',
    ownerName: 'Sushant Kate',
    tagline: 'खानदेशी झणझणीत शेवभाजी व स्पेशल व्हेज • अस्सल घरगुती चव',
    phone: '+91 98765 43210',
    address: 'हॉटेल तारा, मुख्य रस्ता, बस स्थानकाजवळ',
    language: 'mr',
    categories: DEFAULT_CATEGORIES,
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
    customBaseUrl: '',
    adminUsername: 'sushant',
    adminPassword: 'sushant',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // 2. Menu Items
  console.log('2. Refreshing menu items...');
  const menuQuery = query(collection(db, 'menuItems'), where('ownerId', '==', ownerId));
  const menuSnapshot = await getDocs(menuQuery);
  console.log(`Deleting ${menuSnapshot.docs.length} old menu items...`);
  for (const d of menuSnapshot.docs) {
    await deleteDoc(doc(db, 'menuItems', d.id));
  }

  const officialItems = getHotelTaraMenu(ownerId);
  console.log(`Adding ${officialItems.length} official Hotel Tara dishes...`);
  for (const dish of officialItems) {
    await addDoc(collection(db, 'menuItems'), dish);
  }

  // 3. Table QRs (1 to 10)
  console.log('3. Refreshing Table QR codes (Tables 1-10)...');
  const qrsQuery = query(collection(db, 'qrs'), where('ownerId', '==', ownerId));
  const qrsSnapshot = await getDocs(qrsQuery);
  for (const q of qrsSnapshot.docs) {
    await deleteDoc(doc(db, 'qrs', q.id));
  }

  const baseUrl = 'https://ai.studio/build'; // or standard preview
  for (let i = 1; i <= 10; i++) {
    const tableStr = i.toString();
    await addDoc(collection(db, 'qrs'), {
      ownerId,
      tableNumber: tableStr,
      url: `?table=${tableStr}&restaurantId=${ownerId}`,
      createdAt: new Date().toISOString()
    });
  }

  // 4. Live Orders
  console.log('4. Initializing fresh sample orders for kitchen display...');
  const ordersQuery = query(collection(db, 'orders'), where('ownerId', '==', ownerId));
  const ordersSnapshot = await getDocs(ordersQuery);
  for (const o of ordersSnapshot.docs) {
    await deleteDoc(doc(db, 'orders', o.id));
  }

  await addDoc(collection(db, 'orders'), {
    ownerId,
    tableNumber: '3',
    items: [
      { id: 'sample-1', name: 'खानदेशी शेवभाजी (Khandeshi Shevbhaji)', price: 140, quantity: 2, category: 'Gavran Tadka' },
      { id: 'sample-2', name: 'ज्वारीची भाकरी (Jowar Bhakari)', price: 25, quantity: 4, category: 'Rice / Extras' },
      { id: 'sample-3', name: 'मसाला ताक (Masala Matha)', price: 30, quantity: 2, category: 'Drinks' }
    ],
    totalPrice: 440,
    status: 'preparing',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });

  await addDoc(collection(db, 'orders'), {
    ownerId,
    tableNumber: '5',
    items: [
      { id: 'sample-4', name: 'स्पेशल कढई पनीर (Kadhai Paneer)', price: 180, quantity: 1, category: 'Punjabi Dish' },
      { id: 'sample-5', name: 'बटर रोटी (Butter Roti)', price: 25, quantity: 3, category: 'Rice / Extras' },
      { id: 'sample-6', name: 'जिरा राईस (Jeera Rice)', price: 110, quantity: 1, category: 'Rice / Extras' }
    ],
    totalPrice: 365,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('✅ Full data refresh completed successfully!');
  process.exit(0);
}

runRefresh().catch(err => {
  console.error('❌ Data refresh failed:', err);
  process.exit(1);
});
