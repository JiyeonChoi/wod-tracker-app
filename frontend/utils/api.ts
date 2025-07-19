export const fetchGroupedExercises = async () => {
    try {
        const res = await fetch("https://wod-tracker-app.onrender.com/api/grouped-exercises");
        const result = await res.json();
  
      if (result.success) {
        return result.grouped;
      } else {
        throw new Error(result.error || "Failed to fetch grouped exercises");
      }
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  };
  