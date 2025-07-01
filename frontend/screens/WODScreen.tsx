// frontend/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { fetchGroupedExercises } from "../utils/api";
import GroupedExercises from "../components/WODScreen/GroupedExercises";

const WODScreen = () => {
  const [groupedExercises, setGroupedExercises] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchGroupedExercises();
        setGroupedExercises(data);
      } catch (err) {
        setError("Failed to load exercises.");
      }
    };

    loadData();
  }, []);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <GroupedExercises grouped={groupedExercises} />
      <StatusBar style="auto" />
    </View>
  );
};

export default WODScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
