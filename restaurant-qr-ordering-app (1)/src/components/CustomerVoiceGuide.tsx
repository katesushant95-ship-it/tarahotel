import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Utensils, 
  HelpCircle, 
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerVoiceGuideProps {
  restaurantName?: string;
  tableNumber: string;
  darkMode?: boolean;
}

export interface VoiceGuideItem {
  id: string;
  title: string;
  shortLabel: string;
  icon: string;
  speechText: string;
  summary: string;
}

export const VOICE_GUIDE_DATA: VoiceGuideItem[] = [
  {
    id: 'welcome_and_order',
    title: 'हॉटेल तारा स्वागत आणि ऑर्डर कशी करावी',
    shortLabel: '🌟 स्वागत व संपूर्ण माहिती',
    icon: '🙏',
    speechText: 
      'हॉटेल तारा मध्ये आपले सहर्ष स्वागत आहे! ही आमची अधिकृत डिजिटल मेनू वेबसाईट आहे. आता तुम्हाला वेटरची वाट पाहण्याची अजिबात गरज नाही. तुम्ही थेट तुमच्या मोबाईलवरून आमचे सर्व स्वादिष्ट पदार्थ पाहू शकता आणि आपल्या टेबलवरूनच ऑर्डर नोंदवू शकता. ऑर्डर कशी करावी ते समजून घ्या: पहिली पायरी, खाली दिलेल्या मेनूमध्ये आपले आवडते पदार्थ शोधा. दुसरी पायरी, पदार्थासमोरील अधिक म्हणजेच प्लस बटनावर क्लिक करून तो पदार्थ कार्टमध्ये जोडा. तिसरी पायरी, खाली दिसणाऱ्या हिरव्या रंगाच्या ऑर्डर द्या बटनावर क्लिक करा आणि आपली ऑर्डर कन्फर्म करा. तुमची ऑर्डर थेट आमच्या किचनमध्ये पोहोचेल आणि गरमागरम ताजे जेवण थोड्याच वेळात तुमच्या टेबलवर हजर होईल. काही अडचण असल्यास वेटरला बोलवा. धन्यवाद आणि शुभ भोजन!',
    summary: 'हॉटेल ताराचे डिजिटल मेनू कार्ड आणि थेट टेबलवरून सोप्या ३ पायऱ्यांमध्ये ऑर्डर करण्याची माहिती.'
  },
  {
    id: 'how_to_order',
    title: 'ऑर्डर कशी करावी? (How to Order)',
    shortLabel: '📋 ऑर्डर कशी करावी? (३ पायऱ्या)',
    icon: '➕',
    speechText: 
      'ऑर्डर कशी करावी ते ऐका: पायरी एक, खाली मेनूमध्ये आपले आवडते पदार्थ शोधा. पायरी दोन, पदार्थासमोरील अधिक म्हणजेच प्लस बटनावर क्लिक करून तो कार्टमध्ये जोडा. पायरी तीन, खाली दिलेल्या हिरव्या रंगाच्या ऑर्डर द्या बटनावर क्लिक करा. ऑर्डर थेट किचनमध्ये पाठवली जाईल. धन्यवाद!',
    summary: '१. मेनू पहा ➔ २. (+) बटनावर क्लिक करा ➔ ३. खालील हिरवे "ऑर्डर द्या" बटन दाबा.'
  },
  {
    id: 'what_is_this',
    title: 'ही वेबसाईट काय आहे? (What is this website?)',
    shortLabel: '📱 वेबसाईट काय आहे?',
    icon: 'ℹ️',
    speechText: 
      'ही हॉटेल ताराची स्मार्ट डिजिटल मेनू वेबसाईट आहे. या वेबसाईटद्वारे आपण हॉटेलमधील सर्व शाकाहारी, गावरान आणि पंजाबी पदार्थांचे ताजे दर, फोटो आणि विशेष मेनू पाहू शकता. तसेच टेबलवरूनच थेट किचनमध्ये ऑर्डर देऊन आपल्या जेवणाची ऑर्डर लाईव्ह ट्रॅक करू शकता.',
    summary: 'हॉटेल ताराचा आधुनिक संपर्करहित (Contactless) डिजिटल क्यूआर मेनू.'
  },
  {
    id: 'famous_dishes',
    title: 'हॉटेल ताराचे प्रसिद्ध पदार्थ (Famous Dishes)',
    shortLabel: '🍲 प्रसिद्ध पदार्थ',
    icon: '🔥',
    speechText: 
      'हॉटेल तारा मध्ये आमची खास खानदेशी झणझणीत शेवभाजी, स्पेशल कढई पनीर, अस्सल खमंग डाळ तडका जिरा राईस, आणि मातीच्या मटक्यातील थंडगार कुल्फी हे सर्वात जास्त लोकप्रिय पदार्थ आहेत. नक्की आस्वाद घ्या!',
    summary: 'झणझणीत शेवभाजी, स्पेशल कढई पनीर, डाळ तडका आणि मटका कुल्फी.'
  }
];

