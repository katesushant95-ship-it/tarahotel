import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with higher limit for uploading menus (images or PDFs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function getIndianFoodImage(itemName: string, categoryName: string = ''): string {
  const name = itemName.toLowerCase();
  const cat = categoryName.toLowerCase();

  // 1. Paneer Varieties
  if (name.includes('paneer') || name.includes('पनीर')) {
    if (name.includes('tikka') || name.includes('टिक्का') || name.includes('tandoor')) {
      return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('butter') || name.includes('masala') || name.includes('makhani') || name.includes('मसाला') || name.includes('kadai') || name.includes('kadhai')) {
      return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('palak') || name.includes('saag') || name.includes('पालक')) {
      return 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80';
  }

  // 2. Chicken Varieties
  if (name.includes('chicken') || name.includes('मुरघा') || name.includes('कोंबडी') || name.includes('lollipop') || name.includes('tikka') || name.includes('kabab') || name.includes('kebab') || name.includes('tandoor')) {
    if (name.includes('tikka') || name.includes('kabab') || name.includes('kebab') || name.includes('tandoor') || name.includes('lollipop') || name.includes('crispy') || name.includes('fry') || name.includes('fried')) {
      return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('butter') || name.includes('masala') || name.includes('curry') || name.includes('handi') || name.includes('kadai')) {
      return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80';
  }

  // 3. Mutton / Meat Varieties
  if (name.includes('mutton') || name.includes('lamb') || name.includes('meat') || name.includes('rogan') || name.includes('मटण') || name.includes('खेमा') || name.includes('keema')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
  }

  // 4. Fish & Seafood
  if (name.includes('fish') || name.includes('prawn') || name.includes('surmai') || name.includes('pomfret') || name.includes('crab') || name.includes('bombil') || name.includes('मासा') || name.includes('कोळंबी')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80';
  }

  // 5. Biryani & Rice Varieties
  if (name.includes('biryani') || name.includes('pulao') || name.includes('pulav') || name.includes('rice') || name.includes('chawal') || name.includes('khichdi') || name.includes('भात') || name.includes('बिर्याणी')) {
    if (name.includes('biryani') || name.includes('बिर्याणी')) {
      return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('jeera') || name.includes('fried') || name.includes('schezwan')) {
      return 'https://images.unsplash.com/photo-1603133872878-68550a5e7b64?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80';
  }

  // 6. Indian Breads
  if (name.includes('roti') || name.includes('naan') || name.includes('chapati') || name.includes('paratha') || name.includes('kulcha') || name.includes('bhakri') || name.includes('tandoor') || name.includes('पोळी') || name.includes('भाकरी')) {
    return 'https://images.unsplash.com/photo-1626132585422-43ee13319cfd?w=600&auto=format&fit=crop&q=80';
  }

  // 7. Samosa, Kachori & Starters
  if (name.includes('samosa') || name.includes('समवसा') || name.includes('kachori') || name.includes('crispy') || name.includes('starter') || name.includes('pakoda') || name.includes('pakora') || name.includes('bhaji') || name.includes('bhajji') || name.includes('roll')) {
    return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80';
  }

  // 8. Chole Bhature / Chana Masala
  if (name.includes('chole') || name.includes('bhatur') || name.includes('chana') || name.includes('bhature')) {
    return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80';
  }

  // 9. Dal / Lentils
  if (name.includes('dal') || name.includes('tadka') || name.includes('fry') || name.includes('makhani') || name.includes('lentil') || name.includes('वरण') || name.includes('आमटी')) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
  }

  // 10. South Indian Specialty (Idli, Dosa, Sambhar)
  if (name.includes('idli') || name.includes('dosa') || name.includes('uttapam') || name.includes('wada') || name.includes('vada') || name.includes('sambar') || name.includes('इडली') || name.includes('डोसा')) {
    return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
  }

  // 11. Street Food Specialty: Pav Bhaji
  if (name.includes('pav bhaji') || name.includes('pavbhaji') || name.includes('पावभाजी')) {
    return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80';
  }

  // 12. Street Food Specialty: Misal Pav
  if (name.includes('misal') || name.includes('मिसळ')) {
    return 'https://images.unsplash.com/photo-1606491959343-40e854fa1875?w=600&auto=format&fit=crop&q=80';
  }

  // 13. Sev Bhaji / Shevbhaji
  if (name.includes('shevbhaji') || name.includes('shev bhaji') || name.includes('sev bhaji') || name.includes('sevbhaji')) {
    return 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80';
  }

  // 14. Chinese Noodles / Manchurian
  if (name.includes('manchurian') || name.includes('chilli') || name.includes('chinese') || name.includes('noodle') || name.includes('hakka') || name.includes('chowmein')) {
    return 'https://images.unsplash.com/photo-1603133872878-68550a5e7b64?w=600&auto=format&fit=crop&q=80';
  }

  // 15. Pizza
  if (name.includes('pizza') || name.includes('पिझ्झा')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
  }

  // 16. Burger & Sandwiches
  if (name.includes('burger') || name.includes('बर्गर') || name.includes('sandwich') || name.includes('सँडविच')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
  }

  // 17. Tea & Chai
  if (name.includes('chai') || name.includes('tea') || name.includes('amruttulya') || name.includes('चहा')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80';
  }

  // 18. Coffee
  if (name.includes('coffee') || name.includes('काॅफी')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80';
  }

  // 19. Lassi & Shakes
  if (name.includes('lassi') || name.includes('shake') || name.includes('lassy')) {
    return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80';
  }

  // 20. Buttermilk / Chaas / Solkadhi
  if (name.includes('chaas') || name.includes('buttermilk') || name.includes('ताक') || name.includes('solkadhi') || name.includes('sol kadhi') || name.includes('taak')) {
    return 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80';
  }

  // 21. Ice Cream & Kulfi
  if (name.includes('kulfi') || name.includes('ice cream') || name.includes('icecream') || name.includes('कुल्फी')) {
    return 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&auto=format&fit=crop&q=80';
  }

  // 22. Indian Sweets & Desserts
  if (name.includes('gulab') || name.includes('jamun') || name.includes('sweet') || name.includes('dessert') || name.includes('halwa') || name.includes('jalebi') || name.includes('pedha') || name.includes('shrikhand') || name.includes('rasmalai') || name.includes('rasgulla')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
  }

  // 23. Traditional Breakfasts: Poha, Upma, Sheera
  if (name.includes('poha') || name.includes('pohe') || name.includes('पोहे') || name.includes('upma') || name.includes('shira') || name.includes('sheera')) {
    return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80';
  }

  // 24. Soup Varieties
  if (name.includes('soup') || name.includes('shorba') || name.includes('सूप')) {
    return 'https://images.unsplash.com/photo-1547592165-e1d17fed6006?w=600&auto=format&fit=crop&q=80';
  }

  // 25. Indian Thali/Meal Plates
  if (name.includes('thali') || name.includes('थाळी') || name.includes('plate') || name.includes('meal')) {
    return 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80';
  }

  // 26. General Drinks & Juices
  if (cat.includes('drink') || cat.includes('beverage') || name.includes('juice') || name.includes('soda') || name.includes('mojito') || name.includes('water')) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80';
  }

  // General photorealistic Indian restaurant thali / rustic hot curry layout fallback
  return 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80';
}

// API endpoint to parse menu PDF or Image or raw text using server-side Gemini
app.post('/api/ai/parse-menu', async (req, res) => {
  try {
    const { fileBase64, mimeType, rawText } = req.body;

    if (!rawText && (!fileBase64 || !mimeType)) {
      return res.status(400).json({ error: 'Missing rawText or fileBase64/mimeType in request body.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const systemInstruction = `You are an expert restaurant digital menu designer and AI data extractor.
Your task is to analyze the user input (which can be an uploaded document image/PDF, or copy-pasted menu text of items, prices, and names) and extract all categories and food/beverage items with their names, exact prices, and descriptions.

Follow these strict rules:
1. Extract ALL food items and drink items mentioned in the input with 100% accuracy of name and price. Do NOT change prices or names.
2. Prices must be extracted as pure numbers. If there are multiple sizes or prices, pick the primary/lowest price.
3. Group the items into logical categories. For each category, define a unique snake_case string ID (e.g., 'starters', 'veg_soup', 'punjabi_dishes', 'desserts').
4. For each category, provide:
   - "id": the unique snake_case ID
   - "name": English category label (e.g. "Main Course")
   - "labelMr": Translate the category to elegant Marathi (e.g. "मुख्य कोर्स")
   - "labelHi": Translate the category to elegant Hindi (e.g. "मुख्य भोजन")
5. For each item, provide:
   - "name": The exact item name from the menu
   - "price": The exact price as a number
   - "category": The exact snake_case ID of the category this item belongs to
   - "description": Provide a detailed but concise explanation explaining what the dish is (even if not explicitly described, generate a short appetizing, attractive description in English).
6. Ensure every item's "category" field matches one of the category IDs you generated.
`;

    let contents: any[] = [];

    if (rawText) {
      contents = [
        { text: `Here is my copy-pasted menu text with names, prices, and items. Analyze this text and extract all categories and items:\n\n${rawText}` }
      ];
    } else {
      const documentPart = {
        inlineData: {
          mimeType: mimeType,
          data: fileBase64,
        }
      };
      contents = [
        documentPart,
        { text: 'Analyze this menu document and extract all food items, prices, and categories according to the defined schema.' }
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              description: 'List of all categories identified in the menu. Provide translations for Marathi and Hindi.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique snake_case category ID.' },
                  name: { type: Type.STRING, description: 'Category name in English.' },
                  labelMr: { type: Type.STRING, description: 'Category label in Marathi.' },
                  labelHi: { type: Type.STRING, description: 'Category label in Hindi.' }
                },
                required: ['id', 'name', 'labelMr', 'labelHi']
              }
            },
            items: {
              type: Type.ARRAY,
              description: 'List of all food and drink items found in the menu.',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Name of the item as listed.' },
                  price: { type: Type.NUMBER, description: 'Price of the item as a pure number.' },
                  category: { type: Type.STRING, description: 'The exact snake_case ID of the category this item belongs to.' },
                  description: { type: Type.STRING, description: 'Appetizing description of the dish in English.' }
                },
                required: ['name', 'price', 'category', 'description']
              }
            }
          },
          required: ['categories', 'items']
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{"categories":[], "items":[]}');
    
    // Enhance parsed items with high-quality Indian food images
    if (parsedData.items && Array.isArray(parsedData.items)) {
      parsedData.items = parsedData.items.map((item: any) => {
        const itemImg = getIndianFoodImage(item.name, item.category);
        return {
          ...item,
          imageUrl: itemImg
        };
      });
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error parsing menu via Gemini:', error);
    return res.status(500).json({ error: error?.message || 'Failed to parse menu document.' });
  }
});

// API endpoint to search web and draft a menu for a restaurant via Gemini Search Grounding
app.post('/api/ai/search-menu', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'कृपया रेस्टॉरंटचे नाव किंवा शोध संज्ञा टाका. (Please enter a restaurant name or search query.)' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const systemInstruction = `You are an expert restaurant digital menu scout, search grounder, and data extractor.
Your task is to use the Google Search tool to find the real menu items, categories, and prices for the restaurant requested by the user: "${query.trim()}".

Extract or construct a comprehensive, highly realistic menu consisting of 15 to 35 top-selling, delicious dishes and drinks.
If you find the exact restaurant menu, use its real items and prices (convert to INR if needed).
If you cannot find the exact menu with precise prices, perform a regional menu search for that city or style (e.g. Kolhapuri, Puneri, Malvani, South Indian, Punjabi) and draft an incredibly authentic and enticing menu reflecting the typical popular local items and specialty items of that restaurant type with realistic prices in INR, so the restaurant owner gets an instant high-quality draft menu to import!

Follow these strict rules:
1. Extract or draft 15-35 high-quality food/beverage items.
2. Group the items into logical categories. For each category, define a unique snake_case string ID (e.g., 'starters', 'soups', 'main_course', 'chinese', 'maharashtrian_special', 'desserts', 'beverages').
3. For each category, provide:
   - "id": the unique snake_case ID
   - "name": English category label (e.g. "Main Course")
   - "labelMr": Translate the category to elegant Marathi (e.g. "मुख्य कोर्स" or "महाराष्ट्रीयन स्पेशल")
   - "labelHi": Translate the category to elegant Hindi (e.g. "मुख्य भोजन")
4. For each item, provide:
   - "name": The exact or standard food item name (e.g. "Paneer Butter Masala", "Shev Bhaji", "Special Veg Thali")
   - "price": A realistic price as a number (e.g. 140, 180, 240)
   - "category": The exact snake_case ID of the category this item belongs to
   - "description": Provide a detailed, delicious, but concise English explanation explaining what the dish contains or its taste profile.
5. Ensure every item's "category" field matches one of the category IDs you generated.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Search the web for the menu card of this restaurant or region and return a fully detailed categories and items schema: "${query.trim()}"`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              description: 'List of logical menu categories found or suggested. Translate to Marathi and Hindi.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique snake_case category ID.' },
                  name: { type: Type.STRING, description: 'Category name in English.' },
                  labelMr: { type: Type.STRING, description: 'Category label in Marathi.' },
                  labelHi: { type: Type.STRING, description: 'Category label in Hindi.' }
                },
                required: ['id', 'name', 'labelMr', 'labelHi']
              }
            },
            items: {
              type: Type.ARRAY,
              description: 'List of high-quality extracted or draft food items with prices and descriptions.',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Standard name of the food item.' },
                  price: { type: Type.NUMBER, description: 'Price of the item as a pure number in INR.' },
                  category: { type: Type.STRING, description: 'The exact snake_case ID of the category this item belongs to.' },
                  description: { type: Type.STRING, description: 'Detailed appetizing description in English.' }
                },
                required: ['name', 'price', 'category', 'description']
              }
            }
          },
          required: ['categories', 'items']
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{"categories":[], "items":[]}');
    
    // Enhance parsed items with high-quality Indian food images
    if (parsedData.items && Array.isArray(parsedData.items)) {
      parsedData.items = parsedData.items.map((item: any) => {
        const itemImg = getIndianFoodImage(item.name, item.category);
        return {
          ...item,
          imageUrl: itemImg
        };
      });
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error searching and parsing menu via Gemini:', error);
    return res.status(500).json({ error: error?.message || 'Failed to search and parse menu.' });
  }
});

