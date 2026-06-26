using Godot;
using MegabonkClone.Core;
using System;
using System.Collections.Generic;

namespace MegabonkClone.Generation;

/// <summary>
/// Procedural arena generator. Creates a multi-biome tiled floor with
/// PBR materials, boundary walls, and decoration meshes.
///
/// The arena is a flat grid on the XZ plane. Each tile is a subdivided
/// quad with a biome-specific StandardMaterial3D. Walls extrude upward
/// at the arena edges. Decorations are low-poly spheres/boxes scattered
/// on floor tiles per biome density.
///
/// Usage: call <see cref="Generate"/> once at run start.
/// </summary>
public partial class LevelGenerator : Node3D
{
    [ExportGroup("Arena")]
    [Export] public int GridSize = 60;               // tiles per side
    [Export] public float TileSize = 2f;              // world units per tile
    [Export] public float WallHeight = 3f;
    [Export] public float WallThickness = 0.5f;
    [Export] public int Seed = 42;

    [ExportGroup("Biomes")]
    [Export] public Godot.Collections.Array<BiomeDef> Biomes = new();

    [ExportGroup("Performance")]
    [Export] public bool UseMeshMerging = true;
    [Export] public int MeshMergeBatchSize = 20;     // tiles per InstancedMesh

    /// <summary>Half-extent of the arena in world units.</summary>
    public float WorldRadius => GridSize * TileSize * 0.5f;

    /// <summary>Center of the arena.</summary>
    public Vector3 CenterWorld => Vector3.Zero;

    // --- Internal state ---
    private Node3D _floorRoot = null!;
    private Node3D _wallRoot = null!;
    private Node3D _decoRoot = null!;
    private Node3D _interactiveRoot = null!;
    private readonly List<BiomeDef> _biomeList = new();
    private FastNoiseLite _noise = null!;
    private FastNoiseLite _decoNoise = null!;
    private System.Random _rng = null!;

    // --- Interactive entities ---
    private PackedScene? _potPrefab;
    private PackedScene? _bossGatePrefab;
    private bool _interactablesSpawned;

    // Shared meshes/materials (built once)
    private Mesh _floorMesh = null!;
    private Mesh _wallMesh = null!;
    private Mesh _decoSphereMesh = null!;
    private Mesh _decoBoxMesh = null!;
    private readonly Dictionary<int, StandardMaterial3D> _floorMats = new();
    private readonly Dictionary<int, StandardMaterial3D> _floorAltMats = new();
    private readonly Dictionary<int, StandardMaterial3D> _wallMats = new();
    private readonly Dictionary<int, StandardMaterial3D> _decoMats = new();

    public override void _Ready()
    {
        // Ensure defaults.
        if (Biomes.Count == 0)
        {
            GD.Print("[LevelGenerator] No biomes assigned — creating default grassland biome.");
            Biomes.Add(CreateDefaultBiome());
        }

        _biomeList.Clear();
        _biomeList.AddRange(Biomes);

        _noise = new FastNoiseLite
        {
            NoiseType = FastNoiseLite.NoiseTypeEnum.Simplex,
            FractalOctaves = 4,
            Frequency = 0.04f,
            Seed = Seed,
        };

        _decoNoise = new FastNoiseLite
        {
            NoiseType = FastNoiseLite.NoiseTypeEnum.Simplex,
            FractalOctaves = 2,
            Frequency = 0.15f,
            Seed = Seed + 999,
        };

        _rng = new System.Random(Seed);

        // Build shared geometry.
        _floorMesh = BuildFloorMesh();
        _wallMesh = BuildWallMesh();
        _decoSphereMesh = new SphereMesh { Radius = 0.5f, Height = 1f, RadialSegments = 6, Rings = 4 };
        _decoBoxMesh = new BoxMesh { Size = new Vector3(1f, 1f, 1f) };

        // Build materials per biome.
        for (int i = 0; i < _biomeList.Count; i++)
        {
            var b = _biomeList[i];
            _floorMats[i] = MakePBRMat(b.FloorColor, b.Roughness, b.Metallic);
            _floorAltMats[i] = MakePBRMat(b.FloorColorAlt, b.Roughness, b.Metallic);
            _wallMats[i] = MakePBRMat(b.WallColor, b.Roughness * 0.6f, b.Metallic * 0.5f);
            _decoMats[i] = MakePBRMat(b.DecoColor1, 0.9f, 0f);
        }

        // Root containers.
        _floorRoot = new Node3D { Name = "FloorTiles" };
        _wallRoot = new Node3D { Name = "Walls" };
        _decoRoot = new Node3D { Name = "Decorations" };
        _interactiveRoot = new Node3D { Name = "Interactables" };
        AddChild(_floorRoot);
        AddChild(_wallRoot);
        AddChild(_decoRoot);
        AddChild(_interactiveRoot);

        Generate();
        SpawnInteractables();
    }

