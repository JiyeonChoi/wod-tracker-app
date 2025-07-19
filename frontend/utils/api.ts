const API_URL = process.env.EXPO_PUBLIC_BACK_END_API_URL;

export const fetchGroupedExercises = async () => {
    try {
        console.log("🔄 Fetching exercises from:", `${API_URL}/api/grouped-exercises`);
        
        const res = await fetch(`${API_URL}/api/grouped-exercises`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const result = await res.json();
        
        console.log("✅ API Response received");
  
      if (result.success) {
        return result.grouped;
      } else {
        throw new Error(result.error || "Failed to fetch grouped exercises");
      }
    } catch (err) {
      console.error("❌ API Error:", err);
      throw err;
    }
  };
  