// Helper function to convert raw PCM 16-bit 24kHz audio from Gemini into a valid WAV file
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

// In-memory cache for audio clips to provide sub-second responses to customers
const ttsAudioCache = new Map<string, Buffer>();

const PRESET_MARATHI_SCRIPTS: Record<string, string> = {
  welcome_and_order: 'हॉटेल तारा मध्ये आपले सहर्ष स्वागत आहे! ही आमची अधिकृत डिजिटल मेनू वेबसाईट आहे. आता तुम्हाला वेटरची वाट पाहण्याची अजिबात गरज नाही. तुम्ही थेट तुमच्या मोबाईलवरून आमचे सर्व स्वादिष्ट पदार्थ पाहू शकता आणि आपल्या टेबलवरूनच ऑर्डर नोंदवू शकता. ऑर्डर कशी करावी ते समजून घ्या: पहिली पायरी, खाली दिलेल्या मेनूमध्ये आपले आवडते पदार्थ शोधा. दुसरी पायरी, पदार्थासमोरील अधिक म्हणजेच प्लस बटनावर क्लिक करून तो पदार्थ कार्टमध्ये जोडा. तिसरी पायरी, खाली दिसणाऱ्या हिरव्या रंगाच्या ऑर्डर द्या बटनावर क्लिक करा आणि आपली ऑर्डर कन्फर्म करा. तुमची ऑर्डर थेट आमच्या किचनमध्ये पोहोचेल आणि गरमागरम ताजे जेवण थोड्याच वेळात तुमच्या टेबलवर हजर होईल. काही अडचण असल्यास वेटरला बोलवा. धन्यवाद आणि शुभ भोजन!',
  how_to_order: 'ऑर्डर कशी करावी ते ऐका: पायरी एक, खाली मेनूमध्ये आपले आवडते पदार्थ शोधा. पायरी दोन, पदार्थासमोरील अधिक म्हणजेच प्लस बटनावर क्लिक करून तो कार्टमध्ये जोडा. पायरी तीन, खाली दिलेल्या हिरव्या रंगाच्या ऑर्डर द्या बटनावर क्लिक करा. ऑर्डर थेट किचनमध्ये पाठवली जाईल. धन्यवाद!',
  what_is_this: 'ही हॉटेल ताराची स्मार्ट डिजिटल मेनू वेबसाईट आहे. या वेबसाईटद्वारे आपण हॉटेलमधील सर्व शाकाहारी, गावरान आणि पंजाबी पदार्थांचे ताजे दर, फोटो आणि विशेष मेनू पाहू शकता. तसेच टेबलवरूनच थेट किचनमध्ये ऑर्डर देऊन आपल्या जेवणाची ऑर्डर लाईव्ह ट्रॅक करू शकता.',
  famous_dishes: 'हॉटेल तारा मध्ये आमची खास खानदेशी झणझणीत शेवभाजी, स्पेशल कढई पनीर, अस्सल खमंग डाळ तडका जिरा राईस, आणि मातीच्या मटक्यातील थंडगार कुल्फी हे सर्वात जास्त लोकप्रिय पदार्थ आहेत. नक्की आस्वाद घ्या!'
};