    /// <summary>Generates the full arena.</summary>
    public void Generate()
    {
        ClearArena();
        GenerateFloor();
        GenerateWalls();
        GenerateDecorations();

        // Add a soft directional light + ambient for the arena.
        if (!HasNode("ArenaLight"))
        {
            var dirLight = new DirectionalLight3D
            {
                Name = "ArenaLight",
                RotationDegrees = new Vector3(45f, 30f, 0f),
                ShadowEnabled = true,
                DirectionalShadowMaxDistance = 80f,
                DirectionalShadowSplit1 = 0.2f,
                DirectionalShadowSplit2 = 0.5f,
                DirectionalShadowSplit3 = 0.8f,
            };
            AddChild(dirLight);

            var worldEnv = new WorldEnvironment
            {
                Name = "WorldEnvironment",
                Environment = new Godot.Environment
                {
                    BackgroundMode = Godot.Environment.BGMode.Color,
                    BackgroundColor = new Color(0.12f, 0.14f, 0.18f),
                    AmbientLightSource = Godot.Environment.AmbientSource.Color,
                    AmbientLightColor = new Color(0.3f, 0.32f, 0.38f),
                    AmbientLightEnergy = 0.5f,
                    FogEnabled = true,
                    FogLightColor = new Color(0.12f, 0.14f, 0.18f),
                    FogDepthCurve = 1.0f,
                },
            };
            AddChild(worldEnv);
        }

        GD.Print($"[LevelGenerator] Arena generated: {GridSize}x{GridSize} tiles, " +
                 $"{WorldRadius:F1}m radius, {_biomeList.Count} biomes.");
    }

    /// <summary>Clears all generated meshes for regeneration.</summary>
    public void ClearArena()
    {
        foreach (var child in _floorRoot.GetChildren()) child.QueueFree();
        foreach (var child in _wallRoot.GetChildren()) child.QueueFree();
        foreach (var child in _decoRoot.GetChildren()) child.QueueFree();
    }

    // --- Floor generation ---
    private void GenerateFloor()
    {
        float half = WorldRadius;
        float ts = TileSize;

        for (int gx = 0; gx < GridSize; gx++)
        {
            for (int gz = 0; gz < GridSize; gz++)
            {
                float wx = gx * ts - half + ts * 0.5f;
                float wz = gz * ts - half + ts * 0.5f;

                // Determine biome via noise.
                int biomeIdx = GetBiomeIndex(wx, wz);

                // Checkerboard variation.
                bool isAlt = (gx + gz) % 2 == 0;
                var mat = isAlt ? _floorAltMats[biomeIdx] : _floorMats[biomeIdx];

                var meshInst = new MeshInstance3D
                {
                    Mesh = _floorMesh,
                    MaterialOverride = mat,
                    Position = new Vector3(wx, 0f, wz),
                };
                _floorRoot.AddChild(meshInst);
            }
        }
    }

