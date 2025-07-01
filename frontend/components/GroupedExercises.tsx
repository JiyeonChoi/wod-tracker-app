import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  ScrollView,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";

type Props = {
  grouped: Record<string, string[]>;
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Item = {
  id: string;
  text: string;
};

const GroupedExercises = ({ grouped }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Item[]>([]);
  const [showExercises, setShowExercises] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const initialExpanded = Object.keys(grouped || {}).reduce((acc, cat) => {
      acc[cat] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setExpanded(initialExpanded);
  }, [grouped]);

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!(category in expanded)) return;

    setExpanded((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSelect = (text: string) => {
    const newItem: Item = { id: Date.now().toString(), text };

    setSelected((prev) => {
      if (focusedIndex === null || focusedIndex >= prev.length) {
        return [...prev, newItem]; // Fallback to end
      }

      const updated = [...prev];
      updated.splice(focusedIndex + 1, 0, newItem);
      return updated;
    });
  };

  const handleEdit = (text: string, index: number) => {
    const updated = [...selected];
    updated[index].text = text;
    setSelected(updated);
  };

  const handleAddBlank = () => {
    setSelected((prev) => [...prev, { id: Date.now().toString(), text: "" }]);
  };

  const handleDelete = (id: string) => {
    setSelected((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInsertAfter = (index: number) => {
    const newItem: Item = { id: Date.now().toString(), text: "" };
    const updated = [...selected];
    updated.splice(index + 1, 0, newItem);
    setSelected(updated);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: any) => {
    const index = getIndex();

    return (
      <ScaleDecorator>
        <View style={[styles.draggableItem, isActive && styles.activeItem]}>
          <TouchableOpacity
            onLongPress={() => drag()}
            disabled={isActive}
            style={styles.dragHandle}
          >
            <Text style={styles.dragHandleText}>≡</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={item.text}
            onChangeText={(newText) => handleEdit(newText, index)}
            onFocus={() => setFocusedIndex(index)}
            multiline
          />

          <TouchableOpacity
            onPress={() => handleInsertAfter(index)}
            style={styles.addBtnSmall}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left panel: Selected exercises */}
      <View
        style={[
          styles.selectedContainer,
          showExercises ? styles.selectedPartial : styles.selectedFull,
        ]}
      >
        {/* Header with Selected title and toggle button side by side */}
        <View style={styles.leftHeader}>
          <Text style={styles.panelTitle}>WOD</Text>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
              setShowExercises((prev) => !prev);
            }}
            style={styles.toggleBtnSmall}
          >
            <Text style={styles.toggleBtnText}>🏋️</Text>
          </TouchableOpacity>
        </View>

        {selected.length === 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddBlank}>
            <Text style={styles.addBtnText}>+ Add Blank</Text>
          </TouchableOpacity>
        )}

        {selected.length === 0 ? (
          <Text style={styles.placeholder}></Text>
        ) : (
          <DraggableFlatList
            data={selected}
            onDragEnd={({ data }) => setSelected(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}
      </View>

      {/* Right panel: Exercise buttons */}
      {showExercises && (
        <View style={styles.exerciseContainer}>
          <ScrollView
            contentContainerStyle={styles.exerciseScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(grouped || {}).map(([category, exercises]) => (
              <View key={category} style={styles.categorySection}>
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={styles.categoryButton}
                >
                  <Text style={styles.categoryText}>
                    {expanded[category] ? "▼" : "▶"} {category}
                  </Text>
                </TouchableOpacity>

                {expanded[category] &&
                  Array.isArray(exercises) &&
                  exercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelect(exercise)}
                      style={styles.exerciseButton}
                    >
                      <Text style={styles.exerciseText}>{exercise}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default GroupedExercises;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: "100%",
  },
  selectedContainer: {
    padding: 12,
    backgroundColor: "#f8f9fa",
  },
  selectedPartial: {
    width: "60%",
  },
  selectedFull: {
    width: "100%",
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  panelTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    letterSpacing: 1,
  },
  toggleBtnSmall: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  placeholder: {
    fontStyle: "italic",
    color: "#999",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 8,
    fontSize: 15,
    marginBottom: 5,
    marginTop: 5,
    backgroundColor: "#fff",
    color: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtn: {
    backgroundColor: "#3b82f6",
    padding: 6,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: "center",
  },
  exerciseContainer: {
    flex: 1,
    padding: 12,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#e6f0ff",
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a73e8",
  },
  exerciseButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  exerciseText: {
    fontSize: 15,
    color: "#333",
  },
  draggableItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  activeItem: {
    backgroundColor: "#ddeeff",
  },
  dragHandle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  dragHandleText: {
    fontSize: 20,
    color: "#555",
  },

  addBtnSmall: {
    marginLeft: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginTop: -3,
  },
  addBtnText: {
    color: "#e6f0ff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
  },
  deleteBtn: {
    marginLeft: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 20,
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginTop: -3,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
  },
  exerciseScrollContent: {
    paddingBottom: 80, // extra space to prevent last item from being hidden
  },
});