// Helper function to synthesize speech via Gemini TTS with graceful quota failure handling
async function synthesizeSpeech(text: string, voice: string = 'Kore'): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Gemini did not return audio data');
  }

  const pcmBuf = Buffer.from(base64Audio, 'base64');
  return pcmToWav(pcmBuf, 24000, 1, 16);
}

// GET endpoint: /api/tts?id=welcome_and_order or /api/tts?text=...
app.get('/api/tts', async (req, res) => {
  try {
    const id = req.query.id as string | undefined;
    const rawText = req.query.text as string | undefined;
    const voice = (req.query.voice as string) || 'Kore';

    let textToSpeak = rawText;
    if (!textToSpeak && id && PRESET_MARATHI_SCRIPTS[id]) {
      textToSpeak = PRESET_MARATHI_SCRIPTS[id];
    }

    if (!textToSpeak) {
      return res.status(400).json({ error: 'Text or valid preset ID is required' });
    }

    const cacheKey = id ? `${id}_${voice}` : `${textToSpeak.trim()}_${voice}`;
    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    const wavBuf = await synthesizeSpeech(textToSpeak, voice);
    ttsAudioCache.set(cacheKey, wavBuf);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(wavBuf);
  } catch (error: any) {
    const isQuota = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('Quota exceeded') || error?.message?.includes('429');
    if (isQuota) {
      return res.status(429).json({ error: 'quota_exceeded', fallback: true, message: 'Gemini TTS quota exceeded. Client should use browser speech synthesis.' });
    }
    console.error('Error in GET /api/tts:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Failed to synthesize voice audio.', fallback: true });
  }
});

// POST endpoint: /api/tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, id, voice = 'Kore' } = req.body;
    let textToSpeak = text;
    if (!textToSpeak && id && PRESET_MARATHI_SCRIPTS[id]) {
      textToSpeak = PRESET_MARATHI_SCRIPTS[id];
    }

    if (!textToSpeak || typeof textToSpeak !== 'string') {
      return res.status(400).json({ error: 'Text string or valid preset ID is required' });
    }

    const cacheKey = id ? `${id}_${voice}` : `${textToSpeak.trim()}_${voice}`;
    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    const wavBuf = await synthesizeSpeech(textToSpeak, voice);
    ttsAudioCache.set(cacheKey, wavBuf);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(wavBuf);
  } catch (error: any) {
    const isQuota = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('Quota exceeded') || error?.message?.includes('429');
    if (isQuota) {
      return res.status(429).json({ error: 'quota_exceeded', fallback: true, message: 'Gemini TTS quota exceeded. Client should use browser speech synthesis.' });
    }
    console.error('Error in POST /api/tts:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Failed to synthesize voice audio.', fallback: true });
  }
});

// Vite middleware integration
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
