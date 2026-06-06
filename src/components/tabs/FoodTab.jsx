/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { 
  Apple, HeartPulse, ClipboardList, Flame, Clock, Users, Plus, Minus, 
  ArrowDownRight, ArrowUpRight, Scale, Check, Smile, Award, Activity, 
  Droplet, Sparkles, BookOpen, ChevronRight, X, AlertCircle, ShoppingBag, Eye 
} from 'lucide-react';

const MEALS_POOL = [
  {
    id: 'breakfast_chechebsa',
    name: "Traditional Chechebsa (Spiced Flatbread)",
    type: 'breakfast',
    time: "8:00 AM - 10:00 AM",
    calories: "360 kcal",
    macros: { carbs: "52g", protein: "10g", fat: "12g" },
    microsTags: ["Iron (Fe)", "Zinc (Zn)", "Vitamin B6", "Folate"],
    description: "Shredded wheat flatbread tossed gently with warm spiced clarified butter (niter kibbeh) and berbere spice, drizzled with pure organic honey.",
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 'breakfast_oatmeal',
    name: "Oatmeal with Flaxseed & Bananas",
    type: 'breakfast',
    time: "8:00 AM - 10:00 AM",
    calories: "310 kcal",
    macros: { carbs: "48g", protein: "9g", fat: "8g" },
    microsTags: ["Magnesium", "Vitamin B6", "Potassium", "Omega-3"],
    description: "Warm rolled oats simmered with flaxseed for omega-3s, topped with fresh banana slices and organic honey.",
    img: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 'lunch_shiro',
    name: "Teff Injera with Shiro Wot & Gomen",
    type: 'lunch',
    time: "12:00 AM - 2:00 PM",
    calories: "420 kcal",
    macros: { carbs: "65g", protein: "15g", fat: "12g" },
    microsTags: ["Iron (Fe)", "Zinc (Zn)", "Vitamin A", "Calcium"],
    description: "Traditional iron-rich teff injera paired with spiced chickpea flour stew and steamed collard greens.",
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 'lunch_kik',
    name: "Yellow Split Pea Stew (Kik Alicha) & Injera",
    type: 'lunch',
    time: "12:00 AM - 2:00 PM",
    calories: "390 kcal",
    macros: { carbs: "58g", protein: "14g", fat: "8g" },
    microsTags: ["Folate", "Fiber", "Potassium", "Iron (Fe)"],
    description: "Mild, turmeric-infused yellow split pea stew simmered with onions, garlic, and ginger, served with soft teff injera.",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 'afternoon_snack',
    name: "Afternoon Coffee & Roasted Barley (Kolo)",
    type: 'afternoon_snack',
    time: "4:00 PM - 6:00 PM",
    calories: "180 kcal",
    macros: { carbs: "28g", protein: "4g", fat: "6g" },
    microsTags: ["Copper", "Fiber", "Manganese"],
    description: "Traditional late-afternoon roasted barley and peanut snack served with spiced herbal tea or Buna.",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 'dinner_misir',
    name: "Spiced Red Lentil Stew (Misir Wot)",
    type: 'dinner',
    time: "7:00 PM - 9:00 PM",
    calories: "380 kcal",
    macros: { carbs: "55g", protein: "18g", fat: "9g" },
    microsTags: ["Folate", "Iron (Fe)", "Vitamin C", "Zinc"],
    description: "A protein-rich red lentil stew simmered with anti-inflammatory berbere spices, served with fresh tomato salad.",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 'dinner_gomen',
    name: "Collard Greens (Gomen) & Beetroot Salad",
    type: 'dinner',
    time: "7:00 PM - 9:00 PM",
    calories: "320 kcal",
    macros: { carbs: "42g", protein: "8g", fat: "10g" },
    microsTags: ["Vitamin C", "Vitamin A", "Calcium", "Potassium"],
    description: "Slow-simmered collard greens with garlic and ginger, paired with a vibrant beetroot side salad.",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200"
  }
];

const calculateMealStatus = (id) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinutes;

  const ranges = {
    breakfast_chechebsa: { start: 8 * 60, end: 10 * 60 },
    breakfast_oatmeal: { start: 8 * 60, end: 10 * 60 },
    lunch_shiro: { start: 12 * 60, end: 14 * 60 }, // 12:00 PM to 2:00 PM
    lunch_kik: { start: 12 * 60, end: 14 * 60 },
    afternoon_snack: { start: 16 * 60, end: 18 * 60 }, // 4:00 PM to 6:00 PM
    dinner_misir: { start: 19 * 60, end: 21 * 60 }, // 7:00 PM to 9:00 PM
    dinner_gomen: { start: 19 * 60, end: 21 * 60 }
  };

  const range = ranges[id];
  if (!range) return 'upcoming';

  if (currentTotalMinutes >= range.start && currentTotalMinutes <= range.end) {
    return 'active';
  } else if (currentTotalMinutes > range.end) {
    return 'passed';
  } else {
    return 'upcoming';
  }
};