    // --- Wall generation ---
    private void GenerateWalls()
    {
        float half = WorldRadius;
        float wh = WallHeight;
        float wt = WallThickness;

        // Determine dominant edge biome.
        int edgeBiome = _biomeList.Count > 1 ? 1 : 0;
        var wallMat = _wallMats[edgeBiome];

        // North wall (Z = -half)
        CreateWallSegment(new Vector3(0f, wh * 0.5f, -half - wt * 0.5f),
            new Vector3(half * 2f + wt * 2f, wh, wt), wallMat);
        // South wall (Z = +half)
        CreateWallSegment(new Vector3(0f, wh * 0.5f, half + wt * 0.5f),
            new Vector3(half * 2f + wt * 2f, wh, wt), wallMat);
        // West wall (X = -half)
        CreateWallSegment(new Vector3(-half - wt * 0.5f, wh * 0.5f, 0f),
            new Vector3(wt, wh, half * 2f), wallMat);
        // East wall (X = +half)
        CreateWallSegment(new Vector3(half + wt * 0.5f, wh * 0.5f, 0f),
            new Vector3(wt, wh, half * 2f), wallMat);

        // Corner pillars for visual emphasis.
        float pillarSize = wt * 3f;
        var corners = new[]
        {
            new Vector3(-half, wh * 0.5f, -half),
            new Vector3(-half, wh * 0.5f, half),
            new Vector3(half, wh * 0.5f, -half),
            new Vector3(half, wh * 0.5f, half),
        };
        foreach (var c in corners)
        {
            CreateWallSegment(c, new Vector3(pillarSize, wh * 1.3f, pillarSize), wallMat);
        }

        // Add StaticBody3D walls for physics.
        if (!HasNode("WallCollider"))
        {
            var colBody = new StaticBody3D { Name = "WallCollider" };
            // North
            colBody.AddChild(CreateWallShape(new Vector3(0f, wh * 0.5f, -half), new Vector3(half * 2f, wh, 0.1f)));
            // South
            colBody.AddChild(CreateWallShape(new Vector3(0f, wh * 0.5f, half), new Vector3(half * 2f, wh, 0.1f)));
            // West
            colBody.AddChild(CreateWallShape(new Vector3(-half, wh * 0.5f, 0f), new Vector3(0.1f, wh, half * 2f)));
            // East
            colBody.AddChild(CreateWallShape(new Vector3(half, wh * 0.5f, 0f), new Vector3(0.1f, wh, half * 2f)));
            AddChild(colBody);
        }
    }

    // --- Decoration generation ---
    private void GenerateDecorations()
    {
        float half = WorldRadius;
        float ts = TileSize;

        for (int gx = 2; gx < GridSize - 2; gx++)
        {
            for (int gz = 2; gz < GridSize - 2; gz++)
            {
                float wx = gx * ts - half + ts * 0.5f;
                float wz = gz * ts - half + ts * 0.5f;

                int biomeIdx = GetBiomeIndex(wx, wz);
                var biome = _biomeList[biomeIdx];

                // Noise-based density check.
                float decoVal = _decoNoise.GetNoise2D(wx, wz);
                float threshold = 1f - biome.DecoDensity * 2f;
                if (decoVal < threshold) continue;

                float scale = (float)_rng.NextDouble() * (biome.DecoScaleMax - biome.DecoScaleMin) + biome.DecoScaleMin;
                Mesh mesh = _rng.NextDouble() > 0.5f ? _decoSphereMesh : _decoBoxMesh;
                bool useAlt = _rng.NextDouble() > 0.5f;
                var mat = useAlt ? _decoMats[biomeIdx] : MakePBRMat(biome.DecoColor2, 0.9f, 0f);

                var inst = new MeshInstance3D
                {
                    Mesh = mesh,
                    MaterialOverride = mat,
                    Position = new Vector3(
                        wx + (float)(_rng.NextDouble() - 0.5) * ts * 0.4f,
                        scale * 0.3f,
                        wz + (float)(_rng.NextDouble() - 0.5) * ts * 0.4f
                    ),
                    Scale = Vector3.One * scale,
                };
                _decoRoot.AddChild(inst);
            }
        }
    }

    // --- Helpers ---

