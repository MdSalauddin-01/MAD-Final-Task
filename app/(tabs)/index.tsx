import SearchBar from "@/components/search-bar";
import StudentDetail from "@/components/student-detail";
import StudentItem from "@/components/student-item";
import { useDebounce } from "@/hooks/use-debounce";
import { Student } from "@/data/students";
import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Text, StyleSheet, View, FlatList, Pressable, ActivityIndicator, TextInput } from "react-native";
import { router } from "expo-router";
import { useStudents } from "../../context/students-context";
import { SafeAreaView } from "react-native-safe-area-context";
import ErrorScreen from "../../components/error-screen";

export default function HomePage() {
    const [query, setQuery] = useState<string>("");
    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<TextInput>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const { students, isLoading, error } = useStudents();
    const [retryKey, setRetryKey] = useState(0);

    const handleRetry = useCallback(() => {
        setRetryKey((k) => k + 1);
    }, []);

    const EmptyList = useCallback(() => {
        if (query.length > 0) {
            return (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>No results</Text>
                    <Text style={styles.emptySub}>No students match "{debouncedQuery}"</Text>
                </View>
            );
        }
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No students yet</Text>
                <Text style={styles.emptySub}>Tap + Add to add the first student</Text>
            </View>
        );
    }, [query, debouncedQuery]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0D9488" />
                <Text style={styles.loadingHint}>Loading students...</Text>
            </View>
        );
    }

    if (error) {
        return <ErrorScreen message={error} onRetry={handleRetry} />;
    }

    const filtered = useMemo(() => {
        return students.filter((s) => s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || s.department.toLowerCase().includes(debouncedQuery.toLowerCase()));
    }, [students, debouncedQuery]);

    const handleSelect = (student: Student) => {
        setSelectedStudent((prev) => (prev?.id === student.id ? null : student));
    };

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.titleBar}>
                <Text style={styles.title}>Student Directory</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push("/(tabs)/add-student")}
                    accessibilityRole="button"
                    accessibilityLabel="Add new student"
                    accessibilityHint="Opens the Add Student form"
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </Pressable>
            </View>

            <SearchBar ref={searchRef} value={query} onChangeText={setQuery} />

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StudentItem student={item} onPress={handleSelect} isSelected={selectedStudent?.id === item.id} />}
                ListEmptyComponent={EmptyList}
            />

            {selectedStudent && <StudentDetail student={selectedStudent} onRemoved={() => setSelectedStudent(null)} />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F0F4F8" },
    titleBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#0D1F4E",
    },
    title: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
    addButton: {
        backgroundColor: "#0D9488",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
    empty: { flex: 1, alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: "#334155", marginBottom: 6 },
    emptySub: { fontSize: 13, color: "#94A3B8", textAlign: "center" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingHint: { marginTop: 12, color: "#64748B", fontSize: 13 },
});