export default function FoodTab({ masterReport, isLightMode, appLanguage, setHasUncheckedActiveMeal, startDiagnosticSession }) {
  const hasReport = masterReport?.messages?.some(
    (m) => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:'))
  );

  if (!hasReport) {
    return (
      <div className="sample-page" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '48px 32px', 
        textAlign: 'center', 
        height: '100%',
        minHeight: '400px'
      }}>
        <div style={{
          background: 'var(--surface)',
          border: `1px dashed ${isLightMode ? 'rgba(82, 121, 111, 0.3)' : 'rgba(107, 144, 128, 0.25)'}`,
          borderRadius: '24px',
          padding: '56px 40px',
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '56px', filter: 'drop-shadow(0 8px 16px rgba(107, 144, 128, 0.25))' }}>🍏</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
              {appLanguage === 'English' ? 'First, start a session with Divya' : 'በመጀመሪያ ከዲቭያ ጋር ውይይት ይጀምሩ'}
            </h3>
            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {appLanguage === 'English' 
                ? 'When your consultation session finishes, Divya AI will automatically generate your personalized daily food and nutrition guidelines.' 
                : 'የምክር ክፍለ ጊዜዎ ሲጠናቀቅ፣ ዲቭያ AI በህክምና ግምገማዎ ላይ በመመስረት ግላዊ የዕለት ተዕለት የምግብ እና የአመጋገብ መመሪያዎችዎን በራስ-ሰር ያመነጫል።'}
            </p>
          </div>
          <button
            onClick={startDiagnosticSession}
            className="read-report-btn"
            style={{ 
              width: 'auto', 
              padding: '12px 28px', 
              textTransform: 'none', 
              fontSize: '14px', 
              fontWeight: '700',
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(107, 144, 128, 0.2)'
            }}
          >
            <Stethoscope size={18} />
            <span>{appLanguage === 'English' ? 'Start a Session with Divya' : 'ከዲቭያ ጋር ውይይት ጀምር'}</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Day's Streak State ---
  const [streakDays, setStreakDays] = useState(() => {
    const saved = localStorage.getItem('food_tab_saved_streak');
    return saved ? parseInt(saved, 10) : 7;
  });

  // --- Dynamic Macros State ---
  const [macros, setMacros] = useState(() => {
    const saved = localStorage.getItem('food_tab_saved_macros');
    let loaded = null;
    if (saved) {
      try { loaded = JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const defaultMacros = {
      carbs: { current: 0, target: 250, label: appLanguage === 'English' ? 'Carbohydrates' : 'ካርቦሃይድሬት', bg: 'linear-gradient(135deg, rgba(212,163,115,0.12), rgba(212,163,115,0.04))', barColor: '#cfa375' },
      protein: { current: 0, target: 100, label: appLanguage === 'English' ? 'Protein' : 'ፕሮቲን', bg: 'linear-gradient(135deg, rgba(107,144,128,0.12), rgba(107,144,128,0.04))', barColor: '#5c7f70' },
      fat: { current: 0, target: 70, label: appLanguage === 'English' ? 'Dietary Fats' : 'ስብና ዘይቶች', bg: 'linear-gradient(135deg, rgba(229,152,155,0.12), rgba(229,152,155,0.04))', barColor: '#d68b8e' }
    };
    if (loaded) {
      return {
        carbs: { ...defaultMacros.carbs, current: loaded.carbs.current },
        protein: { ...defaultMacros.protein, current: loaded.protein.current },
        fat: { ...defaultMacros.fat, current: loaded.fat.current }
      };
    }
    return defaultMacros;
  });

  // --- Dynamic Micronutrients (Nutrients Suggested by AI) ---
  // Cap at 4 maximum, structured as Left and Right column mapping
  const [suggestedNutrients, setSuggestedNutrients] = useState(() => {
    const saved = localStorage.getItem('food_tab_saved_micros');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { 
        id: 'vitA', 
        name: 'Vitamin A', 
        current: 0, 
        target: 900, 
        unit: 'mcg', 
        desc: appLanguage === 'English' ? 'Crucial for immunity & mucous tissue recovery.' : 'ለበሽታ መከላከል እና ለቲሹዎች ማገገሚያ እጅግ አስፈላጊ።', 
        icon: '🥕', 
        barColor: '#d48c3c', // Warm muted bronze
        bg: 'linear-gradient(135deg, rgba(212,140,60,0.12), rgba(212,140,60,0.04))' 
      },
      { 
        id: 'vitC', 
        name: 'Vitamin C', 
        current: 0, 
        target: 90, 
        unit: 'mg', 
        desc: appLanguage === 'English' ? 'Antioxidant defense & structural collagen building.' : 'የሰውነት መከላከያን ለማጎልበት እና ኮላጅን ለመገንባት።', 
        icon: '🍊', 
        barColor: '#c85a28', // Warm muted rust-orange
        bg: 'linear-gradient(135deg, rgba(200,90,40,0.12), rgba(200,90,40,0.04))' 
      },
      { 
        id: 'iron', 
        name: 'Iron (Fe)', 
        current: 0, 
        target: 18, 
        unit: 'mg', 
        desc: appLanguage === 'English' ? 'Oxygenates cellular tissues for accelerated recovery.' : 'ለሴሎች ኦክስጅን በማቅረብ ፈጣን ማገገምን ያፋጥናል።', 
        icon: '🥩', 
        barColor: '#b43737', // Warm muted brick-red
        bg: 'linear-gradient(135deg, rgba(180,55,55,0.12), rgba(180,55,55,0.04))' 
      },
      { 
        id: 'magnesium', 
        name: 'Magnesium', 
        current: 0, 
        target: 400, 
        unit: 'mg', 
        desc: appLanguage === 'English' ? 'Supports muscle relaxation and lowers stress.' : 'ለጡንቻዎች መዝናናት እና ድካምን ለመቀነስ ይረዳል።', 
        icon: '🥜', 
        barColor: '#825ab4', // Warm muted slate-plum
        bg: 'linear-gradient(135deg, rgba(130,90,180,0.12), rgba(130,90,180,0.04))' 
      }
    ];
  });

  // --- Dynamic New Day 24h Rotation Sync ---
  const getRotatedMeals = () => {
    const breakfasts = MEALS_POOL.filter(m => m.type === 'breakfast');
    const lunches = MEALS_POOL.filter(m => m.type === 'lunch');
    const snacks = MEALS_POOL.filter(m => m.type === 'afternoon_snack');
    const dinners = MEALS_POOL.filter(m => m.type === 'dinner');

    const daySeed = new Date().getDate();

    const breakfast = breakfasts[daySeed % breakfasts.length];
    const lunch = lunches[(daySeed + 1) % lunches.length];
    const snack = snacks[0]; 
    const dinner = dinners[(daySeed + 2) % dinners.length];

    const localizeMeal = (meal) => {
      const nameMap = {
        breakfast_chechebsa: appLanguage === 'English' ? "Traditional Chechebsa (Spiced Flatbread)" : "ባህላዊ ጨጨብሳ",
        breakfast_oatmeal: appLanguage === 'English' ? "Oatmeal with Flaxseed & Bananas" : "አጃ (ኦትሚል) በተልባ እና በሙዝ",
        lunch_shiro: appLanguage === 'English' ? "Teff Injera with Shiro Wot & Gomen" : "የጤፍ እንጀራ በሺሮ ወጥ እና ጎመን",
        lunch_kik: appLanguage === 'English' ? "Yellow Split Pea Stew (Kik Alicha) & Injera" : "የአተር ክክ አልጫ ወጥ በእንጀራ",
        afternoon_snack: appLanguage === 'English' ? "Afternoon Coffee & Roasted Barley (Kolo)" : "የከሰዓት ቡናና ቆሎ",
        dinner_misir: appLanguage === 'English' ? "Spiced Red Lentil Stew (Misir Wot)" : "ቀይ ምስር ወጥ በአትክልት ሰላጣ",
        dinner_gomen: appLanguage === 'English' ? "Collard Greens (Gomen) & Beetroot Salad" : "የተቀቀለ ጎመንና የቀይ ስር ሰላጣ"
      };

      const descMap = {
        breakfast_chechebsa: appLanguage === 'English' ? "Shredded wheat flatbread tossed gently with warm spiced clarified butter and honey." : "ቀላል የፓን-ኬክ ቁርጥራጮች በቅመም ቅቤ እና በበርበሬ ተለውሰው፣ በማር የሚቀርብ ተወዳጅ የጠዋት ቁርስ።",
        breakfast_oatmeal: appLanguage === 'English' ? "Warm rolled oats simmered with flaxseed for omega-3s, topped with fresh banana slices." : "ለብ ያለ አጃ ከተልባ ጋር ተቀቅሎ ጤናማ ኦሜጋ-3 ለማግኘት፣ ትኩስ የሙዝ ቁርጥራጮች ያሉት።",
        lunch_shiro: appLanguage === 'English' ? "Traditional iron-rich teff injera paired with spiced chickpea flour stew and steamed collard greens." : "የጤፍ እንጀራ ከተለሰለሰ የሺሮ ወጥ እና ከተቀቀለ ጎመን ጋር የቀረበ።",
        lunch_kik: appLanguage === 'English' ? "Mild, turmeric-infused yellow split pea stew simmered with garlic and ginger, served with soft teff injera." : "ቀላል የክክ አልጫ ወጥ በኢንጀራ። ለሆድ እጅግ ምቹ እና ቀላል።",
        afternoon_snack: appLanguage === 'English' ? "Traditional late-afternoon roasted barley and peanut snack served with spiced herbal tea." : "ባህላዊ የከሰዓት ቆሎ ከቆንጆ ዝንጅብል ሻይ ወይም ቡና ጋር።",
        dinner_misir: appLanguage === 'English' ? "A protein-rich red lentil stew simmered with anti-inflammatory berbere spices, served with fresh tomato salad." : "ቀይ ምስር ወጥ ፀረ-ብግነት ቅመማ ቅመሞች የተጨመሩበት።",
        dinner_gomen: appLanguage === 'English' ? "Slow-simmered collard greens with garlic and ginger, paired with a vibrant beetroot side salad." : "ቀላል የተቀቀለ አረንጓዴ ጎመን ከቀይ ስር ሰላጣ ጋር ለምግብ መፈጨት እጅግ በጣም ጠቃሚ።"
      };

      const microsTagsMap = {
        breakfast_chechebsa: appLanguage === 'English' ? ["Iron (Fe)", "Zinc (Zn)", "Vitamin B6", "Folate"] : ["ብረት (Fe)", "ዚንክ (Zn)", "ቪታሚን B6", "ፎሌት"],
        breakfast_oatmeal: appLanguage === 'English' ? ["Magnesium", "Vitamin B6", "Potassium", "Omega-3"] : ["ማግኒዥየም", "ቪታሚን B6", "ፖታሺየም", "ኦሜጋ-3"],
        lunch_shiro: appLanguage === 'English' ? ["Iron (Fe)", "Zinc (Zn)", "Vitamin A", "Calcium"] : ["ብረት (Fe)", "ዚንክ (Zn)", "ቪታሚን A", "ካልሲየም"],
        lunch_kik: appLanguage === 'English' ? ["Folate", "Fiber", "Potassium", "Iron (Fe)"] : ["ፎሌት", "ፋይበር", "ፖታሺየም", "ብረት (Fe)"],
        afternoon_snack: appLanguage === 'English' ? ["Copper", "Fiber", "Manganese"] : ["ኮፐር", "ፋይበር", "ማንጋኒዝ"],
        dinner_misir: appLanguage === 'English' ? ["Folate", "Iron (Fe)", "Vitamin C", "Zinc"] : ["ፎሌት", "ብረት (Fe)", "ቪታሚን C", "ዚንክ"],
        dinner_gomen: appLanguage === 'English' ? ["Vitamin C", "Vitamin A", "Calcium", "Potassium"] : ["ቪታሚን C", "ቪታሚን A", "ካልሲየም", "ፖታሺየም"]
      };

      return {
        ...meal,
        name: nameMap[meal.id] || meal.name,
        description: descMap[meal.id] || meal.description,
        microsTags: microsTagsMap[meal.id] || meal.microsTags,
        status: calculateMealStatus(meal.id)
      };
    };

    return [
      { ...localizeMeal(breakfast), whatAteInstead: "" },
      { ...localizeMeal(lunch), checked: false },
      { ...localizeMeal(snack), checked: false },
      { ...localizeMeal(dinner), checked: false }
    ];
  };

  // --- Meal List for Today with Spacing & Status (Breakfast, Lunch, Dinner) ---
  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem('food_tab_saved_meals');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        return parsed.map(m => ({
          ...m,
          status: calculateMealStatus(m.id)
        }));
      } catch (e) { 
        console.error(e); 
      }
    }
    return getRotatedMeals();
  });

  useEffect(() => {
    const lastActiveDate = localStorage.getItem('food_tab_last_active_date');
    const todayStr = new Date().toDateString();

    if (lastActiveDate !== todayStr) {
      const freshMeals = getRotatedMeals();
      setMeals(freshMeals);
      localStorage.setItem('food_tab_saved_meals', JSON.stringify(freshMeals));

      const freshMacros = {
        carbs: { ...macros.carbs, current: 0 },
        protein: { ...macros.protein, current: 0 },
        fat: { ...macros.fat, current: 0 }
      };
      setMacros(freshMacros);
      localStorage.setItem('food_tab_saved_macros', JSON.stringify(freshMacros));

      setSuggestedNutrients(prev => prev.map(nut => ({ ...nut, current: 0 })));
      localStorage.setItem('food_tab_last_active_date', todayStr);
    }
  }, []);

  // --- Recommended Food & Vegetable (Right Panel) - Rotating Pool ---
  const getRotatingPlants = () => {
    const pool = [
      { name: appLanguage === 'English' ? 'Avocado' : 'አቮካዶ', desc: appLanguage === 'English' ? 'Rich in monounsaturated fats for healthy hormone production.' : 'ለጤናማ ሆርሞን ምርት ከፍተኛ ጠቀሜታ ያላቸው ቅባቶች የያዘ።', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=150&auto=format&fit=crop&q=80', icon: '🥑', recoveryTip: '+25% cell wall strength' },
      { name: appLanguage === 'English' ? 'Spinach (Gomen)' : 'ቆስጣ / ጎመን', desc: appLanguage === 'English' ? 'Packed with folate and non-heme iron to combat fatigue.' : 'ድካምን ለመዋጋት የሚረዳ የብረት ማዕድን የያዘ።', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=150&auto=format&fit=crop&q=80', icon: '🥬', recoveryTip: 'Tissue oxygenation boost' },
      { name: appLanguage === 'English' ? 'Papaya' : 'ፓፓያ', desc: appLanguage === 'English' ? 'Contains papain enzyme which reduces digestive inflammation.' : 'በሆድ ውስጥ የሚፈጠርን ብግነት የሚቀንስ ኢንዛይም የያዘ።', img: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=150&auto=format&fit=crop&q=80', icon: ' papaya', iconText: '🥭', recoveryTip: 'Gut repair accelerator' },
      { name: appLanguage === 'English' ? 'Lemon' : 'ሎሚ', desc: appLanguage === 'English' ? 'High Vitamin C content that acts as cofactor for collagen synthesis.' : 'የሰውነትን የብረት ማዕድን የመምጠጥ ብቃት የሚያሳድግ።', img: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=150&auto=format&fit=crop&q=80', icon: '🍋', recoveryTip: 'Bioavailability catalyst' },
      { name: appLanguage === 'English' ? 'Garlic' : 'ነጭ ሽንኩርት', desc: appLanguage === 'English' ? 'A traditional anti-microbial and immune booster that cleanses blood.' : 'በእምባ ላይ የተመሰረተ በሽታ የመከላከል አቅምን የሚያሳድግ ባህላዊ የተፈጥሮ አንቲባዮቲክ።', img: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=150&auto=format&fit=crop&q=80', icon: '🧄', recoveryTip: 'Immune Shield' },
      { name: appLanguage === 'English' ? 'Ginger' : 'ዝንጅብል', desc: appLanguage === 'English' ? 'Anti-inflammatory root that reduces muscle soreness and eases gut.' : 'የጡንቻ ህመምን የሚቀንስ እና የምግብ መፈጨትን የሚያሳልጥ ባህላዊ ስርወ-ፍሬ።', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=150&auto=format&fit=crop&q=80', icon: '🍠', recoveryTip: 'Soreness Reduction' }
    ];

    const currentDay = new Date().getDay(); // 0 to 6
    const rotatingList = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentDay + i * 2) % pool.length; // Rotating indexing gap
      rotatingList.push(pool[index]);
    }
    return rotatingList;
  };

  const [recommendedPlants, setRecommendedPlants] = useState(() => getRotatingPlants());

  useEffect(() => {
    // 1. Localize existing meals when language changes
    setMeals(prev => prev.map(meal => {
      const nameMap = {
        breakfast_chechebsa: appLanguage === 'English' ? "Traditional Chechebsa (Spiced Flatbread)" : "ባህላዊ ጨጨብሳ",
        breakfast_oatmeal: appLanguage === 'English' ? "Oatmeal with Flaxseed & Bananas" : "አጃ (ኦትሚል) በተልባ እና በሙዝ",
        lunch_shiro: appLanguage === 'English' ? "Teff Injera with Shiro Wot & Gomen" : "የጤፍ እንጀራ በሺሮ ወጥ እና ጎመን",
        lunch_kik: appLanguage === 'English' ? "Yellow Split Pea Stew (Kik Alicha) & Injera" : "የአተር ክክ አልጫ ወጥ በእንጀራ",
        afternoon_snack: appLanguage === 'English' ? "Afternoon Coffee & Roasted Barley (Kolo)" : "የከሰዓት ቡናና ቆሎ",
        dinner_misir: appLanguage === 'English' ? "Spiced Red Lentil Stew (Misir Wot)" : "ቀይ ምስር ወጥ በአትክልት ሰላጣ",
        dinner_gomen: appLanguage === 'English' ? "Collard Greens (Gomen) & Beetroot Salad" : "የተቀቀለ ጎመንና የቀይ ስር ሰላጣ"
      };

      const descMap = {
        breakfast_chechebsa: appLanguage === 'English' ? "Shredded wheat flatbread tossed gently with warm spiced clarified butter and honey." : "ቀላል የፓን-ኬክ ቁርጥራጮች በቅመም ቅቤ እና በበርበሬ ተለውሰው፣ በማር የሚቀርብ ተወዳጅ የጠዋት ቁርስ።",
        breakfast_oatmeal: appLanguage === 'English' ? "Warm rolled oats simmered with flaxseed for omega-3s, topped with fresh banana slices." : "ለብ ያለ አጃ ከተልባ ጋር ተቀቅሎ ጤናማ ኦሜጋ-3 ለማግኘት፣ ትኩስ የሙዝ ቁርጥራጮች ያሉት።",
        lunch_shiro: appLanguage === 'English' ? "Traditional iron-rich teff injera paired with spiced chickpea flour stew and steamed collard greens." : "የጤፍ እንጀራ ከተለሰለሰ የሺሮ ወጥ እና ከተቀቀለ ጎመን ጋር የቀረበ።",
        lunch_kik: appLanguage === 'English' ? "Mild, turmeric-infused yellow split pea stew simmered with garlic and ginger, served with soft teff injera." : "ቀይ ቀላል የክክ አልጫ ወጥ በኢንጀራ። ለሆድ እጅግ ምቹ እና ቀላል።",
        afternoon_snack: appLanguage === 'English' ? "Traditional late-afternoon roasted barley and peanut snack served with spiced herbal tea." : "ባህላዊ የከሰዓት ቆሎ ከቆንጆ ዝንጅብል ሻይ ወይም ቡና ጋር።",
        dinner_misir: appLanguage === 'English' ? "A protein-rich red lentil stew simmered with anti-inflammatory berbere spices, served with fresh tomato salad." : "ቀይ ምስር ወጥ ፀረ-ብግነት ቅመማ ቅመሞች የተጨመሩበት።",
        dinner_gomen: appLanguage === 'English' ? "Slow-simmered collard greens with garlic and ginger, paired with a vibrant beetroot side salad." : "ቀላል የተቀቀለ አረንጓዴ ጎመን ከቀይ ስር ሰላጣ ጋር ለምግብ መፈጨት እጅግ በጣም ጠቃሚ።"
      };

      const microsTagsMap = {
        breakfast_chechebsa: appLanguage === 'English' ? ["Iron (Fe)", "Zinc (Zn)", "Vitamin B6", "Folate"] : ["ብረት (Fe)", "ዚንክ (Zn)", "ቪታሚን B6", "ፎሌት"],
        breakfast_oatmeal: appLanguage === 'English' ? ["Magnesium", "Vitamin B6", "Potassium", "Omega-3"] : ["ማግኒዥየም", "ቪታሚን B6", "ፖታሺየም", "ኦሜጋ-3"],
        lunch_shiro: appLanguage === 'English' ? ["Iron (Fe)", "Zinc (Zn)", "Vitamin A", "Calcium"] : ["ብረት (Fe)", "ዚንክ (Zn)", "ቪታሚን A", "ካልሲየም"],
        lunch_kik: appLanguage === 'English' ? ["Folate", "Fiber", "Potassium", "Iron (Fe)"] : ["ፎሌት", "ፋይበር", "ፖታሺየም", "ብረት (Fe)"],
        afternoon_snack: appLanguage === 'English' ? ["Copper", "Fiber", "Manganese"] : ["ኮፐር", "ፋይበር", "ማንጋኒዝ"],
        dinner_misir: appLanguage === 'English' ? ["Folate", "Iron (Fe)", "Vitamin C", "Zinc"] : ["ፎሌት", "ብረት (Fe)", "ቪታሚን C", "ዚንክ"],
        dinner_gomen: appLanguage === 'English' ? ["Vitamin C", "Vitamin A", "Calcium", "Potassium"] : ["ቪታሚን C", "ቪታሚን A", "ካልሲየም", "ፖታሺየም"]
      };

      return {
        ...meal,
        name: nameMap[meal.id] || meal.name,
        description: descMap[meal.id] || meal.description,
        microsTags: microsTagsMap[meal.id] || meal.microsTags
      };
    }));

    // 2. Localize recommended plants
    setRecommendedPlants(getRotatingPlants());

    // 3. Localize macro labels
    setMacros(prev => ({
      carbs: { ...prev.carbs, label: appLanguage === 'English' ? 'Carbohydrates' : 'ካርቦሃይድሬት' },
      protein: { ...prev.protein, label: appLanguage === 'English' ? 'Protein' : 'ፕሮቲን' },
      fat: { ...prev.fat, label: appLanguage === 'English' ? 'Dietary Fats' : 'ስብና ዘይቶች' }
    }));

    // 4. Localize suggested nutrients descriptions
    setSuggestedNutrients(prev => prev.map(nut => {
      const descMap = {
        vitA: appLanguage === 'English' ? 'Crucial for immunity & mucous tissue recovery.' : 'ለበሽታ መከላከል እና ለቲሹዎች ማገገሚያ እጅግ አስፈላጊ።',
        vitC: appLanguage === 'English' ? 'Antioxidant defense & structural collagen building.' : 'የሰውነት መከላከያን ለማጎልበት እና ኮላጅን ለመገንባት።',
        iron: appLanguage === 'English' ? 'Oxygenates cellular tissues for accelerated recovery.' : 'ለሴሎች ኦክስጅን በማቅረብ ፈጣን ማገገምን ያፋጥናል።',
        magnesium: appLanguage === 'English' ? 'Supports muscle relaxation and lowers stress.' : 'ለጡንቻዎች መዝናናት እና ድካምን ለመቀነስ ይረዳል።'
      };
      return {
        ...nut,
        desc: descMap[nut.id] || nut.desc
      };
    }));
  }, [appLanguage]);

  // Selected Meal detail modal state
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Real-time clock state
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Update meal statuses and system clock tick in real-time
  useEffect(() => {
    const updateMealStatuses = () => {
      setSystemTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      setMeals(prev => {
        let changed = false;
        const nextMeals = prev.map(meal => {
          const currentRealStatus = calculateMealStatus(meal.id);
          if (meal.status !== currentRealStatus) {
            changed = true;
            return { ...meal, status: currentRealStatus };
          }
          return meal;
        });
        return changed ? nextMeals : prev;
      });
    };

    updateMealStatuses(); // Run instantly on mount!
    const ticker = setInterval(updateMealStatuses, 5000); // Recalculate every 5 seconds
    
    return () => clearInterval(ticker);
  }, []);

  const matchNutrientId = (tagName) => {
    const lower = tagName.toLowerCase();
    if (lower.includes('vitamin a') || lower.includes('vit a') || lower.includes('a') || lower.includes('ቪታሚን a')) return 'vitA';
    if (lower.includes('vitamin c') || lower.includes('vit c') || lower.includes('c') || lower.includes('ቪታሚን c')) return 'vitC';
    if (lower.includes('iron') || lower.includes('fe') || lower.includes('ብረት')) return 'iron';
    if (lower.includes('magnesium') || lower.includes('ማግኒዥየም')) return 'magnesium';
    return null;
  };

  // Handle Log Lunch checkbox
  const handleCheckMeal = (id) => {
    setMeals(prev => prev.map(meal => {
      if (meal.id === id) {
        const nextCheckedState = !meal.checked;
        const factor = nextCheckedState ? 1 : -1;
        
        // 1. Dynamically add/subtract macros when logged!
        adjustMacroValue('carbs', parseInt(meal.macros.carbs) * factor);
        adjustMacroValue('protein', parseInt(meal.macros.protein) * factor);
        adjustMacroValue('fat', parseInt(meal.macros.fat) * factor);

        // 2. Dynamically add/subtract micronutrients from suggested nutrients!
        if (meal.microsTags) {
          meal.microsTags.forEach(tag => {
            const nutId = matchNutrientId(tag);
            if (nutId) {
              const weights = { vitA: 225, vitC: 30, iron: 6, magnesium: 100 };
              const weight = weights[nutId] || 10;
              adjustNutrientValue(nutId, weight * factor);
            }
          });
        }

        return { ...meal, checked: nextCheckedState };
      }
      return meal;
    }));
  };

  const adjustMacroValue = (key, val) => {
    setMacros(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        current: Math.max(0, Math.min(prev[key].target, prev[key].current + val))
      }
    }));
  };

  const adjustNutrientValue = (id, val) => {
    setSuggestedNutrients(prev => prev.map(nut => {
      if (nut.id === id) {
        return {
          ...nut,
          current: Math.max(0, Math.min(nut.target, nut.current + val))
        };
      }
      return nut;
    }));
  };

  const handleAltMealChange = (id, text) => {
    setMeals(prev => prev.map(meal => {
      if (meal.id === id) {
        return { ...meal, whatAteInstead: text };
      }
      return meal;
    }));
  };

  // --- Real-Data Streak Logic ---
  const allMealsLogged = meals.every(meal => {
    if (meal.status === 'passed') {
      return meal.whatAteInstead && meal.whatAteInstead.trim().length > 0;
    }
    return meal.checked === true;
  });

  useEffect(() => {
    if (allMealsLogged) {
      setStreakDays(8);
    } else {
      setStreakDays(7);
    }

    // Check if there is an unchecked active meal
    const hasUncheckedActive = meals.some(m => m.status === 'active' && !m.checked);
    if (setHasUncheckedActiveMeal) {
      setHasUncheckedActiveMeal(hasUncheckedActive);
    }
  }, [meals, setHasUncheckedActiveMeal, allMealsLogged]);

  useEffect(() => {
    localStorage.setItem('food_tab_saved_meals', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem('food_tab_saved_macros', JSON.stringify(macros));
  }, [macros]);

  useEffect(() => {
    localStorage.setItem('food_tab_saved_micros', JSON.stringify(suggestedNutrients));
  }, [suggestedNutrients]);

  useEffect(() => {
    localStorage.setItem('food_tab_saved_streak', streakDays.toString());
  }, [streakDays]);

  useEffect(() => {
    if (!masterReport) return;
    const conclusion = masterReport.messages?.find(
      (m) => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:'))
    );
    if (!conclusion) return;

    const extractJSON = (text) => {
      if (!text) return null;
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]); } catch (e) { console.error(e); }
      }
      const rawMatch = text.match(/(\{[\s\S]*\})/);
      if (rawMatch) {
        try { return JSON.parse(rawMatch[1]); } catch (e) { console.error(e); }
      }
      return null;
    };

    const aiParsedJSON = extractJSON(conclusion.text);
    if (aiParsedJSON) {
      // 1. Update macros
      if (aiParsedJSON.macros) {
        const carbsTarget = aiParsedJSON.macros.carbs?.target || 250;
        const proteinTarget = aiParsedJSON.macros.protein?.target || 100;
        const fatTarget = aiParsedJSON.macros.fat?.target || 70;
        
        setMacros({
          carbs: { current: 0, target: carbsTarget, label: appLanguage === 'English' ? 'Carbohydrates' : 'ካርቦሃይድሬት', bg: 'linear-gradient(135deg, rgba(212,163,115,0.12), rgba(212,163,115,0.04))', barColor: '#cfa375' },
          protein: { current: 0, target: proteinTarget, label: appLanguage === 'English' ? 'Protein' : 'ፕሮቲን', bg: 'linear-gradient(135deg, rgba(107,144,128,0.12), rgba(107,144,128,0.04))', barColor: '#5c7f70' },
          fat: { current: 0, target: fatTarget, label: appLanguage === 'English' ? 'Dietary Fats' : 'ስብና ዘይቶች', bg: 'linear-gradient(135deg, rgba(229,152,155,0.12), rgba(229,152,155,0.04))', barColor: '#d68b8e' }
        });
      }

      // 2. Update meals
      if (aiParsedJSON.meals && Array.isArray(aiParsedJSON.meals)) {
        const mappedMeals = aiParsedJSON.meals.map(m => ({
          id: m.id || `meal_${Date.now()}_${Math.random()}`,
          name: m.name || 'Healthy Meal',
          type: m.id || 'lunch',
          time: m.time || '12:00 PM - 2:00 PM',
          calories: m.calories || '350 kcal',
          macros: m.macros || { carbs: '45g', protein: '15g', fat: '10g' },
          microsTags: m.microsTags || [],
          description: m.description || 'Nutritious balanced option suggested by Divya.',
          img: m.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
          status: calculateMealStatus(m.id || 'lunch'),
          checked: false,
          whatAteInstead: ''
        }));
        setMeals(mappedMeals);
      }

      // 3. Update micros (suggestedNutrients)
      if (aiParsedJSON.micros) {
        const mappedMicros = [];
        const entries = Object.entries(aiParsedJSON.micros);
        entries.forEach(([key, val]) => {
          if (!val) return;
          const currentVal = val.current || 0;
          const targetVal = val.target || 100;
          const unitVal = val.unit || 'mg';
          
          let name = key.toUpperCase();
          let icon = '✨';
          let barColor = '#825ab4';
          let bg = 'linear-gradient(135deg, rgba(130,90,180,0.12), rgba(130,90,180,0.04))';

          if (key.toLowerCase().includes('d') || key.toLowerCase().includes('vitamins_d')) {
            name = 'Vitamin D';
            icon = '☀️';
            barColor = '#d48c3c';
            bg = 'linear-gradient(135deg, rgba(212,140,60,0.12), rgba(212,140,60,0.04))';
          } else if (key.toLowerCase().includes('c') || key.toLowerCase().includes('vitamins_c')) {
            name = 'Vitamin C';
            icon = '🍊';
            barColor = '#c85a28';
            bg = 'linear-gradient(135deg, rgba(200,90,40,0.12), rgba(200,90,40,0.04))';
          } else if (key.toLowerCase().includes('iron') || key.toLowerCase() === 'fe') {
            name = 'Iron (Fe)';
            icon = '🥩';
            barColor = '#b43737';
            bg = 'linear-gradient(135deg, rgba(180,55,55,0.12), rgba(180,55,55,0.04))';
          } else if (key.toLowerCase().includes('magnesium')) {
            name = 'Magnesium';
            icon = '🥜';
            barColor = '#825ab4';
            bg = 'linear-gradient(135deg, rgba(130,90,180,0.12), rgba(130,90,180,0.04))';
          }

          mappedMicros.push({
            id: key,
            name,
            current: currentVal,
            target: targetVal,
            unit: unitVal,
            desc: appLanguage === 'English' ? `Essential daily suggested ${name} for your recovery.` : `የእለት ተእለት ማገገምዎን የሚደግፍ ጠቃሚ ${name}።`,
            icon,
            barColor,
            bg
          });
        });
        
        if (mappedMicros.length > 0) {
          setSuggestedNutrients(mappedMicros.slice(0, 4));
        }
      }
    }
  }, [masterReport, appLanguage]);

  const handleStreakClick = () => {
    if (allMealsLogged) {
      alert(appLanguage === 'English' 
        ? "🎉 Outstanding! You completed all of today's meals and locked in your Day 8 Streak!" 
        : "🎉 ድንቅ ነው! የዛሬውን ምግቦች በሙሉ በማጠናቀቅ የ8ኛውን ቀን ተከታታይነት መዝግበዋል!");
    } else {
      alert(appLanguage === 'English' 
        ? "Consistency is key! Please complete all today's meals (log Lunch and Dinner, and fill out what you ate instead of Breakfast) to claim your Day 8 Streak!" 
        : "ተከታታይነት ወሳኝ ነው! የዛሬውን የ8ኛውን ቀን ተከታታይነት ለመመዝገብ እባክዎ ሁሉንም የዛሬ ምግቦች ያጠናቅቁ (ምሳ እና እራት ይመዝግቡ፣ እንዲሁም ያለፉትን ቁርስ ምትክ ይጻፉ)!");
    }
  };

  // Language mapping helpers
  const t = (en, am) => appLanguage === 'English' ? en : am;

  // Split nutrients list strictly for:
  // If count is 3: Left column gets 1 nutrient (large), Right column gets 2.
  // If count is 4: Left column gets 2, Right column gets 2.
  const leftNutrients = suggestedNutrients.slice(0, suggestedNutrients.length === 3 ? 1 : 2);
  const rightNutrients = suggestedNutrients.slice(suggestedNutrients.length === 3 ? 1 : 2, 4);

  return (
    <div className="sample-page" style={{ 
      padding: '24px 32px', 
      textAlign: 'left', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      height: '100%', 
      overflowY: 'auto',
      backgroundColor: 'var(--bg)'
    }}>
      
      {/* TOP BAR: HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '20px'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(107,144,128,0.15)',
            color: 'var(--accent)'
          }}>
            <Apple size={24} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
                {t('Clinical Food & Nutrition Core', 'ክሊኒካዊ የአመጋገብ እና ጤና ማዕከል')}
              </h2>
              {/* Real-time System Time Badge */}
              <span style={{
                background: 'rgba(107, 144, 128, 0.12)',
                border: '1px solid rgba(107, 144, 128, 0.25)',
                color: 'var(--accent)',
                fontSize: '11.5px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', animation: 'blink 1.5s infinite' }} />
                <span>{systemTime}</span>
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('Log meals, monitor micronutrient cofactors, and track consistency.', 'ምግቦችን ይመዝግቡ፣ ማይክሮ አልሚዎችን ይከታተሉ፣ እና ጤናዎን ይጠብቁ።')}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: TOP SPLIT GRID - MACROS ON LEFT, AI SUGGESTED NUTRIENTS ON RIGHT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        alignItems: 'stretch',
        flexWrap: 'wrap'
      }}>
        
        {/* LEFT COLUMN: Daily Macro Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '290px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent)' }} />
            <span>{t('Daily Macro Review', 'የዕለት አልሚ ምግቦች ግምገማ')}</span>
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.1fr 1fr', 
            gap: '16px',
            minHeight: '340px',
            height: '100%'
          }}>
            {/* SUB-LEFT: Carbohydrates (tall card) */}
            {(() => {
              const item = macros.carbs;
              return (
                <div style={{
                  background: item.bg,
                  border: `2.5px solid ${item.barColor}70`,
                  borderRadius: '18px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: `0 8px 32px ${item.barColor}12`,
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%'
                }}>
                  {/* Floating Giant Meal Icon in Background */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '64px',
                    opacity: 0.15,
                    transform: 'rotate(15deg)',
                    pointerEvents: 'none'
                  }}>
                    🍞
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `${item.barColor}15`,
                    filter: 'blur(25px)'
                  }} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🍞</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>
                        {item.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: item.barColor, fontFamily: 'var(--font-body)', marginTop: '8px', letterSpacing: '-0.5px' }}>
                      {item.current} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: '400' }}>/</span> {item.target} g
                    </div>
                  </div>

                  {/* Encouraging Clinical Text instead of standard bar */}
                  <div style={{ margin: '12px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {t('Essential clean energy fuels your brain, central nervous system, and physical recovery path.', 'ንጹህ ካርቦሃይድሬት ለጭንቅላትዎ፣ ለነርቭ ስርዓትዎ እና ለአጠቃላይ ማገገሚያዎ የሃይል ምንጭ ነው።')}
                  </div>

                  {/* Increment / Decrement actions */}
                  <div style={{ display: 'flex', gap: '8px', zIndex: 2 }}>
                    <button 
                      onClick={() => adjustMacroValue('carbs', -10)}
                      style={{
                        flex: 1, border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', padding: '8px 0', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      <Minus size={12} /> 10g
                    </button>
                    <button 
                      onClick={() => adjustMacroValue('carbs', 10)}
                      style={{
                        flex: 1, border: 'none', background: `${item.barColor}30`, borderRadius: '8px', color: item.barColor, cursor: 'pointer', padding: '8px 0', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      <Plus size={12} /> 10g
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* SUB-RIGHT: Protein & Fat stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {['protein', 'fat'].map((key) => {
                const item = macros[key];
                const iconMap = { protein: '🍳', fat: '🥑' };
                const descMap = {
                  protein: t('Rebuilds skeletal muscles and accelerates tissue healing.', 'የጡንቻ ጥገናን እና ህዋሳትን በፍጥነት ለመገንባት ይረዳል።'),
                  fat: t('Crucial for brain wellness and essential absorption.', 'ለጭንቅላት ጤና እና ለአስፈላጊ ቪታሚኖች መምጠጥ።')
                };

                return (
                  <div key={key} style={{
                    background: item.bg,
                    border: `2.5px solid ${item.barColor}70`,
                    borderRadius: '18px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: `0 4px 20px ${item.barColor}08`,
                    position: 'relative',
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    {/* Floating background icon */}
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      fontSize: '36px',
                      opacity: 0.12,
                      pointerEvents: 'none'
                    }}>
                      {iconMap[key]}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>{iconMap[key]}</span>
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text)' }}>
                          {item.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '16.5px', fontWeight: '900', color: item.barColor, fontFamily: 'var(--font-body)', marginTop: '4px', letterSpacing: '-0.2px' }}>
                        {item.current} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>/</span> {item.target} g
                      </div>
                    </div>

                    {/* Short description instead of progress bar */}
                    <p style={{ margin: '4px 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {descMap[key]}
                    </p>

                    {/* Increment / Decrement actions */}
                    <div style={{ display: 'flex', gap: '8px', zIndex: 2 }}>
                      <button 
                        onClick={() => adjustMacroValue(key, -5)}
                        style={{
                          flex: 1, border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', color: 'var(--text)', cursor: 'pointer', padding: '4px 0', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Minus size={10} /> 5g
                      </button>
                      <button 
                        onClick={() => adjustMacroValue(key, 5)}
                        style={{
                          flex: 1, border: 'none', background: `${item.barColor}30`, borderRadius: '6px', color: item.barColor, cursor: 'pointer', padding: '4px 0', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Plus size={10} /> 5g
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI-Suggested Essential Nutrients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            <span>{t('AI-Suggested Essential Nutrients', 'በ-AI የተጠቆሙ አስፈላጊ ማይክሮ አልሚዎች')}</span>
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            height: '100%',
            minHeight: '340px'
          }}>
            {suggestedNutrients.map((nut) => {
              const stepMap = { vitA: 50, vitC: 10, iron: 1, magnesium: 20 };
              const step = stepMap[nut.id] || 5;

              return (
                <div key={nut.id} style={{
                  background: nut.bg,
                  border: `2.5px solid ${nut.barColor}70`,
                  borderRadius: '18px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: `0 4px 20px ${nut.barColor}08`,
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '162px',
                  flexShrink: 0,
                  transition: 'transform 0.2s'
                }}>
                  {/* Floating giant background icon */}
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    fontSize: '36px',
                    opacity: 0.12,
                    pointerEvents: 'none'
                  }}>
                    {nut.icon}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>{nut.icon}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text)' }}>
                        {nut.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '16.5px', fontWeight: '900', color: nut.barColor, fontFamily: 'var(--font-body)', marginTop: '4px', letterSpacing: '-0.2px' }}>
                      {nut.current} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>/</span> {nut.target} {nut.unit}
                    </div>
                  </div>

                  {/* Short description */}
                  <p style={{ margin: '4px 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    {nut.desc}
                  </p>

                  {/* Increment / Decrement actions */}
                  <div style={{ display: 'flex', gap: '8px', zIndex: 2 }}>
                    <button 
                      onClick={() => adjustNutrientValue(nut.id, -step)}
                      style={{
                        flex: 1, border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', color: 'var(--text)', cursor: 'pointer', padding: '4px 0', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Minus size={10} /> {step}{nut.unit}
                    </button>
                    <button 
                      onClick={() => adjustNutrientValue(nut.id, step)}
                      style={{
                        flex: 1, border: 'none', background: `${nut.barColor}30`, borderRadius: '6px', color: nut.barColor, cursor: 'pointer', padding: '4px 0', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Plus size={10} /> {step}{nut.unit}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECTION 2: BOTTOM FLEX SPLIT - TODAY'S FOOD LOG VS FOOD & VEGETABLE */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        gap: '24px',
        width: '100%'
      }}>
        
        {/* LEFT BOTTOM: FOOD LIST FOR TODAY */}
        <div style={{ flex: '1.4 1 320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
              {t("Today's Food Log", 'የዛሬው የምግብ ምዝግብ')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {meals.map((meal) => {
              const isPassed = meal.status === 'passed';
              const isActive = meal.status === 'active' && !meal.checked;
              const isUpcoming = meal.status === 'upcoming';
              const isDisabled = isPassed || isUpcoming;

              const mealTypeLabels = {
                breakfast: appLanguage === 'English' ? 'Breakfast 🌅' : 'ቁርስ 🌅',
                lunch: appLanguage === 'English' ? 'Lunch ☀️' : 'ምሳ ☀️',
                afternoon_snack: appLanguage === 'English' ? 'Afternoon Tea & Snack ☕' : 'የከሰዓት ቡናና ቆሎ ☕',
                dinner: appLanguage === 'English' ? 'Dinner 🌙' : 'እራት 🌙',
              };

              return (
                <div 
                  key={meal.id}
                  style={{
                    background: isPassed ? 'rgba(0,0,0,0.02)' : 'var(--surface)',
                    border: (isActive && !meal.checked) 
                      ? '2px solid #ef4444' 
                      : (meal.checked ? '2px solid var(--accent)' : '1px solid var(--border)'),
                    borderRadius: '16px',
                    padding: '16px',
                    opacity: isPassed ? 0.6 : (isUpcoming ? 0.85 : 1),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    transition: 'all 0.2s',
                    boxShadow: (isActive && !meal.checked) ? '0 0 15px rgba(239,68,68,0.1)' : 'none'
                  }}
                >
                  {/* Header/Image Row */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img 
                      src={meal.img} 
                      alt={meal.name} 
                      style={{ 
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '14px', 
                        objectFit: 'cover',
                        filter: isPassed ? 'grayscale(1)' : (isUpcoming ? 'opacity(0.8) sepia(0.1)' : 'none'),
                        border: isUpcoming ? '1.5px dashed var(--border-active)' : '1.5px solid var(--border-active)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                        flexShrink: 0
                      }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          textTransform: 'uppercase', 
                          color: isUpcoming ? 'var(--text-muted)' : 'var(--accent)', 
                          letterSpacing: '0.5px' 
                        }}>
                          {mealTypeLabels[meal.id]} {isUpcoming && t('(Upcoming)', '(በቀጣይ የሚቀርብ)')}
                        </span>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '16px', 
                          fontWeight: '800', 
                          color: isPassed ? 'var(--text-muted)' : 'var(--text)',
                          fontFamily: 'var(--font-body)'
                        }}>
                          {meal.name}
                        </h4>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        🕒 {meal.time}
                      </span>
                    </div>

                    {/* Interactive Checkbox Circle */}
                    <button
                      onClick={isDisabled ? null : () => handleCheckMeal(meal.id)}
                      disabled={isDisabled}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        padding: '4px'
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: isPassed 
                          ? '2px solid rgba(255,255,255,0.08)' 
                          : (isUpcoming ? '2px dashed var(--border-active)' : (meal.checked ? 'none' : '2px solid #ef4444')),
                        background: isPassed 
                          ? 'rgba(0,0,0,0.05)' 
                          : (isUpcoming ? 'rgba(255,255,255,0.01)' : (meal.checked ? '#ef4444' : 'transparent')),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: (isActive && !meal.checked) ? '0 0 10px rgba(239,68,68,0.3)' : 'none'
                      }}>
                        {meal.checked && <Check size={16} style={{ color: 'white' }} />}
                      </div>
                    </button>
                  </div>

                  <p style={{ 
                    margin: 0, 
                    fontSize: '12.5px', 
                    color: 'var(--text-muted)', 
                    lineHeight: '1.4',
                    textDecoration: isPassed ? 'line-through' : 'none'
                  }}>
                    {meal.description}
                  </p>

                  {/* Meal contents tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                      Calories: <strong style={{ color: 'var(--text)' }}>{meal.calories}</strong>
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                      Carbs: <strong>{meal.macros.carbs}</strong>
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                      Protein: <strong>{meal.macros.protein}</strong>
                    </span>
                    
                    {/* Micronutrients / Minerals / Vitamins Tags */}
                    {meal.microsTags && meal.microsTags.map((tag, tIdx) => (
                      <span key={`micros-tag-${tIdx}`} style={{
                        background: isLightMode ? 'rgba(82, 121, 111, 0.08)' : 'rgba(107, 144, 128, 0.12)',
                        border: isLightMode ? '1px solid rgba(82, 121, 111, 0.2)' : '1px solid rgba(107, 144, 128, 0.25)',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        color: 'var(--accent)',
                        fontWeight: '700',
                        letterSpacing: '0.2px'
                      }}>
                        ✨ {tag}
                      </span>
                    ))}
                  </div>

                  {/* PASSED / DISABLER PROMPT WRAPPER */}
                  {isPassed && (
                    <div style={{ 
                      marginTop: '8px', 
                      background: 'rgba(229,152,155,0.06)', 
                      border: '1px dashed rgba(229,152,155,0.2)', 
                      borderRadius: '10px', 
                      padding: '12px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <AlertCircle size={14} style={{ color: '#e5989b' }} />
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#e5989b' }}>
                          {t('You missed this mealtime.', 'ይህን የምግብ ሰዓት አልፈውታል።')}
                        </span>
                      </div>
                      
                      {/* What have you eaten instead? text prompt */}
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {t('What did you eat rather than me?', 'ከእኔ ይልቅ ምን ተመገቡ?')}
                      </label>
                      <input 
                        type="text"
                        placeholder={t("e.g. Rice with Veggies, Salad...", "ምሳሌ፡ ሩዝ ከአትክልት ጋር፣ ሰላጣ...")}
                        value={meal.whatAteInstead || ''}
                        onChange={(e) => handleAltMealChange(meal.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(0,0,0,0.1)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Aesthetic Vertical Separator Line (Desktop Only) */}
        <div style={{
          width: '1px',
          alignSelf: 'stretch',
          minHeight: '350px',
          background: isLightMode 
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 100%)' 
            : 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)',
          margin: '0 10px',
        }} className="plan-vertical-divider" />

        {/* RIGHT BOTTOM: RECOMMENDED FOOD & VEGETABLE */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
              {t('Food & Vegetable', 'ምግብ እና አትክልት')}
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px'
          }}>
            {recommendedPlants.map((plant, index) => (
              <div 
                key={`plant-${index}`}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                {/* Real high-res fruit/vegetable image */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1.5px solid var(--border)'
                }}>
                  <img 
                    src={plant.img} 
                    alt={plant.name} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }} 
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text)' }}>{plant.name}</strong>
                    <span style={{ 
                      fontSize: '10px', 
                      background: 'rgba(107,144,128,0.1)', 
                      color: 'var(--accent-light)', 
                      padding: '2px 6px', 
                      borderRadius: '6px',
                      fontWeight: '700'
                    }}>
                      {plant.recoveryTip}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    {plant.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* FOOTER MEDICAL DISCLAIMER */}
      <p style={{
        margin: '12px 0 0 0',
        fontSize: '11px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        paddingTop: '16px',
        fontStyle: 'italic',
        lineHeight: '1.5',
        textAlign: 'center'
      }}>
        {t(
          'This plan is an AI-generated suggestion based on nutritional guidelines. Please consult a healthcare professional before making drastic changes to your diet.',
          'ይህ እቅድ በአመጋገብ መመሪያዎች ላይ የተመሰረተ በAI የተዘጋጀ ሃሳብ ነው። በአመጋገብዎ ላይ ከፍተኛ ለውጥ ከማድረግዎ በፊት እባክዎ የህክምና ባለሙያ ያማክሩ።'
        )}
      </p>

    </div>
  );
}
