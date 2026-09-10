import React, { useState, useEffect } from 'react';
import { getHotelTaraMenu } from '../lib/hotelTaraMenu';
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc, setDoc } from '../lib/firebase';
import { MenuItem, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/translations';
import { Plus, Edit3, Trash2, Check, X, Loader2, Image, ShoppingBag, Eye, RefreshCw, AlertCircle, Upload, Tag, FolderHeart, Sparkles, FileText, HelpCircle, Search, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface MenuManagerProps {
  ownerId: string;
}

// Beautiful stock food image presets for rapid setup
const IMAGE_PRESETS = [
  { name: 'Samosa / Starters', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60' },
  { name: 'Paneer Tikka / Starters', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60' },
  { name: 'Butter Chicken / Main', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60' },
  { name: 'Chicken Biryani / Main', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60' },
  { name: 'Chole Bhature / Main', url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=60' },
  { name: 'Masala Chai / Drinks', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60' },
  { name: 'Mango Lassi / Drinks', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60' },
  { name: 'Gulab Jamun / Desserts', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60' },
  { name: 'Ice Cream / Desserts', url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&auto=format&fit=crop&q=60' }
];

export default function MenuManager({ ownerId }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('Starters');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(IMAGE_PRESETS[0].url);
  const [inStock, setInStock] = useState(true);

  // AI Menu Importer state
  const [isAiImporterOpen, setIsAiImporterOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<Array<{
    name: string;
    price: number;
    category: string;
    description: string;
    selected: boolean;
    imageUrl: string;
  }>>([]);
  const [parsedCategories, setParsedCategories] = useState<Category[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeImagePickerIndex, setActiveImagePickerIndex] = useState<number | null>(null);
  const [activeImportTab, setActiveImportTab] = useState<'upload' | 'paste' | 'search'>('upload');
  const [rawPasteText, setRawPasteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom categories state
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLabelMr, setNewCatLabelMr] = useState('');
  const [newCatLabelHi, setNewCatLabelHi] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [savingCategories, setSavingCategories] = useState(false);

  const fetchCategories = async () => {
    try {
      const userRef = doc(db, 'users', ownerId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          // Auto select first category in state if not matching
          const firstCatId = data.categories[0].id;
          setCategory(prev => data.categories.some((c: Category) => c.id === prev) ? prev : firstCatId);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }
    } catch (err) {
      console.error("Error fetching custom categories:", err);
    }
  };

  const handleSaveCategories = async (newCategoriesList: Category[]) => {
    setSavingCategories(true);
    try {
      const userRef = doc(db, 'users', ownerId);
      await setDoc(userRef, { categories: newCategoriesList }, { merge: true });
      setCategories(newCategoriesList);
    } catch (err) {
      console.error("Error saving categories:", err);
      alert("Failed to save categories.");
    } finally {
      setSavingCategories(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    // Build ID from English name
    const generatedId = editingCatId || newCatName.trim().toLowerCase().replace(/\s+/g, '_');
    
    const newCatObj: Category = {
      id: generatedId,
      name: newCatName.trim(),
      labelMr: newCatLabelMr.trim() || newCatName.trim(),
      labelHi: newCatLabelHi.trim() || newCatName.trim()
    };

    let updatedList: Category[];
    if (editingCatId) {
      updatedList = categories.map(cat => cat.id === editingCatId ? newCatObj : cat);
    } else {
      updatedList = [...categories, newCatObj];
    }

    await handleSaveCategories(updatedList);

    // Reset fields
    setNewCatName('');
    setNewCatLabelMr('');
    setNewCatLabelHi('');
    setEditingCatId(null);
  };

  const handleEditCategoryStart = (cat: Category) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatLabelMr(cat.labelMr);
    setNewCatLabelHi(cat.labelHi);
  };

  const handleDeleteCategory = async (catId: string) => {
    if (confirm("Are you sure you want to delete this category? Dishes in this category will not be deleted, but they won't have a registered category.")) {
      const updatedList = categories.filter(cat => cat.id !== catId);
      await handleSaveCategories(updatedList);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setAiError("कृपया पीडीएफ किंवा इमेज मेनू निवडा. (Please upload a PDF menu file or a menu image).");
      return;
    }

    setIsParsing(true);
    setAiError(null);
    setParsedItems([]);
    setParsedCategories([]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/ai/parse-menu', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let parsedErr;
            try {
              parsedErr = JSON.parse(errorText);
            } catch {
              parsedErr = { error: errorText };
            }
            throw new Error(parsedErr?.error || 'Failed to analyze menu document.');
          }

          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            // Map the parsed items to include a "selected" checkbox, and a default imageUrl chosen from presets
            const mappedItems = data.items.map((item: any) => {
              // Intelligently find a matching preset image based on item name or category
              const matchingPreset = IMAGE_PRESETS.find(preset => 
                item.name.toLowerCase().includes(preset.name.split('/')[0].trim().toLowerCase()) ||
                item.category.toLowerCase().includes(preset.name.split('/')[1]?.trim().toLowerCase() || '')
              ) || IMAGE_PRESETS[Math.floor(Math.random() * IMAGE_PRESETS.length)];

              return {
                ...item,
                selected: true,
                imageUrl: matchingPreset.url,
              };
            });

            setParsedItems(mappedItems);
            setParsedCategories(data.categories || []);
          } else {
            throw new Error('No items were extracted. Please make sure the image or PDF is clear and contains a list of foods with prices.');
          }
        } catch (err: any) {
          console.error("Error calling parse-menu API:", err);
          setAiError(err?.message || "An unexpected error occurred during analysis.");
        } finally {
          setIsParsing(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setAiError("Failed to read file.");
      setIsParsing(false);
    }
  };

  const handleRawTextParse = async () => {
    if (!rawPasteText.trim()) {
      setAiError("कृपया प्रक्रिया करण्यासाठी तुमचा मेनू मजकूर टाका. (Please paste your menu text to analyze.)");
      return;
    }

    setIsParsing(true);
    setAiError(null);
    setParsedItems([]);
    setParsedCategories([]);

    try {
      const response = await fetch('/api/ai/parse-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: rawPasteText.trim()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedErr;
        try {
          parsedErr = JSON.parse(errorText);
        } catch {
          parsedErr = { error: errorText };
        }
        throw new Error(parsedErr?.error || 'Failed to analyze copy-pasted menu text.');
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        const mappedItems = data.items.map((item: any) => {
          const matchingPreset = IMAGE_PRESETS.find(preset => 
            item.name.toLowerCase().includes(preset.name.split('/')[0].trim().toLowerCase()) ||
            item.category.toLowerCase().includes(preset.name.split('/')[1]?.trim().toLowerCase() || '')
          ) || IMAGE_PRESETS[Math.floor(Math.random() * IMAGE_PRESETS.length)];

          return {
            ...item,
            selected: true,
            imageUrl: item.imageUrl || matchingPreset.url,
          };
        });

        setParsedItems(mappedItems);
        setParsedCategories(data.categories || []);
      } else {
        throw new Error('No items were extracted. Please make sure the pasted text contains a list of foods with clear names and prices.');
      }
    } catch (err: any) {
      console.error("Error calling parse-menu API via raw text:", err);
      setAiError(err?.message || "An unexpected error occurred during copy-paste analysis.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleWebSearchParse = async () => {
    if (!searchQuery.trim()) {
      setAiError("कृपया रेस्टॉरंटचे नाव किंवा शोध संज्ञा टाका. (Please enter restaurant name/location.)");
      return;
    }

    setIsParsing(true);
    setAiError(null);
    setParsedItems([]);
    setParsedCategories([]);

    try {
      const response = await fetch('/api/ai/search-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedErr;
        try {
          parsedErr = JSON.parse(errorText);
        } catch {
          parsedErr = { error: errorText };
        }
        throw new Error(parsedErr?.error || 'Failed to search and draft menu from web.');
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        const mappedItems = data.items.map((item: any) => {
          const matchingPreset = IMAGE_PRESETS.find(preset => 
            item.name.toLowerCase().includes(preset.name.split('/')[0].trim().toLowerCase()) ||
            item.category.toLowerCase().includes(preset.name.split('/')[1]?.trim().toLowerCase() || '')
          ) || IMAGE_PRESETS[Math.floor(Math.random() * IMAGE_PRESETS.length)];

          return {
            ...item,
            selected: true,
            imageUrl: item.imageUrl || matchingPreset.url,
          };
        });

        setParsedItems(mappedItems);
        setParsedCategories(data.categories || []);
      } else {
        throw new Error('No items were drafted. Please try with more specific restaurant name or keywords.');
      }
    } catch (err: any) {
      console.error("Error calling search-menu API:", err);
      setAiError(err?.message || "An unexpected error occurred during restaurant menu search.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportParsedMenu = async () => {
    const selectedItemsToImport = parsedItems.filter(item => item.selected);
    if (selectedItemsToImport.length === 0) {
      alert("कृपया आयात करण्यासाठी किमान एक खाद्यपदार्थ निवडा. (Please select at least one item to import.)");
      return;
    }

    setImporting(true);
    try {
      // 1. Add any new categories that are not already in our categories list
      const updatedCategories = [...categories];
      let categoriesAddedCount = 0;
      
      parsedCategories.forEach(newCat => {
        if (!updatedCategories.some(c => c.id === newCat.id)) {
          updatedCategories.push(newCat);
          categoriesAddedCount++;
        }
      });

      if (categoriesAddedCount > 0) {
        await handleSaveCategories(updatedCategories);
      }

      // 2. Add each selected food item to Firestore
      const batchPromises = selectedItemsToImport.map(async (item) => {
        const itemData = {
          ownerId,
          name: item.name.trim(),
          price: Number(item.price) || 0,
          category: item.category,
          description: item.description.trim(),
          imageUrl: item.imageUrl,
          inStock: true,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'menuItems'), itemData);
      });

      await Promise.all(batchPromises);
      await fetchMenu();
      setIsAiImporterOpen(false);
      setParsedItems([]);
      setParsedCategories([]);
      alert(`यशस्वीरित्या ${selectedItemsToImport.length} खाद्यपदार्थ आणि ${categoriesAddedCount} नवीन श्रेण्या जोडल्या गेल्या! (Successfully imported ${selectedItemsToImport.length} items and ${categoriesAddedCount} categories!)`);
    } catch (err) {
      console.error("Error importing parsed menu items:", err);
      alert("Failed to import menu items.");
    } finally {
      setImporting(false);
    }
  };

  const handleUpdateParsedItem = (index: number, field: string, value: any) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Selected image is too large. Please upload an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchMenu = async () => {
    setFetching(true);
    try {
      const menuRef = collection(db, 'menuItems');
      const q = query(menuRef, where('ownerId', '==', ownerId));
      const snapshot = await getDocs(q);
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      
      // Sort in-memory to prevent requiring composite index creation!
      fetchedItems.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setItems(fetchedItems);
      
      // If menu is completely empty, suggest generating some high-quality sample dishes
      if (fetchedItems.length === 0) {
        // We can do auto-seeding or suggest it in the UI
      }
    } catch (err) {
      console.error("Error fetching menu items:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [ownerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setLoading(true);

    const parsedPrice = parseFloat(price);

    const itemData = {
      ownerId,
      name: name.trim(),
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      category,
      description: description.trim(),
      imageUrl: imageUrl.trim() || IMAGE_PRESETS[0].url,
      inStock,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingItem) {
        // Edit flow
        await updateDoc(doc(db, 'menuItems', editingItem.id), itemData);
        setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...itemData } : item));
      } else {
        // Add flow
        const docRef = await addDoc(collection(db, 'menuItems'), itemData);
        setItems(prev => [{ id: docRef.id, ...itemData }, ...prev]);
      }

      // Close and Reset
      resetForm();
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert("Failed to save menu item.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory(categories[0]?.id || 'Starters');
    setDescription('');
    setImageUrl(IMAGE_PRESETS[0].url);
    setInStock(true);
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price.toString());
    setCategory(item.category);
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setInStock(item.inStock);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menuItems', id));
      setItems(prev => prev.filter(item => item.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting menu item:", err);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const updatedStatus = !item.inStock;
    try {
      // Optimistic update
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, inStock: updatedStatus } : i));
      await updateDoc(doc(db, 'menuItems', item.id), { inStock: updatedStatus });
    } catch (err) {
      console.error("Error toggling stock:", err);
      // Revert if failed
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, inStock: !updatedStatus } : i));
    }
  };

  // Seed default beautiful restaurant dishes to make the app ready to run instantly
  const seedSampleMenu = async () => {
    setLoading(true);
    const sampleDishes = getHotelTaraMenu(ownerId);
    try {
      for (const dish of sampleDishes) {
        await addDoc(collection(db, 'menuItems'), dish);
      }
      await fetchMenu();
    } catch (err) {
      console.error("Error seeding menu:", err);
      alert("Failed to seed sample menu.");
    } finally {
      setLoading(false);
    }
  };

  const resetToHotelTaraMenu = async () => {
    if (!window.confirm("तुम्हाला खात्री आहे का की तुम्ही जुने सर्व मेनू खोडून 'हॉटेल तारा' चे अधिकृत मराठी मेनू योग्य किमतीसह लोड करू इच्छिता? (Are you sure you want to erase all current menu items and load the official Hotel Tara Marathi Menu with correct prices?)")) return;
    setLoading(true);
    try {
      // 1. Delete all current items
      const menuRef = collection(db, 'menuItems');
      const q = query(menuRef, where('ownerId', '==', ownerId));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'menuItems', d.id));
      }

      // 2. Load Hotel Tara Marathi Items
      const sampleDishes = getHotelTaraMenu(ownerId);

      for (const dish of sampleDishes) {
        await addDoc(collection(db, 'menuItems'), dish);
      }
      await fetchMenu();
      alert("सर्व जुनी मेनू यशस्वीरित्या मिटवली असून 'हॉटेल तारा'चे नवीन मराठी मेनू किमतीसह जोडण्यात आले आहेत! (All old menu items cleared and official Hotel Tara Marathi Menu has been loaded!)");
    } catch (err) {
      console.error("Error resetting menu:", err);
      alert("Failed to reset menu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-600" />
            Menu Item Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Add new food items, update descriptions, change pricing, and toggle in-stock availability instantly.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 self-start">
          <button
            onClick={resetToHotelTaraMenu}
            disabled={loading || fetching}
            className="flex items-center gap-1.5 text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 cursor-pointer disabled:opacity-50"
            title="Erase all existing items and load official Hotel Tara menu in Marathi"
          >
            🔥 Erase & Load Hotel Tara Marathi Menu
          </button>
          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
            title="Add, edit, or delete menu categories"
          >
            <FolderHeart className="w-4 h-4 text-orange-600" /> Manage Categories
          </button>
          <button
            onClick={() => setIsAiImporterOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
            title="Upload PDF or photo of printed menu to instantly add food items using AI"
          >
            <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" /> ✨ AI Menu Importer
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Slide-out or overlay form for Add/Edit */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Image className="w-5 h-5 text-orange-600" />
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button 
                onClick={resetForm}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">FOOD NAME</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Masala Dosa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">PRICE (INR ₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">CATEGORY</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                        category === cat.id 
                          ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs scale-95 font-extrabold' 
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.labelMr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe ingredients, cooking style, portion size..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                />
              </div>

              {/* Image Presets & Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SELECT PRESET DISH IMAGE</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 relative transition-all ${
                        imageUrl === preset.url ? 'border-orange-500 scale-95 shadow-md' : 'border-slate-100 hover:border-slate-300'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="mt-3 bg-orange-50/50 p-3 rounded-xl border border-dashed border-orange-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-orange-600" />
                    Upload from Device Gallery
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">Choose any picture from your mobile or computer storage.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="block w-full text-xs text-slate-500
                      file:mr-4 file:py-1.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs file:font-semibold
                      file:bg-orange-100 file:text-orange-700
                      hover:file:bg-orange-200 cursor-pointer"
                  />
                </div>
                
                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">OR CUSTOM IMAGE URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/food-image.jpg"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs text-slate-600"
                  />
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-xs font-bold text-slate-700">In Stock Availability</span>
                  <span className="text-[10px] text-slate-400 font-medium">Toggling off shows as 'Out of Stock' on customer menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInStock(!inStock)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    inStock ? 'bg-orange-600' : 'bg-slate-300'
                  }`}
                >
                  <span 
                    className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                      inStock ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" /> Save Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-600" />
                श्रेणी व्यवस्थापन (Manage Categories)
              </h3>
              <button 
                onClick={() => {
                  setIsCategoriesModalOpen(false);
                  setEditingCatId(null);
                  setNewCatName('');
                  setNewCatLabelMr('');
                  setNewCatLabelHi('');
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Add / Edit Category Form */}
              <form onSubmit={handleAddCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {editingCatId ? 'श्रेणी संपादित करा (Edit Category)' : 'नवीन श्रेणी जोडा (Add New Category)'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ENGLISH NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Starters"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">मराठी नाव (MARATHI)</label>
                    <input
                      type="text"
                      placeholder="उदा. स्टार्टर"
                      value={newCatLabelMr}
                      onChange={(e) => setNewCatLabelMr(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">हिंदी नाम (HINDI)</label>
                    <input
                      type="text"
                      placeholder="उदा. स्टार्टर"
                      value={newCatLabelHi}
                      onChange={(e) => setNewCatLabelHi(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(null);
                        setNewCatName('');
                        setNewCatLabelMr('');
                        setNewCatLabelHi('');
                      }}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      रद्द करा (Cancel)
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingCategories}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {savingCategories ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingCatId ? 'अपडेट करा (Update)' : 'जोडा (Add)'}
                  </button>
                </div>
              </form>

              {/* Categories list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>विद्यमान श्रेणी यादी (Current Categories)</span>
                  <span className="text-[10px] text-slate-400 lowercase font-medium">{categories.length} categories</span>
                </h4>
                
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0 flex-1 grid grid-cols-3 gap-2 pr-4">
                        <div className="truncate text-xs font-semibold text-slate-700" title="English">
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">English</span>
                          {cat.name}
                        </div>
                        <div className="truncate text-xs font-semibold text-orange-600" title="Marathi">
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">मराठी</span>
                          {cat.labelMr}
                        </div>
                        <div className="truncate text-xs font-semibold text-slate-500" title="Hindi">
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">हिंदी</span>
                          {cat.labelHi}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditCategoryStart(cat)}
                          className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-lg transition-colors cursor-pointer"
                          title="संपादित करा (Edit)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="काढून टाका (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setIsCategoriesModalOpen(false);
                  setEditingCatId(null);
                  setNewCatName('');
                  setNewCatLabelMr('');
                  setNewCatLabelHi('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                पूर्ण झाले (Done)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Menu Importer Modal */}
      {isAiImporterOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[85vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse text-yellow-200" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">AI मेनू आयात सहाय्यक (AI Menu Importer)</h3>
                  <p className="text-[10px] text-orange-50/90 font-medium">Upload a printed menu PDF or photo to instantly generate your entire online menu!</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (parsedItems.length > 0 && !confirm("Discard current extraction results?")) return;
                  setIsAiImporterOpen(false);
                  setParsedItems([]);
                  setParsedCategories([]);
                  setAiError(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* No File Uploaded & Not Parsing State */}
              {!isParsing && parsedItems.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full max-h-[60vh] py-4 space-y-4">
                  {/* Tab switchers */}
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-lg mx-auto border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveImportTab('upload')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeImportTab === 'upload' 
                          ? 'bg-white text-orange-600 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      📁 अपलोड (Upload)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImportTab('paste')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeImportTab === 'paste' 
                          ? 'bg-white text-orange-600 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ✍️ कॉपी-पेस्ट (Paste)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImportTab('search')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeImportTab === 'search' 
                          ? 'bg-white text-orange-600 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🔍 AI वेब शोध (Web Search)
                    </button>
                  </div>

                  {activeImportTab === 'upload' && (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`w-full max-w-2xl p-10 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                        dragActive 
                          ? 'border-orange-500 bg-orange-50/40 scale-[1.01]' 
                          : 'border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                      onClick={() => document.getElementById('ai-file-upload')?.click()}
                    >
                      <input 
                        id="ai-file-upload"
                        type="file" 
                        className="hidden" 
                        accept="application/pdf,image/*"
                        onChange={handleFileInputChange}
                      />
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 shadow-inner">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-700">
                        तुमचा मेनू PDF किंवा फोटो येथे आणा (Upload printed menu PDF or Image)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                        Drag & drop your file here, or click to browse. Supports PDF documents or pictures of your menu card (PNG, JPG, WEBP).
                      </p>
                      <div className="flex items-center gap-4 mt-6 text-[10px] text-slate-500 font-bold bg-white px-4 py-2 rounded-xl border border-slate-100">
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-red-500" /> PDF Files</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5 text-blue-500" /> Menu Photos</span>
                      </div>
                    </div>
                  )}

                  {activeImportTab === 'paste' && (
                    <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          ✍️ मेनू यादी आणि किंमती येथे टाका (Paste Menu List)
                        </h4>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">AI parsing</span>
                      </div>
                      
                      <textarea
                        rows={6}
                        value={rawPasteText}
                        onChange={(e) => setRawPasteText(e.target.value)}
                        placeholder="उदा. (Example):&#10;शेवभाजी - ₹१२०&#10;कढई पनीर - 180 rs&#10;मटका कुल्फी - ४० रुपये&#10;Dal Tadka - 140&#10;Butter Naan - 40"
                        className="w-full p-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />

                      <button
                        type="button"
                        onClick={handleRawTextParse}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black shadow-md hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                        AI मेनू विश्लेषण सुरू करा (Analyze & Auto-generate Images)
                      </button>
                    </div>
                  )}

                  {activeImportTab === 'search' && (
                    <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          🔍 वेबवरून रेस्टॉरंट मेनू शोधा (Search & Extract Menu)
                        </h4>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Gemini Web Grounding</span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Enter any restaurant name, food joint, or hotel with its location (e.g., <span className="font-bold">"Tara Hotel Uruli Kanchan"</span>, <span className="font-bold">"Suvarnarekha Dining Hall Pune"</span>, or <span className="font-bold">"Chulha Mutton Pune"</span>). Gemini will scan the live web using Google Search, fetch their authentic menu dishes, prices, and categories, and design a pristine custom menu draft for you with beautiful images!
                      </p>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleWebSearchParse();
                            }
                          }}
                          placeholder="उदा. (Example): Tara Hotel Pune Solapur Highway or Shree Krishna Udupi Mumbai..."
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-inner"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>

                      <button
                        type="button"
                        onClick={handleWebSearchParse}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black shadow-md hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-amber-200 animate-pulse" />
                        वेबवर शोधा आणि मेनू तयार करा (Search Web & Draft Menu)
                      </button>
                    </div>
                  )}

                  {aiError && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 max-w-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {aiError}
                    </div>
                  )}

                  {/* Guide Info */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl text-center">
                    <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/40">
                      <div className="text-xs font-black text-amber-700 mb-1">1. निवडा किंवा टाका (Upload or Paste)</div>
                      <p className="text-[10px] text-slate-500 leading-normal">Upload your existing menu card photo OR simply copy-paste food names and prices.</p>
                    </div>
                    <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/40">
                      <div className="text-xs font-black text-orange-700 mb-1">2. AI विश्लेषण (AI Parse)</div>
                      <p className="text-[10px] text-slate-500 leading-normal">Gemini AI parses item names and prices with 100% accuracy and maps appetizing photos.</p>
                    </div>
                    <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/40">
                      <div className="text-xs font-black text-emerald-700 mb-1">3. आयात करा (Verify & Import)</div>
                      <p className="text-[10px] text-slate-500 leading-normal">Review extracted dishes, customize description or category, and add them to menu in bulk!</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parsing Loading State */}
              {isParsing && (
                <div className="flex flex-col items-center justify-center h-full py-16 space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                    <Sparkles className="w-8 h-8 text-orange-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">Gemini AI तुमचा मेनू वाचत आहे...</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Analyzing prices, recognizing food categories, and drafting description translations. This takes around 5-10 seconds.
                    </p>
                  </div>
                  <div className="w-full max-w-xs bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full w-[80%] animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Parsed Items List / Table */}
              {!isParsing && parsedItems.length > 0 && (
                <div className="space-y-4">
                  {/* Summary Header */}
                  <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-orange-700 uppercase tracking-wider block mb-0.5">यशस्वी विश्लेषण! (EXTRACTION SUCCESSFUL)</span>
                      <h4 className="font-bold text-sm text-slate-800">
                        We extracted <span className="text-orange-600">{parsedItems.length} items</span> and <span className="text-orange-600">{parsedCategories.length} categories</span>.
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setParsedItems(prev => prev.map(item => ({ ...item, selected: true })));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => {
                          setParsedItems(prev => prev.map(item => ({ ...item, selected: false })));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Select None
                      </button>
                    </div>
                  </div>

                  {/* Detected Categories Alert */}
                  {parsedCategories.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        नवीन श्रेण्या जोडल्या जातील (Categories to be added):
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {parsedCategories.map(cat => {
                          const alreadyExists = categories.some(c => c.id === cat.id);
                          return (
                            <span 
                              key={cat.id} 
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                                alreadyExists 
                                  ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                  : 'bg-orange-50 text-orange-700 border-orange-200/50 font-black'
                              }`}
                            >
                              <Tag className="w-3 h-3 text-orange-500" />
                              {cat.name} ({cat.labelMr})
                              {!alreadyExists && <span className="text-[8px] bg-orange-600 text-white font-black px-1 rounded-sm uppercase tracking-tight ml-0.5">New</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">पदार्थ आणि किंमत यादी (Dishes & Prices Review)</h5>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {parsedItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${
                            item.selected ? 'bg-white' : 'bg-slate-50/50 opacity-60'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <div className="flex items-center h-full shrink-0">
                            <input 
                              type="checkbox" 
                              checked={item.selected}
                              onChange={(e) => handleUpdateParsedItem(idx, 'selected', e.target.checked)}
                              className="w-4 h-4 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </div>

                          {/* Image Selector trigger */}
                          <div className="relative group shrink-0">
                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative">
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt="item thumbnail" />
                              <button
                                onClick={() => setActiveImagePickerIndex(activeImagePickerIndex === idx ? null : idx)}
                                className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-[10px] font-black transition-opacity cursor-pointer"
                                title="Choose another image for this dish"
                              >
                                Edit Image
                              </button>
                            </div>

                            {/* Custom Visual Image Preset Picker Popup */}
                            {activeImagePickerIndex === idx && (
                              <div className="absolute top-14 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 grid grid-cols-3 gap-2">
                                <div className="col-span-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                                  <span>Choose Stock Image</span>
                                  <button onClick={() => setActiveImagePickerIndex(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {IMAGE_PRESETS.map((preset) => (
                                  <button
                                    key={preset.url}
                                    type="button"
                                    onClick={() => {
                                      handleUpdateParsedItem(idx, 'imageUrl', preset.url);
                                      setActiveImagePickerIndex(null);
                                    }}
                                    className={`relative aspect-square rounded-lg overflow-hidden border hover:border-orange-500 transition-all cursor-pointer ${
                                      item.imageUrl === preset.url ? 'border-2 border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-100'
                                    }`}
                                    title={preset.name}
                                  >
                                    <img src={preset.url} className="w-full h-full object-cover" alt={preset.name} />
                                    <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-opacity" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Details Edit form */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 w-full">
                            <div className="col-span-1 sm:col-span-2">
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">खाद्यपदार्थाचे नाव (Dish Name)</label>
                              <input 
                                type="text"
                                required
                                value={item.name}
                                onChange={(e) => handleUpdateParsedItem(idx, 'name', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">किंमत (Price ₹)</label>
                              <input 
                                type="number"
                                required
                                min="0"
                                value={item.price}
                                onChange={(e) => handleUpdateParsedItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-black text-orange-600 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">श्रेणी (Category)</label>
                              <select 
                                value={item.category}
                                onChange={(e) => handleUpdateParsedItem(idx, 'category', e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 bg-white"
                              >
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.labelMr})</option>
                                ))}
                                {parsedCategories.map(cat => (
                                  !categories.some(c => c.id === cat.id) && (
                                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.labelMr}) [New]</option>
                                  )
                                ))}
                              </select>
                            </div>
                            <div className="col-span-1 sm:col-span-4">
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">वर्णन (Description)</label>
                              <textarea 
                                rows={1}
                                value={item.description}
                                onChange={(e) => handleUpdateParsedItem(idx, 'description', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-500 bg-white resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {parsedItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to discard these items and start over?")) {
                      setParsedItems([]);
                      setParsedCategories([]);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Clear & Start Over
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAiImporterOpen(false);
                    setParsedItems([]);
                    setParsedCategories([]);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  रद्द करा (Cancel)
                </button>
                {parsedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportParsedMenu}
                    disabled={importing || isParsing}
                    className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    मेनू मध्ये जोडा (Import {parsedItems.filter(i => i.selected).length} Items)
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Menu Grid */}
      {fetching && items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <span className="text-sm text-slate-500">Loading Menu Items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Your Menu is Empty</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Food Item" or use "Seed Sample Dishes" to launch instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
              key={item.id}
              className="border border-slate-100 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-full"
            >
              {/* Dish Image Frame */}
              <div className="aspect-video w-full bg-slate-100 relative overflow-hidden group">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <span className={`absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
                  item.category === 'Starters' ? 'bg-amber-500' :
                  item.category === 'Veg Soup' ? 'bg-emerald-600' :
                  item.category === 'Punjabi Dish' ? 'bg-orange-600' :
                  item.category === 'Gavran Tadka' ? 'bg-red-600' :
                  item.category === 'Dal Special' ? 'bg-yellow-600' :
                  item.category === 'Rice / Extras' ? 'bg-cyan-600' :
                  item.category === 'Thali Special' ? 'bg-rose-600' :
                  item.category === 'Drinks' ? 'bg-sky-500' : 'bg-purple-500'
                }`}>
                  {categories.find(c => c.id === item.category)?.labelMr || item.category}
                </span>

                <button
                  onClick={() => toggleAvailability(item)}
                  className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-xs transition-all ${
                    item.inStock ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                  title="Click to toggle availability"
                >
                  {item.inStock ? 'Available' : 'Out of Stock'}
                </button>
              </div>

              {/* Item Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                    <span className="text-sm font-black text-orange-600 shrink-0">₹{item.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.description || 'No description provided.'}</p>
                </div>

                {/* CRUD Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-bold rounded-lg border border-slate-100 hover:border-orange-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {deleteConfirmId === item.id ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Confirm Delete"
                      >
                        Sure?
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="py-1.5 px-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-bold rounded-lg border border-slate-100 hover:border-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