export default function CustomerVoiceGuide({
  restaurantName = 'हॉटेल तारा',
  tableNumber,
  darkMode = false,
}: CustomerVoiceGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeItem, setActiveItem] = useState<VoiceGuideItem>(VOICE_GUIDE_DATA[0]);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    // Show modal on first arrival in session
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('tara_voice_modal_closed');
    }
    return true;
  });
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Soft hospitality chime before voice begins
  const playEntranceChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Note 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: B5 (987.77Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } catch (e) {
      // AudioContext safe fallback
    }
  };

  // Fallback speech synthesis if audio file stream is blocked or API quota is exceeded
  const fallbackSpeechSynthesis = (item: VoiceGuideItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.speechText);
      const voices = window.speechSynthesis.getVoices();
      const marathi = voices.find(v => v.lang.toLowerCase().startsWith('mr'));
      const hindi = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.lang.toLowerCase().includes('in'));
      
      if (marathi) {
        utterance.voice = marathi;
        utterance.lang = marathi.lang;
      } else if (hindi) {
        utterance.voice = hindi;
        utterance.lang = hindi.lang;
      } else {
        utterance.lang = 'mr-IN';
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsLoading(false);
        setAudioProgress(0);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      console.warn('Browser speech synthesis error:', err);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  // Core Play Audio Function using Server-side Gemini TTS (with 100% device compatibility)
  const playVoiceGuide = async (item: VoiceGuideItem) => {
    // 1. Stop any currently active audio
    stopVoiceGuide();

    setActiveItem(item);
    setIsLoading(true);
    playEntranceChime();

    try {
      // Initialize HTML5 Audio instance
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;

      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };

      audio.onerror = (e) => {
        console.warn('HTML5 audio error, falling back to Web Speech Synthesis:', e);
        fallbackSpeechSynthesis(item);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      // Request authentic Marathi TTS audio from server
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          text: item.speechText,
          voice: 'Kore'
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const audioBlob = await response.blob();
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      const audioUrl = URL.createObjectURL(audioBlob);
      audioBlobUrlRef.current = audioUrl;

      audio.src = audioUrl;
      await audio.play();

      setIsLoading(false);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Failed to load server audio, using client synthesis fallback:', err);
      fallbackSpeechSynthesis(item);
    }
  };

  const stopVoiceGuide = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
    setAudioProgress(0);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.src && audioRef.current.currentTime > 0) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        playVoiceGuide(activeItem);
      }
    }
  };

  const handleModalPlay = (item: VoiceGuideItem = VOICE_GUIDE_DATA[0]) => {
    setShowWelcomeModal(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tara_voice_modal_closed', 'true');
    }
    playVoiceGuide(item);
  };

  const handleModalClose = () => {
    setShowWelcomeModal(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tara_voice_modal_closed', 'true');
    }
  };

  return (
    <>
      {/* 1. WELCOME POPUP MODAL (Clean, Informative, with Audio CTA) */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div 
            id="welcome-voice-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-amber-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col"
            >
              {/* Header Gradient */}
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-300/20 rounded-full blur-lg" />
                
                <button
                  id="close-welcome-modal"
                  onClick={handleModalClose}
                  className="absolute top-3 right-3 p-2 text-white/80 hover:text-white bg-black/15 hover:bg-black/25 rounded-full transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-3xl flex items-center justify-center mx-auto shadow-inner shadow-black/10">
                  🙏
                </div>

                <div className="mt-3">
                  <span className="inline-block bg-white/25 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase">
                    टेबल क्रमांक #{tableNumber || '1'}
                  </span>
                  <h2 className="text-xl font-black mt-1 tracking-tight">
                    {restaurantName} मध्ये आपले स्वागत!
                  </h2>
                  <p className="text-xs text-amber-100 mt-0.5 font-medium">
                    डिजिटल मेनू आणि ऑर्डर गाईड
                  </p>
                </div>
              </div>

              {/* Explanatory Cards */}
              <div className="p-5 space-y-3">
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                      ही वेबसाईट काय आहे?
                    </h4>
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-relaxed font-medium">
                      हॉटेल ताराचा अधिकृत डिजिटल मेनू! वेटरची वाट न पाहता मोबाईलवरून सर्व पदार्थ, फोटो आणि दर पहा.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                      ऑर्डर कशी करावी?
                    </h4>
                    <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed font-medium">
                      आवडीच्या पदार्थासमोरील <strong>(+)</strong> वर क्लिक करून कार्टमध्ये टाका, आणि खालील <strong>'ऑर्डर द्या'</strong> वर क्लिक करा!
                    </p>
                  </div>
                </div>

                {/* Primary Voice Action Button */}
                <div className="pt-2 space-y-2">
                  <button
                    id="play-welcome-voice-btn"
                    onClick={() => handleModalPlay(VOICE_GUIDE_DATA[0])}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 transition-all cursor-pointer transform active:scale-98"
                  >
                    <Volume2 className="w-5 h-5 animate-pulse shrink-0" />
                    <span>🔊 मराठीत आवाज ऐका (Play Voice Guide)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="how-to-order-modal-btn"
                      onClick={() => handleModalPlay(VOICE_GUIDE_DATA[1])}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      📋 ऑर्डर कशी करावी?
                    </button>
                    <button
                      id="dismiss-welcome-modal-btn"
                      onClick={handleModalClose}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      🍽️ मेनू पहा (Browse)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. IN-MENU VOICE GUIDE CARD (Always Visible at Top of Customer Menu) */}
      <div 
        id="marathi-voice-assistant-card"
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-amber-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 relative overflow-hidden"
      >
        {/* Top Title & Main Audio Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                isPlaying 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
                ) : (
                  <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
                )}
              </div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  तारा ऑडिओ सहाय्यक
                </h3>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                  मराठी
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isLoading 
                  ? 'आवाज तयार होत आहे...' 
                  : isPlaying 
                    ? 'आवाज सुरू आहे... (Playing)' 
                    : 'स्वागत व ऑर्डर कशी करावी ते ऐका'}
              </p>
            </div>
          </div>

          {/* Audio Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isPlaying ? (
              <button
                id="stop-voice-btn"
                onClick={stopVoiceGuide}
                className="py-2 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>थांबवा</span>
              </button>
            ) : (
              <button
                id="play-main-voice-btn"
                disabled={isLoading}
                onClick={() => playVoiceGuide(activeItem)}
                className="py-2 px-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>लोड होत आहे...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>आवाज ऐका (Play)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Subtitle / Speech Display with Waveform & Progress Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-3 rounded-2xl relative overflow-hidden">
          {isPlaying && (
            <div 
              className="absolute top-0 left-0 bottom-0 bg-amber-500/10 transition-all duration-300 pointer-events-none"
              style={{ width: `${audioProgress}%` }}
            />
          )}

          <div className="flex items-center justify-between gap-2 mb-1 relative z-10">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {activeItem.title}
            </span>

            {isPlaying && (
              <div className="flex items-end gap-1 h-3 shrink-0">
                <div className="w-1 bg-amber-500 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite] h-2"></div>
                <div className="w-1 bg-orange-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite] h-3"></div>
                <div className="w-1 bg-amber-500 rounded-full animate-[soundwave_0.7s_ease-in-out_infinite] h-1.5"></div>
                <div className="w-1 bg-orange-500 rounded-full animate-[soundwave_0.9s_ease-in-out_infinite] h-2.5"></div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed relative z-10">
            "{isPlaying ? activeItem.speechText : activeItem.summary}"
          </p>
        </div>

        {/* 3 Step Visual Guide - How to Order */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-2 text-center">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black inline-flex items-center justify-center mb-1">
              १
            </span>
            <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">पदार्थ निवडा</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400">मेनू पहा</p>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-2 text-center">
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black inline-flex items-center justify-center mb-1">
              २
            </span>
            <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">(+) बटन दाबा</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400">कार्टमध्ये जोडा</p>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-2 text-center">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black inline-flex items-center justify-center mb-1">
              ३
            </span>
            <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">ऑर्डर द्या</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400">थेट किचनमध्ये</p>
          </div>
        </div>

        {/* Quick Voiceover Topic Selector Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              विषय निवडून आवाज ऐका:
            </span>
            <button
              id="reopen-welcome-modal-btn"
              onClick={() => setShowWelcomeModal(true)}
              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>माहिती कार्ड</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {VOICE_GUIDE_DATA.map((item) => {
              const isActive = activeItem.id === item.id;
              return (
                <button
                  key={item.id}
                  id={`voice-topic-${item.id}`}
                  onClick={() => playVoiceGuide(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isActive && isPlaying
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30 font-black'
                      : isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.shortLabel}</span>
                  {isActive && isPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. STICKY FLOATING MINI-PLAYER (Visible when voice is playing while scrolling) */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          id="floating-voice-player"
          className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto"
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    तारा ऑडिओ सुरू आहे
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-xs font-bold truncate text-slate-200">
                  {activeItem.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="floating-toggle-voice-btn"
                onClick={togglePlayPause}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                title="Pause / Resume"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
              <button
                id="floating-stop-voice-btn"
                onClick={stopVoiceGuide}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>थांबवा</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
