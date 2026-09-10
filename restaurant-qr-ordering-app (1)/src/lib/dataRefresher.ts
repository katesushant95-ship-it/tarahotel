import { db, doc, setDoc, getDocs, collection, query, where, deleteDoc, addDoc } from './firebase';
import { getHotelTaraMenu } from './hotelTaraMenu';
import { DEFAULT_CATEGORIES } from './translations';
import { QRCodeData } from '../types';

export interface RefreshProgress {
  step: number;
  totalSteps: number;
  message: string;
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
}

export async function refreshAllRestaurantData(
  ownerId: string = 'hotel_tara_owner',
  onProgress?: (progress: RefreshProgress) => void
): Promise<boolean> {
  const notify = (step: number, message: string, status: 'running' | 'success' | 'error' = 'running', error?: string) => {
    if (onProgress) {
      onProgress({ step, totalSteps: 4, message, status, error });
    }
  };

  try {
    // Step 1: Restaurant Profile & Branding
    notify(1, 'हॉटेल तारा माहिती, ब्रँडिंग व मालक खाते रिफ्रेश करत आहे (Updating restaurant profile & branding)...');
    const userDocRef = doc(db, 'users', ownerId);
    await setDoc(userDocRef, {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Step 2: Refresh Menu Items
    notify(2, 'जुने मेनू मिटवून हॉटेल ताराचे ७५+ अधिकृत पदार्थ योग्य किमतीसह जोडत आहे (Seeding 75+ official menu dishes)...');
    const menuQuery = query(collection(db, 'menuItems'), where('ownerId', '==', ownerId));
    const menuSnapshot = await getDocs(menuQuery);
    
    // Delete old items in batches
    for (const itemDoc of menuSnapshot.docs) {
      await deleteDoc(doc(db, 'menuItems', itemDoc.id));
    }

    // Insert official menu items
    const officialItems = getHotelTaraMenu(ownerId);
    for (const dish of officialItems) {
      await addDoc(collection(db, 'menuItems'), dish);
    }

    // Step 3: Refresh Table QR Codes (Tables 1 to 10)
    notify(3, 'टेबल १ ते १० साठी डिजिटल क्यूआर कोड तयार करत आहे (Generating Table 1-10 QR Codes)...');
    const qrsQuery = query(collection(db, 'qrs'), where('ownerId', '==', ownerId));
    const qrsSnapshot = await getDocs(qrsQuery);
    for (const qrDoc of qrsSnapshot.docs) {
      await deleteDoc(doc(db, 'qrs', qrDoc.id));
    }

    let origin = typeof window !== 'undefined' ? window.location.origin : 'https://hoteltara.com';
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }

    for (let i = 1; i <= 10; i++) {
      const tableStr = i.toString();
      const qrData = {
        ownerId,
        tableNumber: tableStr,
        url: `${origin}?table=${tableStr}&restaurantId=${ownerId}`,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'qrs'), qrData);
    }

    // Step 4: Refresh Live Orders & Kitchen Display
    notify(4, 'थेट ऑर्डर्स आणि किचन डिस्प्ले रिफ्रेश करत आहे (Initializing demo kitchen orders)...');
    const ordersQuery = query(collection(db, 'orders'), where('ownerId', '==', ownerId));
    const ordersSnapshot = await getDocs(ordersQuery);
    for (const orderDoc of ordersSnapshot.docs) {
      await deleteDoc(doc(db, 'orders', orderDoc.id));
    }

    // Add 2 realistic sample orders so the client sees the active kitchen display in action immediately
    const sampleOrder1 = {
      ownerId,
      tableNumber: '3',
      items: [
        { id: 'sample-1', name: 'खानदेशी शेवभाजी (Khandeshi Shevbhaji)', price: 140, quantity: 2, category: 'Gavran Tadka' },
        { id: 'sample-2', name: 'ज्वारीची भाकरी (Jowar Bhakari)', price: 25, quantity: 4, category: 'Rice / Extras' },
        { id: 'sample-3', name: 'मसाला ताक (Masala Matha)', price: 30, quantity: 2, category: 'Drinks' }
      ],
      totalPrice: 440,
      status: 'preparing',
      createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sampleOrder2 = {
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
    };

    await addDoc(collection(db, 'orders'), sampleOrder1);
    await addDoc(collection(db, 'orders'), sampleOrder2);

    notify(4, 'सर्व डेटा यशस्वीरित्या रिफ्रेश झाला आहे! (All restaurant data successfully refreshed!)', 'success');
    return true;
  } catch (error: any) {
    console.error('Error refreshing restaurant data:', error);
    notify(4, 'डेटा रिफ्रेश करताना त्रुटी आली: ' + (error?.message || error), 'error', error?.message || String(error));
    return false;
  }
}