    private void SpawnInteractables()
    {
        if (_interactablesSpawned) return;
        _interactablesSpawned = true;

        _potPrefab ??= GD.Load<PackedScene>("res://Scenes/Entities/BreakablePot.tscn");
        _bossGatePrefab ??= GD.Load<PackedScene>("res://Scenes/Entities/BossGate.tscn");

        if (_potPrefab != null)
        {
            int potCount = Mathf.Max(15, GridSize / 3);
            for (int i = 0; i < potCount; i++)
            {
                // Random position well within bounds
                float x = (float)(_rng.NextDouble() * 2 - 1) * (WorldRadius - 4f);
                float z = (float)(_rng.NextDouble() * 2 - 1) * (WorldRadius - 4f);
                // Avoid the center (player spawn)
                if (Mathf.Abs(x) < 5f && Mathf.Abs(z) < 5f) continue;

                var pot = _potPrefab.Instantiate<Node3D>();
                pot.GlobalPosition = new Vector3(x, 0f, z);
                pot.Scale = Vector3.One * (0.8f + (float)_rng.NextDouble() * 0.5f);
                _interactiveRoot.AddChild(pot);
            }
        }

        // Boss gates — 2-3 around the map at strategic positions
        if (_bossGatePrefab != null)
        {
            int gateCount = 3;
            for (int i = 0; i < gateCount; i++)
            {
                float angle = i * Mathf.Tau / gateCount + 0.5f;
                float dist = WorldRadius * 0.6f;
                float x = Mathf.Cos(angle) * dist;
                float z = Mathf.Sin(angle) * dist;

                var gate = _bossGatePrefab.Instantiate<Node3D>();
                gate.GlobalPosition = new Vector3(x, 0f, z);
                _interactiveRoot.AddChild(gate);
            }
        }

        GD.Print($"[LevelGenerator] Spawned interactables: pots + {3} boss gates.");
    }

    private int GetBiomeIndex(float x, float z)
    {
        if (_biomeList.Count <= 1) return 0;
        float val = (_noise.GetNoise2D(x, z) + 1f) * 0.5f; // 0..1
        return Mathf.Clamp(Mathf.FloorToInt(val * _biomeList.Count), 0, _biomeList.Count - 1);
    }

    private void CreateWallSegment(Vector3 pos, Vector3 size, Material mat)
    {
        var mesh = new MeshInstance3D
        {
            Mesh = new BoxMesh { Size = size },
            MaterialOverride = mat,
            Position = pos,
        };
        _wallRoot.AddChild(mesh);
    }

    private static CollisionShape3D CreateWallShape(Vector3 pos, Vector3 halfExtents)
    {
        return new CollisionShape3D
        {
            Position = pos,
            Shape = new BoxShape3D { Size = halfExtents },
        };
    }

    private static Mesh BuildFloorMesh()
    {
        return new PlaneMesh
        {
            Size = new Vector2(1f, 1f),
            Orientation = PlaneMesh.OrientationEnum.Y,
        };
    }

    private static Mesh BuildWallMesh()
    {
        return new BoxMesh { Size = Vector3.One };
    }

    private static StandardMaterial3D MakePBRMat(Color albedo, float roughness, float metallic)
    {
        return new StandardMaterial3D
        {
            AlbedoColor = albedo,
            Roughness = roughness,
            Metallic = metallic,
            NormalScale = 0.5f,
        };
    }

    private static BiomeDef CreateDefaultBiome()
    {
        return new BiomeDef
        {
            BiomeName = "Grassland",
            FloorColor = new Color(0.22f, 0.38f, 0.18f),
            FloorColorAlt = new Color(0.26f, 0.42f, 0.20f),
            WallColor = new Color(0.35f, 0.30f, 0.25f),
            WallTopColor = new Color(0.45f, 0.40f, 0.32f),
            DecoColor1 = new Color(0.15f, 0.50f, 0.15f),
            DecoColor2 = new Color(0.10f, 0.35f, 0.12f),
            Roughness = 0.85f,
            Metallic = 0.0f,
            DecoDensity = 0.12f,
            DecoScaleMin = 0.15f,
            DecoScaleMax = 0.4f,
        };
    }

    /// <summary>Converts flat 2D coordinates to a 3D spawn position on the arena floor.</summary>
    public Vector3 GetSpawnPosition3D(Vector2 flatCoords)
    {
        return new Vector3(flatCoords.X, 0f, flatCoords.Y);
    }

    /// <summary>Checks if a world position is within the arena bounds.</summary>
    public bool IsInBounds(Vector3 worldPos)
    {
        float half = WorldRadius - TileSize;
        return Mathf.Abs(worldPos.X) < half && Mathf.Abs(worldPos.Z) < half;
    }

    /// <summary>Clamps a world position to stay inside the arena.</summary>
    public Vector3 ClampToBounds(Vector3 worldPos)
    {
        float half = WorldRadius - TileSize * 0.5f;
        return new Vector3(
            Mathf.Clamp(worldPos.X, -half, half),
            worldPos.Y,
            Mathf.Clamp(worldPos.Z, -half, half)
        );
    }
}
