import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PokemonDetails {
  name: string;
  image: string;
  type: string;
  height: number;
  weight: number;
  baseExperience: number;
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  abilities: string[];
  moves: string[];
  spriteVariants: {
    front: string;
    back: string;
  };
}

const typeColors: Record<string, string> = {
  electric: "#FFD700",
  normal: "#A8A878",
  fire: "#FF6347",
  water: "#4169E1",
  bug: "#A3D977",
  grass: "#78C850",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  rock: "#B8A038",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
  fighting: "#D64545",
  ghost: "#705898",
};

function getTypeColor(type: string): string {
  return typeColors[type.toLowerCase()] || "#f5f5f5";
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Details() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSprite, setSelectedSprite] = useState<"front" | "back">(
    "front"
  );

  useEffect(() => {
    async function fetchPokemonDetails() {
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${name}`
        );
        const data = await response.json();

        setPokemon({
          name: data.name,
          image:
            data.sprites.front_default ||
            data.sprites.other["official-artwork"].front_default,
          type: data.types[0].type.name,
          height: data.height,
          weight: data.weight,
          baseExperience: data.base_experience,
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          spAtk: data.stats[3].base_stat,
          spDef: data.stats[4].base_stat,
          speed: data.stats[5].base_stat,
          abilities: data.abilities.map((a: any) => a.ability.name),
          moves: data.moves.slice(0, 10).map((m: any) => m.move.name),
          spriteVariants: {
            front: data.sprites.front_default || "",
            back: data.sprites.back_default || "",
          },
        });
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }

    if (name) {
      fetchPokemonDetails();
    }
  }, [name]);

  if (loading || !pokemon) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pokemon.name}</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
        }}
      >
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: hexToRgba(getTypeColor(pokemon.type), 0.2),
            },
          ]}
        >
          <Image
            source={{ uri: pokemon.spriteVariants[selectedSprite] }}
            style={styles.pokemonImage}
          />
          <Text style={styles.pokemonName}>{pokemon.name}</Text>
          <Text style={styles.pokemonType}>{pokemon.type}</Text>

          {/* Sprite Variant Selector */}
          <View style={styles.spriteSelector}>
            {["front", "back"].map((sprite) => {
              const spriteUrl =
                pokemon.spriteVariants[
                  sprite as keyof typeof pokemon.spriteVariants
                ];
              return (
                <TouchableOpacity
                  key={sprite}
                  style={[
                    styles.spriteOption,
                    selectedSprite === sprite && styles.spriteOptionSelected,
                  ]}
                  onPress={() => setSelectedSprite(sprite as "front" | "back")}
                >
                  {spriteUrl ? (
                    <Image
                      source={{ uri: spriteUrl }}
                      style={styles.spriteImage}
                    />
                  ) : (
                    <Text style={styles.spriteLabel}>N/A</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Height"
            value={`${(pokemon.height / 10).toFixed(1)} m`}
          />
          <StatCard
            label="Weight"
            value={`${(pokemon.weight / 10).toFixed(1)} kg`}
          />
          <StatCard label="Base Exp" value={pokemon.baseExperience} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Stats</Text>
          <StatBar label="HP" value={pokemon.hp} color="#FF6B6B" />
          <StatBar label="Attack" value={pokemon.attack} color="#FFA94D" />
          <StatBar label="Defense" value={pokemon.defense} color="#74C0FC" />
          <StatBar label="Sp. Atk" value={pokemon.spAtk} color="#B197FC" />
          <StatBar label="Sp. Def" value={pokemon.spDef} color="#69DB7C" />
          <StatBar label="Speed" value={pokemon.speed} color="#FFD43B" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abilities</Text>
          <View style={styles.abilitiesContainer}>
            {pokemon.abilities.map((ability, index) => (
              <View key={index} style={styles.abilityTag}>
                <Text style={styles.abilityText}>{ability}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moves</Text>
          <View style={styles.movesContainer}>
            {pokemon.moves.map((move, index) => (
              <View key={index} style={styles.moveTag}>
                <Text style={styles.moveText}>{move}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const maxStat = 150;
  const percentage = (value / maxStat) * 100;

  return (
    <View style={styles.statBarContainer}>
      <Text style={styles.statBarLabel}>{label}</Text>
      <View style={styles.statBarBackground}>
        <View
          style={[
            styles.statBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.statBarValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeader: {
    backgroundColor: "#4169E1",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    color: "#fff",
    textTransform: "capitalize",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mainCard: {
    alignItems: "center",
    paddingVertical: 30,
    borderRadius: 12,
    marginBottom: 20,
  },
  pokemonImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  pokemonName: {
    fontSize: 28,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 8,
  },
  pokemonType: {
    fontSize: 16,
    textTransform: "capitalize",
    color: "#666",
  },
  spriteSelector: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
    justifyContent: "center",
  },
  spriteOption: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  spriteOptionSelected: {
    borderColor: "#4169E1",
    backgroundColor: "#E7F5FF",
  },
  spriteImage: {
    width: 50,
    height: 50,
  },
  spriteLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#999",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statBarContainer: {
    marginBottom: 12,
  },
  statBarLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  statBarBackground: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  statBarFill: {
    height: "100%",
  },
  statBarValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  abilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  abilityTag: {
    backgroundColor: "#E7F5FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4169E1",
  },
  abilityText: {
    textTransform: "capitalize",
    fontWeight: "600",
    color: "#4169E1",
  },
  movesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moveTag: {
    backgroundColor: "#F3E9FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#B197FC",
  },
  moveText: {
    textTransform: "capitalize",
    fontWeight: "600",
    color: "#B197FC",
  },
});
