export function getHotelTaraMenu(ownerId: string) {
  return [
    // === १. स्टार्टर (Starters) ===
    {
      ownerId,
      name: "पापड रोस्ट (Papad Roast)",
      price: 20,
      category: "Starters",
      description: "कुरकुरीत ताजे भाजलेले पापड",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "फ्राय पापड (Fry Papad)",
      price: 20,
      category: "Starters",
      description: "तेलात कुरकुरीत तळून घेतलेले पापड",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मसाला पापड (Masala Papad)",
      price: 25,
      category: "Starters",
      description: "कांदा, टोमॅटो, कोथिंबीर आणि चटपटीत मसाल्यांनी सजवलेला पापड",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "फिंगर चिप्स (Finger Chips)",
      price: 80,
      category: "Starters",
      description: "कुरकुरीत बटाटा फिंगर फ्राईज",
      imageUrl: "https://images.unsplash.com/photo-1518013006369-07f0f671c6bc?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "पापड चुरी (Papad Churi)",
      price: 80,
      category: "Starters",
      description: "चुरलेल्या पापडाचा उत्कृष्ट चटपटीत नमुना",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज पकोडा (Veg Pakoda)",
      price: 70,
      category: "Starters",
      description: "ताजेतवाने मिश्र भाज्यांचे गरमागरम पकोडे",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "ओनियन पकोडा (Onion Pakoda)",
      price: 90,
      category: "Starters",
      description: "कांद्याची गरमागरम कुरकुरीत खमंग भजी",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "पनीर पकोडा (Paneer Pakoda)",
      price: 110,
      category: "Starters",
      description: "मऊ पनीरचे बेसनामधील चवदार तळलेले पकोडे",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "आलु पकोडा (Aloo Pakoda)",
      price: 70,
      category: "Starters",
      description: "ताजे कापलेले बटाट्याचे कुरकुरीत पकोडे",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "तवा शेंगदाना (Tava Shengdana)",
      price: 50,
      category: "Starters",
      description: "तव्यावर तेल न घालता भाजलेले सुवासिक शेंगदाणे",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मसाला शेंगदाना (Masala Shengdana)",
      price: 70,
      category: "Starters",
      description: "कांदा, कोथिंबीर व मसाल्यांनी सजवलेले कुरकुरीत शेंगदाणे",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मसाला काजु (Masala Kaju)",
      price: 120,
      category: "Starters",
      description: "चटपटीत आणि कुरकुरीत भाजलेले मसालेदार काजू",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मसाला फिंगर चिप्स (Masala Finger Chips)",
      price: 90,
      category: "Starters",
      description: "विशेष चटपटीत मसाल्यांसह फ्रेंच फ्राईज",
      imageUrl: "https://images.unsplash.com/photo-1518013006369-07f0f671c6bc?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "चिल्ली कट पकोडा (Chilli Cut Pakoda)",
      price: 80,
      category: "Starters",
      description: "तिखट मिरच्यांचे कापलेले चवदार पकोडे",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "चिल्ली पकोडा (Chilli Pakoda)",
      price: 80,
      category: "Starters",
      description: "झणझणीत संपूर्ण हिरव्या मिरच्यांचे मोठे पकोडे",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "शेवगा फ्राय (Shevga Fry)",
      price: 120,
      category: "Starters",
      description: "मसालेदार फ्राय केलेला गावरान शेवगा शेंगा प्रकार",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "ग्रीन पीस फ्राय (Green Peas Fry)",
      price: 130,
      category: "Starters",
      description: "तेलात खमंग परतलेले तिखट मसालेदार हिरवे मटार",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "लसुन फ्राय (Garlic Fry)",
      price: 100,
      category: "Starters",
      description: "कुरकुरीत लसणीचा तिखट खमंग फ्राईड प्रकार",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "सोयाबीन फ्राय (Soyabean Fry)",
      price: 130,
      category: "Starters",
      description: "मसालेदार आणि कुरकुरीत तळलेले सोयाबीन",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मटकी फ्राय (Matki Fry)",
      price: 120,
      category: "Starters",
      description: "गावरान पद्धतीने मोड आलेल्या मटकीचा खमंग फ्राय",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज मंचुरियन ड्राय (Veg Manchurian Dry)",
      price: 130,
      category: "Starters",
      description: "मसालेदार चायनीज व्हेज मंचुरियन कोबी बॉल्स",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "गोबी ६५ (Gobi 65)",
      price: 140,
      category: "Starters",
      description: "चटपटीत आणि अतिशय कुरकुरीत चायनीज फ्लॉवर ६५ डिश",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज मंचुरियन ग्रेव्ही (Veg Manchurian Gravy)",
      price: 140,
      category: "Starters",
      description: "गरमागरम वाफाळती मंचुरियन ग्रेव्ही चायनीज स्वादासह",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज लॉलीपॉप (Veg Lollipop)",
      price: 160,
      category: "Starters",
      description: "खायला सोपे आणि चटपटीत कुरकुरीत लॉलीपॉप",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज क्रिस्पी (Veg Crispy)",
      price: 140,
      category: "Starters",
      description: "उत्कृष्ट तळलेल्या कुरकुरीत भाज्या सोयासॉसमधील",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "पनीर स्टिक (Paneer Stick)",
      price: 160,
      category: "Starters",
      description: "तळलेले कुरकुरीत पनीर स्टिक्स चटपटीत डिपिंगसह",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज स्प्रिंगरोल (Veg Spring Roll)",
      price: 150,
      category: "Starters",
      description: "ताजी चायनीज भाजी भरलेले कुरकुरीत स्प्रिंग रोल्स",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मशरूम मंचुरियन (Mushroom Manchurian)",
      price: 160,
      category: "Starters",
      description: "मशरूमचे लज्जतदार चायनीज पद्धतीचे मंचुरियन",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },

    // === २. व्हेज सूप (Veg Soup) ===
    {
      ownerId,
      name: "क्रिम ऑफ टोमॅटो सूप (Cream of Tomato Soup)",
      price: 80,
      category: "Veg Soup",
      description: "ताजे टोमॅटो आणि रिच क्रीमचे क्रीमी चवदार सूप",
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मन्चाव सूप (Manchow Soup)",
      price: 80,
      category: "Veg Soup",
      description: "तिखट-मसालेदार सुवासिक चायनीज सूप फ्राय केलेल्या नुडल्ससह",
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज हॉट एन सॉर सूप (Veg Hot & Sour Soup)",
      price: 90,
      category: "Veg Soup",
      description: "आंबट-तिखट मसालेदार चायनीज व्हेज सूप",
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज स्वीट कॉर्न सूप (Veg Sweet Corn Soup)",
      price: 90,
      category: "Veg Soup",
      description: "स्वीट कॉर्न आणि मिश्र भाज्यांचे सौम्य चवीचे सूप",
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "पालक पनीर गार्लीक सूप (Palak Paneer Garlic Soup)",
      price: 80,
      category: "Veg Soup",
      description: "आरोग्यदायी पालक, मऊ पनीर आणि लसणाचा अप्रतिम स्वाद",
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मशरूम सूप (Mushroom Soup)",
      price: 80,
      category: "Veg Soup",
      description: "ताजे मशरूम घालून बनवलेले क्रीमी सुवासिक सूप",
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },

    // === ३. पंजाबी डिश (Punjabi Dish) ===
    {
      ownerId,
      name: "व्हेज लबाबदार (Veg Lababdar)",
      price: 160,
      category: "Punjabi Dish",
      description: "क्रीमी आणि अत्यंत स्वादिष्ट पंजाबी ग्रेव्हीमधील मिश्र भाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज नजराना (Veg Nazrana)",
      price: 160,
      category: "Punjabi Dish",
      description: "हॉटेल तारा स्पेशल समृद्ध स्वादाची अप्रतिम भाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "काजूकरी तिखट (Kajukari Tikhat)",
      price: 160,
      category: "Punjabi Dish",
      description: "तिखट गावरान-पंजाबी पद्धतीची खमंग काजूकरी",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "काजू मसाला (Kaju Masala)",
      price: 160,
      category: "Punjabi Dish",
      description: "रिच काजू मसाल्याच्या तडकेबाज ग्रेव्हीमधील उत्कृष्ट काजू",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "काजूकरी स्वीट (Kajukari Sweet)",
      price: 170,
      category: "Punjabi Dish",
      description: "क्रीमी, सौम्य आणि गोड स्वादाची समृद्ध काजूकरी",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज भुना (Veg Bhuna)",
      price: 160,
      category: "Punjabi Dish",
      description: "विशेष तव्यावर मंद भाजून केलेल्या मसाल्यांची मिश्र भाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज भुना मसाला (Veg Bhuna Masala)",
      price: 170,
      category: "Punjabi Dish",
      description: "भुना ग्रेव्हीमधील चवदार आणि मसालेदार डिश",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "शेवभाजी पंजाबी (Shevbhaji Punjabi)",
      price: 150,
      category: "Punjabi Dish",
      description: "उत्तर भारतीय पंजाबी तडका असलेली मसालेदार शेवभाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मेथी मटर मसाला (Methi Matar Masala)",
      price: 160,
      category: "Punjabi Dish",
      description: "क्रीमी ग्रेव्हीत ताजी हिरवी मेथी आणि मटार",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मशरूम काजू मसाला (Mushroom Kaju Masala)",
      price: 170,
      category: "Punjabi Dish",
      description: "काजू आणि मशरूमचे शाही क्रीमी ग्रेव्हीमधील कॉम्बिनेशन",
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मशरूम मसाला (Mushroom Masala)",
      price: 170,
      category: "Punjabi Dish",
      description: "ताजे कापलेले मशरूम चमचमीत पंजाबी ग्रेव्हीत",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज अंगारा (Veg Angara)",
      price: 170,
      category: "Punjabi Dish",
      description: "कोळशाची वाफ देऊन स्मोकी बनवलेली उत्कृष्ट मसालेदार मिश्र भाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "दम आलु पंजाबी (Dum Aloo Punjabi)",
      price: 170,
      category: "Punjabi Dish",
      description: "पंजाबी मसाल्यात दम दिलेले मऊ चवदार बटाटे",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },

    // === ४. गावरान तडका (Gavran Tadka) ===
    {
      ownerId,
      name: "बैंगनकरी (Baingankari)",
      price: 140,
      category: "Gavran Tadka",
      description: "गावरान घरगुती पद्धतीचा वांग्याचा चमचमीत रस्सा",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "शेवगाकरी (Shevgakari)",
      price: 140,
      category: "Gavran Tadka",
      description: "ताजे शेवगा शेंगा गावरान खमंग रस्श्यामध्ये",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "सोयाबीन करी (Soyabean Kari)",
      price: 140,
      category: "Gavran Tadka",
      description: "गावरान पद्धतीची खमंग सोयाबीन रस्सा भाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "शेवभाजी करी (Shevbhaji Kari)",
      price: 140,
      category: "Gavran Tadka",
      description: "हॉटेल तारा विशेष झणझणीत गावरान शेवभाजी करी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मशरूम करी (Mushroom Kari)",
      price: 160,
      category: "Gavran Tadka",
      description: "मसालेदार सुवासिक गावरान रस्श्यातील ताजे मशरूम",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज अंडाकरी (Veg Andakari)",
      price: 160,
      category: "Gavran Tadka",
      description: "शुद्ध शाकाहारी विशेष हुबेहूब सोया-पनीर कोफ्ता अंडाकरी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "व्हेज मराठा (Veg Maratha)",
      price: 150,
      category: "Gavran Tadka",
      description: "कोल्हापुरी चमचमीत तिखट ग्रेव्हीत तळलेले व्हेज कोफ्ते",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "खोबर आमटी (Khobar Amti)",
      price: 140,
      category: "Gavran Tadka",
      description: "ओल्या आणि सुक्या खोबऱ्याच्या मसाल्याची पारंपारिक गावरान आमटी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "आलु मराठा (Aloo Maratha)",
      price: 140,
      category: "Gavran Tadka",
      description: "झणझणीत मराठा तडका बटाटा रस्सा भाजी",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },

    // === ५. दाळ स्पेशल (Dal Special) ===
    {
      ownerId,
      name: "दाळ फ्राय (Dal Fry)",
      price: 110,
      category: "Dal Special",
      description: "जिरे, लसूण, टोमॅटो आणि हिरव्या मिरच्यांचा फोडणीचा तूर दाळ रस्सा",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "दाळ तडका (Dal Tadka)",
      price: 120,
      category: "Dal Special",
      description: "पिवळी दाळ खमंग लाल सुक्या मिरच्या व लसूण कडकडीत तडक्यासह",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "जिरा दाळ (Jeera Dal)",
      price: 110,
      category: "Dal Special",
      description: "फक्त खमंग जिऱ्याची फोडणी दिलेली साधी पिवळी वरण दाळ",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "ब. दाळ फ्राय (Butter Dal Fry)",
      price: 120,
      category: "Dal Special",
      description: "भरपूर अमूल बटर घालून तडका दिलेली दाळ फ्राय",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "ब. दाळ तडका (Butter Dal Tadka)",
      price: 130,
      category: "Dal Special",
      description: "अमूल बटर मधील कडकडीत डबल तडका असलेली दाल",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "दाळ मेथी (Dal Methi)",
      price: 120,
      category: "Dal Special",
      description: "ताजी मेथी घालून बनवलेली पौष्टिक स्वादिष्ट दाळ",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "दाळ पालक (Dal Palak)",
      price: 120,
      category: "Dal Special",
      description: "ताजा चिरलेला पालक आणि दाळीचे अप्रतिम पाचक मिश्रण",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "दाळ कोल्हापुरी (Dal Kolhapuri)",
      price: 130,
      category: "Dal Special",
      description: "कोल्हापुरी लवंगी मिरची स्वादाची झणझणीत तिखट दाळ",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "दाळ कोल्हापुरी तडका (Dal Kolhapuri Tadka)",
      price: 140,
      category: "Dal Special",
      description: "कोल्हापुरी चटणी-मसाल्यांचा कडकडीत तडका दिलेली दाळ",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },

    // === ६. राईस / इतर (Rice / Extras) ===
    {
      ownerId,
      name: "दाल खिचडी (Dal Khichdi)",
      price: 150,
      category: "Rice / Extras",
      description: "मऊ मुग डाळ आणि तांदळाची साजूक तूप-फोडणीतील खिचडी",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "बटर दाल खिचडी (Butter Dal Khichdi)",
      price: 160,
      category: "Rice / Extras",
      description: "भरपूर अमूल बटर घालून शिजवलेली चवदार डाळ खिचडी",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "शेंगाचटणी (Shengachutney)",
      price: 40,
      category: "Rice / Extras",
      description: "गावरान सुकी शेंगदाणा चटणी, सोलापूर प्रसिद्ध",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "ठेचा वाटी (Thecha Vati)",
      price: 40,
      category: "Rice / Extras",
      description: "हिरव्या मिरचीचा अत्यंत झणझणीत खर्डा / ठेचा वाटी",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "तडका वाटी (Tadka Vati)",
      price: 40,
      category: "Rice / Extras",
      description: "मसालेदार तेल तडका वाटी भाकरीसोबत खाण्यासाठी",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "मसाला मठ्ठा (Masala Matha)",
      price: 30,
      category: "Rice / Extras",
      description: "हिरवी मिरची, कोथिंबीर, आल्याचा रस आणि जिरे पूड असलेले पाचक थंड ताक",
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },
    {
      ownerId,
      name: "प्लेन मठ्ठा (Plain Matha)",
      price: 25,
      category: "Rice / Extras",
      description: "जेवणानंतर पिण्यासाठी हलके पाचक थंडगार साधे ताक",
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    },

    // === ७. थाळी स्पेशल (Thali Special) ===
    {
      ownerId,
      name: "स्पेशल पंजाबी थाळी (Special Punjabi Thali)",
      price: 250,
      category: "Thali Special",
      description: "पनीर मसाला, काजू मसाला, डाळ तडका, ३ चपाती किंवा २ ज्वारी भाकरी, जिरा राईस, गुलाबजामून, पापड, सॅलड, शेंगाचटणी, तिखट ठेचा व तडका वाटी",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
      inStock: true,
      createdAt: new Date().toISOString()
    }
  ];
}
