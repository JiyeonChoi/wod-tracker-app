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
  Modal,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import * as Clipboard from "expo-clipboard";
import Icon from "react-native-vector-icons/FontAwesome5";
import { TouchableWithoutFeedback } from "react-native";
import { BlurView } from "expo-blur";

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
  setsReps?: string;
};

type SupersetGroup = {
  id: string;
  type: string; // e.g. "Superset of 2"
  exercises: Item[];
};

const GroupedExercises = ({ grouped }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Item[]>([]);
  const [supersets, setSupersets] = useState<SupersetGroup[]>([]);
  const [showExercises, setShowExercises] = useState(true);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [focused, setFocused] = useState<{
    groupId: string | null;
    index: number | string | null;
  }>({ groupId: null, index: null });

  // For Sets & Reps modal
  const [setsRepsModal, setSetsRepsModal] = useState<{
    visible: boolean;
    groupId: string | null;
    index: number | null;
    value: string;
  }>({ visible: false, groupId: null, index: null, value: "" });

  useEffect(() => {
    const initialExpanded = Object.keys(grouped || {}).reduce((acc, cat) => {
      acc[cat] = false;
      return acc;
    }, {} as Record<string, boolean>);

    initialExpanded["Supersets"] = false;
    initialExpanded["Sets & Reps"] = false;
    initialExpanded["Timer"] = false;

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

    if (focused.groupId) {
      if (focused.index === "superset-title") {
        setSupersets((prev) =>
          prev.map((group) =>
            group.id === focused.groupId
              ? {
                  ...group,
                  exercises: [...group.exercises, newItem],
                }
              : group
          )
        );
      } else if (typeof focused.index === "number") {
        setSupersets((prev) =>
          prev.map((group) =>
            group.id === focused.groupId
              ? {
                  ...group,
                  exercises: [
                    ...group.exercises.slice(0, (focused.index as number) + 1),
                    newItem,
                    ...group.exercises.slice((focused.index as number) + 1),
                  ],
                }
              : group
          )
        );
      } else {
        setSupersets((prev) =>
          prev.map((group) =>
            group.id === focused.groupId
              ? {
                  ...group,
                  exercises: [...group.exercises, newItem],
                }
              : group
          )
        );
      }
    } else if (typeof focused.index === "number") {
      setSelected((prev) => {
        const updated = [...prev];
        updated.splice((focused.index as number) + 1, 0, newItem);
        return updated;
      });
    } else {
      setSelected((prev) => [...prev, newItem]);
    }
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

  const handleCopyWorkout = () => {
    let lines: string[] = [];

    // Add main list items
    if (selected.length > 0) {
      lines.push(
        ...selected.map((item) => {
          if (item.text === "---") return ""; // blank line for ---
          if (item.setsReps) return `${item.text} ${item.setsReps}`.trim();
          return item.text;
        })
      );
    }

    // Add supersets, each with title and exercises
    supersets.forEach((group) => {
      if (lines.length > 0) lines.push(""); // empty line before superset if not first
      lines.push(group.type);
      lines.push(
        ...group.exercises.map((ex) => {
          if (ex.text === "---") return "";
          if (ex.setsReps) return `${ex.text} ${ex.setsReps}`.trim();
          return ex.text;
        })
      );
    });

    // Add empty line at the end if there is any content
    if (lines.length > 0) lines.push("");

    Clipboard.setStringAsync(lines.join("\n"));
  };

  const handleAddSuperset = (type: string) => {
    setSupersets((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        exercises: [],
      },
    ]);
  };

  const handleEditSupersetExercise = (
    supersetId: string,
    idx: number,
    text: string
  ) => {
    setSupersets((prev) =>
      prev.map((group) =>
        group.id === supersetId
          ? {
              ...group,
              exercises: group.exercises.map((ex, i) =>
                i === idx ? { ...ex, text } : ex
              ),
            }
          : group
      )
    );
  };

  const handleEditSupersetSetsReps = (
    supersetId: string,
    idx: number,
    setsReps: string
  ) => {
    setSupersets((prev) =>
      prev.map((group) =>
        group.id === supersetId
          ? {
              ...group,
              exercises: group.exercises.map((ex, i) =>
                i === idx ? { ...ex, setsReps } : ex
              ),
            }
          : group
      )
    );
  };

  const handleAddBlankToSuperset = (
    supersetId: string,
    afterIdx: number | null
  ) => {
    setSupersets((prev) =>
      prev.map((group) =>
        group.id === supersetId
          ? {
              ...group,
              exercises:
                afterIdx !== null
                  ? [
                      ...group.exercises.slice(0, afterIdx + 1),
                      { id: Date.now().toString(), text: "" },
                      ...group.exercises.slice(afterIdx + 1),
                    ]
                  : [
                      { id: Date.now().toString(), text: "" },
                      ...group.exercises,
                    ],
            }
          : group
      )
    );
  };

  const handleDeleteSuperset = (supersetId: string) => {
    setSupersets((prev) => prev.filter((group) => group.id !== supersetId));
  };

  const handleEditSupersetTitle = (supersetId: string, newType: string) => {
    setSupersets((prev) =>
      prev.map((group) =>
        group.id === supersetId ? { ...group, type: newType } : group
      )
    );
  };

  const handleEditSetsReps = (index: number, setsReps: string) => {
    setSelected((prev) =>
      prev.map((item, i) => (i === index ? { ...item, setsReps } : item))
    );
  };

  const handleClear = () => {
    setSelected([]);
    setSupersets([]);
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      {/* Left panel */}
      <View
        style={[
          styles.selectedContainer,
          showExercises ? styles.selectedPartial : styles.selectedFull,
          { flex: 1, position: "relative" },
        ]}
      >
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          {/* Add blank item */}
          <TouchableOpacity
            style={styles.addBtnSmall}
            onPress={() => {
              if (typeof focused.index === "number") {
                const updated = [...selected];
                updated.splice(focused.index + 1, 0, {
                  id: Date.now().toString(),
                  text: "",
                });
                setSelected(updated);
              } else {
                setSelected((prev) => [
                  ...prev,
                  { id: Date.now().toString(), text: "" },
                ]);
              }
            }}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>

          {/* Add line item */}
          <TouchableOpacity
            style={[styles.addBtnSmall, { marginLeft: 4 }]}
            onPress={() => {
              if (typeof focused.index === "number") {
                const updated = [...selected];
                updated.splice(focused.index + 1, 0, {
                  id: Date.now().toString(),
                  text: "---",
                });
                setSelected(updated);
              } else {
                setSelected((prev) => [
                  ...prev,
                  { id: Date.now().toString(), text: "---" },
                ]);
              }
            }}
          >
            <Text style={styles.addBtnText}>─</Text>
          </TouchableOpacity>

          {/* Add "3 Sets" preset */}
          <TouchableOpacity
            style={[styles.addBtnSmall, { marginLeft: 4 }]}
            onPress={() => {
              const itemsToAdd = [
                { id: Date.now().toString() + "-line", text: "---" },
                { id: Date.now().toString() + "-main", text: "3 Sets" },
              ];
              if (typeof focused.index === "number") {
                const updated = [...selected];
                updated.splice(focused.index + 1, 0, ...itemsToAdd);
                setSelected(updated);
              } else {
                setSelected((prev) => [...prev, ...itemsToAdd]);
              }
            }}
          >
            <Text style={styles.addBtnText}>3</Text>
          </TouchableOpacity>
        </View>
        {/* Superset Groups */}
        {supersets.map((group) => (
          <View
            key={group.id}
            style={{
              marginBottom: 16,
              padding: 10,
              backgroundColor: "white",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#e0e7ef",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <TextInput
                style={{
                  width: 40,
                  height: 36,
                  backgroundColor: "#fff",
                  color: "#2563eb",
                  fontWeight: "bold",
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: "#2563eb",
                  borderRadius: 8,
                  textAlign: "center",
                  marginRight: 8,
                }}
                keyboardType="numeric"
                value={group.type.match(/\d+/)?.[0] || ""}
                onChangeText={(num) =>
                  handleEditSupersetTitle(
                    group.id,
                    `${num.replace(/[^0-9]/g, "")} Sets`
                  )
                }
                onFocus={() =>
                  setFocused({ groupId: group.id, index: "superset-title" })
                }
              />
              <Text
                style={{ color: "#2563eb", fontWeight: "bold", fontSize: 16 }}
              >
                Sets
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteSuperset(group.id)}
                style={{
                  marginLeft: "auto",
                  backgroundColor: "#ef4444",
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>
            {/* Draggable list of exercises in the superset */}
            <DraggableFlatList
              data={group.exercises}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => {
                setSupersets((prev) =>
                  prev.map((g) =>
                    g.id === group.id ? { ...g, exercises: data } : g
                  )
                );
              }}
              renderItem={({ item, drag, isActive, getIndex }) => {
                const idx = getIndex();
                if (item.text === "---") {
                  return (
                    <ScaleDecorator>
                      <View>
                        <View
                          style={[
                            styles.draggableItem,
                            isActive && styles.activeItem,
                            { paddingVertical: 0 },
                          ]}
                        >
                          <TouchableOpacity
                            onLongPress={() => drag()}
                            disabled={isActive}
                            style={styles.dragHandle}
                          >
                            <Text style={styles.dragHandleText}>≡</Text>
                          </TouchableOpacity>
                          <View
                            style={{
                              flex: 1,
                              height: 1,
                              backgroundColor: "#bbb",
                              marginVertical: 10,
                              marginHorizontal: 8,
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={styles.deleteBtn}
                          >
                            <Text style={styles.deleteBtnText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScaleDecorator>
                  );
                }
                return (
                  <View>
                    <View
                      style={[
                        styles.draggableItem,
                        isActive && styles.activeItem,
                      ]}
                    >
                      <TouchableOpacity
                        onLongPress={drag}
                        disabled={isActive}
                        style={styles.dragHandle}
                      >
                        <Text style={styles.dragHandleText}>≡</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: "#fff",
                            color: "#222",
                            marginBottom: 6,
                          },
                        ]}
                        value={item.text}
                        onChangeText={(text) =>
                          handleEditSupersetExercise(group.id, idx, text)
                        }
                        onFocus={() =>
                          setFocused({ groupId: group.id, index: idx })
                        }
                      />
                      <TouchableOpacity
                        onPress={() => handleAddBlankToSuperset(group.id, idx)}
                        style={styles.addBtnSmall}
                      >
                        <Text style={styles.addBtnText}>＋</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setSupersets((prev) =>
                            prev.map((g) =>
                              g.id === group.id
                                ? {
                                    ...g,
                                    exercises: g.exercises.filter(
                                      (item2) => item2.id !== item.id
                                    ),
                                  }
                                : g
                            )
                          );
                        }}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: 36,
                        marginBottom: 4,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          setSetsRepsModal({
                            visible: true,
                            groupId: group.id,
                            index: idx,
                            value: item.setsReps || "",
                          })
                        }
                        style={[
                          styles.dumbbellBtn,
                          item.setsReps && {
                            flexDirection: "row",
                            alignItems: "center",
                            width: undefined, // allow width to grow with text
                            minWidth: 40,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          },
                        ]}
                      >
                        {item.setsReps ? (
                          <Text
                            style={{
                              color: "#2563eb",
                              fontSize: 14,
                              marginLeft: 6,
                              fontWeight: "bold",
                              flexShrink: 1,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.setsReps}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
            {/* Show "Add Exercise" button only if there are no items */}
            {group.exercises.length === 0 && (
              <TouchableOpacity
                style={[styles.addBtn, { marginTop: 4 }]}
                onPress={() => handleAddBlankToSuperset(group.id, null)}
              >
                <Text style={styles.addBtnText}>+ Add Exercise</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {selected.length === 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddBlank}>
            <Text style={styles.addBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}
        {selected.length === 0 ? (
          <Text style={styles.placeholder}></Text>
        ) : (
          <DraggableFlatList
            data={selected}
            onDragEnd={({ data }) => setSelected(data)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, drag, isActive, getIndex }) => {
              const index = getIndex();
              // Render a line if the text is '---'
              // ...inside renderItem for DraggableFlatList...
              if (item.text === "---") {
                const isFocused = focused.index === index && !focused.groupId;
                return (
                  <ScaleDecorator>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => setFocused({ groupId: null, index })}
                      style={{ width: "100%" }}
                    >
                      <View
                        style={[
                          styles.draggableItem,
                          isActive && styles.activeItem,
                          { paddingVertical: 0 },
                        ]}
                      >
                        {isFocused && (
                          <TouchableOpacity
                            onLongPress={() => drag()}
                            disabled={isActive}
                            style={styles.dragHandle}
                          >
                            <Text style={styles.dragHandleText}>≡</Text>
                          </TouchableOpacity>
                        )}
                        <View
                          style={{
                            flex: 1,
                            height: 1,
                            backgroundColor: "#bbb",
                            marginVertical: 10,
                            marginHorizontal: 8,
                          }}
                        />
                        {isFocused && (
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={styles.deleteBtn}
                          >
                            <Text style={styles.deleteBtnText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </ScaleDecorator>
                );
              }
              return (
                <ScaleDecorator>
                  <View>
                    <View
                      style={[
                        styles.draggableItem,
                        isActive && styles.activeItem,
                      ]}
                    >
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
                        onFocus={() => setFocused({ groupId: null, index })}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setSetsRepsModal({
                            visible: true,
                            groupId: null,
                            index,
                            value: item.setsReps || "",
                          })
                        }
                        style={styles.dumbbellBtn}
                      >
                        <Icon name="dumbbell" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: 36,
                        marginBottom: 4,
                      }}
                    >
                      {item.setsReps ? (
                        <TouchableOpacity
                          onPress={() =>
                            setSetsRepsModal({
                              visible: true,
                              groupId: null,
                              index,
                              value: item.setsReps || "",
                            })
                          }
                          style={[
                            styles.setsRepsBtn,
                            {
                              flexDirection: "row",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: "#2563eb",
                              fontSize: 13,
                              fontWeight: "bold",
                              flexShrink: 1,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.setsReps}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        )}
        {/* Bottom buttons always visible */}
        {/* <View
          style={{
            width: "100%",
            position: "absolute",
            left: 0,
            bottom: 0,
            backgroundColor: "#f8f9fa",
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            style={[
              styles.copyBtn,
              { flex: 1, marginHorizontal: 8, marginTop: 0 },
            ]}
            onPress={handleCopyWorkout}
          >
            <Text style={styles.copyBtnText}>📋 Copy Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.copyBtn,
              {
                backgroundColor: "#ef4444",
                flex: 1,
                marginHorizontal: 8,
                marginTop: 0,
              },
            ]}
            onPress={handleClear}
          >
            <Text style={styles.copyBtnText}>Clear</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Right panel */}
      {showExercises && (
        <View style={styles.exerciseContainer}>
          <ScrollView
            contentContainerStyle={styles.exerciseScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Exercise Groups */}
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

            {/* Supersets Dropdown */}
            <View style={[styles.categorySection, styles.presetsSection]}>
              <TouchableOpacity
                onPress={() => toggleCategory("Supersets")}
                style={[styles.categoryButton, styles.presetsCategoryButton]}
              >
                <Text style={[styles.categoryText, styles.presetsCategoryText]}>
                  {expanded["Supersets"] ? "▼" : "▶"} Supersets
                </Text>
              </TouchableOpacity>

              {expanded["Supersets"] &&
                ["2 Sets", "3 Sets", "4 Sets"].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetButton}
                    onPress={() => handleAddSuperset(preset)}
                  >
                    <Text style={styles.presetButtonText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Sets & Reps Dropdown */}
            <View style={[styles.categorySection, styles.presetsSection]}>
              <TouchableOpacity
                onPress={() => toggleCategory("Sets & Reps")}
                style={[styles.categoryButton, styles.presetsCategoryButton]}
              >
                <Text style={[styles.categoryText, styles.presetsCategoryText]}>
                  {expanded["Sets & Reps"] ? "▼" : "▶"} Sets & Reps
                </Text>
              </TouchableOpacity>

              {expanded["Sets & Reps"] &&
                [
                  "(10 lbs) x 10 x 3",
                  "(20 lbs) x 10 x 3",
                  "(15 lbs x 2) x 10 x 3",
                  "(20 lbs x 2) x 8 x 3",
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetButton}
                    onPress={() => {
                      // If a workout input is focused, add sets&reps to it
                      if (
                        focused.groupId &&
                        typeof focused.index === "number"
                      ) {
                        handleEditSupersetSetsReps(
                          focused.groupId,
                          focused.index,
                          preset
                        );
                      } else if (typeof focused.index === "number") {
                        handleEditSetsReps(focused.index, preset);
                      }
                    }}
                  >
                    <Text style={styles.presetButtonText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Timer Dropdown */}
            <View style={[styles.categorySection, styles.presetsSection]}>
              <TouchableOpacity
                onPress={() => toggleCategory("Timer")}
                style={[styles.categoryButton, styles.presetsCategoryButton]}
              >
                <Text style={[styles.categoryText, styles.presetsCategoryText]}>
                  {expanded["Timer"] ? "▼" : "▶"} Timer
                </Text>
              </TouchableOpacity>

              {expanded["Timer"] &&
                ["1 min", "2 mins", "3 mins"].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetButton}
                    onPress={() => handleSelect(preset)}
                  >
                    <Text style={styles.presetButtonText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Sets & Reps Modal */}
      <Modal
        visible={setsRepsModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSetsRepsModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 24,
              borderRadius: 12,
              width: 300,
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}
            >
              Weights & Sets & Reps
            </Text>
            {/* Preset options */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 10,
                justifyContent: "center",
              }}
            >
              {[
                "(10 lbs) x 10 x 3",
                "(20 lbs) x 10 x 3",
                "(15 lbs x 2) x 10 x 3",
                "(20 lbs x 2) x 8 x 3",
              ].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={{
                    backgroundColor: "#e6f0ff",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    margin: 4,
                  }}
                  onPress={() =>
                    setSetsRepsModal((prev) => ({ ...prev, value: preset }))
                  }
                >
                  <Text style={{ color: "#2563eb", fontWeight: "bold" }}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 8,
                width: "100%",
                fontSize: 16,
                marginBottom: 16,
              }}
              value={setsRepsModal.value}
              onChangeText={(v) =>
                setSetsRepsModal((prev) => ({ ...prev, value: v }))
              }
              placeholder="e.g. (10 lbs) x 10 x 3"
              autoFocus
            />
            <View style={{ flexDirection: "row", width: "100%" }}>
              <TouchableOpacity
                style={[
                  styles.copyBtn,
                  { flex: 1, marginHorizontal: 4, backgroundColor: "#3b82f6" },
                ]}
                onPress={() => {
                  // Save sets & reps
                  if (
                    setsRepsModal.groupId &&
                    typeof setsRepsModal.index === "number"
                  ) {
                    handleEditSupersetSetsReps(
                      setsRepsModal.groupId,
                      setsRepsModal.index,
                      setsRepsModal.value
                    );
                  } else if (typeof setsRepsModal.index === "number") {
                    handleEditSetsReps(
                      setsRepsModal.index,
                      setsRepsModal.value
                    );
                  }
                  setSetsRepsModal({
                    visible: false,
                    groupId: null,
                    index: null,
                    value: "",
                  });
                }}
              >
                <Text style={styles.copyBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.copyBtn,
                  { flex: 1, marginHorizontal: 4, backgroundColor: "#ef4444" },
                ]}
                onPress={() =>
                  setSetsRepsModal({
                    visible: false,
                    groupId: null,
                    index: null,
                    value: "",
                  })
                }
              >
                <Text style={styles.copyBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {showFabMenu && (
        <>
          <TouchableWithoutFeedback onPress={() => setShowFabMenu(false)}>
            <BlurView intensity={5} tint="dark" style={styles.fabMenuOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={styles.fabMenuBtn}
              onPress={() => {
                // Your dumbbell action here
                setShowFabMenu(false);
              }}
            >
              <Icon name="dumbbell" size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuBtn}
              onPress={() => {
                // Your stopwatch action here
                setShowFabMenu(false);
              }}
            >
              <Icon name="stopwatch" size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuBtn}
              onPress={() => {
                handleCopyWorkout();
                setShowFabMenu(false);
              }}
            >
              <Icon name="copy" size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuBtn}
              onPress={() => {
                handleClear();
                setShowFabMenu(false);
              }}
            >
              <Icon name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowFabMenu((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    backgroundColor: "white",
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
    paddingVertical: 6, // Add vertical padding for web
    fontSize: 15,
    lineHeight: 15,
    backgroundColor: "#fff",
    color: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    padding: 8,
    paddingTop: 8,
    marginBottom: 5,
    marginTop: 5,

    // Remove textAlignVertical for web
    ...(Platform.OS !== "web" && { textAlignVertical: "center" }),
    textAlign: "left",
    height: 32,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    justifyContent: "center",
    marginTop: -3,
    marginLeft: 0,
    marginRight: 0,
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
    marginTop: -3,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
  },
  exerciseScrollContent: {
    paddingBottom: 80,
  },
  copyBtn: {
    backgroundColor: "#3b82f6",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  copyBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  presetsSection: {},
  presetsCategoryButton: {
    backgroundColor: "#1a73e8",
  },
  presetsCategoryText: {
    color: "white",
    fontWeight: "700",
  },
  presetButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  presetButtonText: {
    fontSize: 15,
    color: "#333",
  },
  setsRepsBtn: {
    backgroundColor: "#e6f0ff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 2,
    marginBottom: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  dumbbellBtn: {
    backgroundColor: "#3b82f6", // match the + button color
    borderRadius: 15, // match the + button radius
    width: 32, // match the + button size
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 0,
    marginLeft: 5,
    marginTop: 2,
    marginBottom: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 100,
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: -2,
  },
  fabMenu: {
    position: "absolute",
    right: 24,
    bottom: 100,
    flexDirection: "column",
    alignItems: "flex-end",
    zIndex: 101,
  },
  fabMenuBtn: {
    backgroundColor: "#e6f0ff",
    borderRadius: 20,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  fabMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  headerBtnOutline: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "transparent",
    borderRadius: 20,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3b82f6",
    marginTop: -3,
    marginLeft: 0,
    marginRight: 0,
  },
  headerBtnOutlineText: {
    color: "#3b82f6",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
  },
});
