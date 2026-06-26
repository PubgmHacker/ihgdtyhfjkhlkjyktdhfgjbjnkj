using Godot;
using System.Collections.Generic;

namespace MegabonkClone.Effects;

/// <summary>
/// GPU-based particle system. Uses Godot 4 GPUParticles3D for
/// high-quality visual effects: enemy death bursts, XP collect trails,
/// dash afterimages, level-up sparkles, and boss death explosions.
///
/// Singleton autoload.
/// </summary>
public partial class ParticleManager : Node
{
    public static ParticleManager Instance { get; private set; } = null!;

    // Scene cache
    private PackedScene? _deathBurstScene;
    private PackedScene? _xpTrailScene;
    private PackedScene? _dashTrailScene;
    private PackedScene? _levelUpScene;
    private PackedScene? _bossDeathScene;
    private PackedScene? _hitBurstScene;
    private PackedScene? _waveStartScene;

    public override void _Ready()
    {
        Instance = this;
        GD.Print("[ParticleManager] Initialized.");

        BuildDeathBurst();
        BuildXpTrail();
        BuildDashTrail();
        BuildLevelUp();
        BuildBossDeath();
        BuildHitBurst();
        BuildWaveStart();
    }

    // ============================================================
    //  PUBLIC API
    // ============================================================

    public void SpawnDeathBurst(Vector3 position, EnemyDeathColor color)
    {
        SpawnOneShot(_deathBurstScene, position, GetDeathColor(color));
    }

    public void SpawnBossDeath(Vector3 position)
    {
        SpawnOneShot(_bossDeathScene, position);
    }

    public void SpawnXpCollect(Vector3 position)
    {
        SpawnOneShot(_xpTrailScene, position);
    }

    public void SpawnGoldCollect(Vector3 position)
    {
        SpawnOneShot(_xpTrailScene, position, new Color(1f, 0.85f, 0.3f));
    }

    public void SpawnDashTrail(Vector3 position)
    {
        SpawnOneShot(_dashTrailScene, position);
    }

    public void SpawnLevelUp(Vector3 position)
    {
        SpawnOneShot(_levelUpScene, position);
    }

    public void SpawnHitBurst(Vector3 position)
    {
        SpawnOneShot(_hitBurstScene, position);
    }

    public void SpawnWaveStart(Vector3 position)
    {
        SpawnOneShot(_waveStartScene, position);
    }

    // ============================================================
    //  SCENE BUILDERS
    // ============================================================

    private void BuildDeathBurst()
    {
        _deathBurstScene = BuildParticleScene("DeathBurst", 28, 0.55f, out var mat);
        mat.Spread = 90f;
        mat.Gravity = new Vector3(0f, -5f, 0f);
        mat.InitialVelocity = new Vector2(3f, 8f);
        mat.Scale = new Vector2(0.08f, 0.25f);
        mat.Damping = new Vector2(0.6f, 1.2f);
        mat.ColorRamp = MakeGradientTexture(new Color(1f, 0.3f, 0.2f, 1f), new Color(0.5f, 0.1f, 0f, 0f));
    }

    private void BuildXpTrail()
    {
        _xpTrailScene = BuildParticleScene("XpTrail", 16, 0.5f, out var mat);
        mat.Direction = new Vector3(0f, 1f, 0f);
        mat.Spread = 30f;
        mat.Gravity = new Vector3(0f, 8f, 0f);
        mat.InitialVelocity = new Vector2(2f, 4f);
        mat.ColorRamp = MakeGradientTexture(new Color(0.4f, 0.8f, 1f, 1f), new Color(0.2f, 0.4f, 1f, 0f));
    }

    private void BuildDashTrail()
    {
        _dashTrailScene = BuildParticleScene("DashTrail", 10, 0.3f, out var mat);
        mat.Direction = new Vector3(0f, 1f, 0f);
        mat.Spread = 25f;
        mat.Gravity = Vector3.Zero;
        mat.InitialVelocity = new Vector2(0.5f, 1.5f);
        mat.Scale = new Vector2(0.3f, 0.8f);
        mat.ColorRamp = MakeGradientTexture(new Color(0.3f, 0.6f, 1f, 0.6f), new Color(0.2f, 0.4f, 1f, 0f));
    }

    private void BuildLevelUp()
    {
        _levelUpScene = BuildParticleScene("LevelUp", 20, 0.7f, out var mat);
        mat.ParticleFlagAlignY = true;
        mat.Gravity = new Vector3(0f, 2f, 0f);
        mat.InitialVelocity = new Vector2(3f, 6f);
        mat.Scale = new Vector2(0.1f, 0.3f);
        mat.ColorRamp = MakeGradientTexture(new Color(1f, 0.95f, 0.5f, 1f), new Color(1f, 0.7f, 0.2f, 0f));
    }

    private void BuildBossDeath()
    {
        _bossDeathScene = BuildParticleScene("BossDeath", 40, 0.9f, out var mat);
        mat.Gravity = Vector3.Zero;
        mat.Damping = new Vector2(0.5f, 1.5f);
        mat.InitialVelocity = new Vector2(5f, 12f);
        mat.Scale = new Vector2(0.2f, 0.6f);
        mat.ColorRamp = MakeGradientTexture(new Color(1f, 0.5f, 0.1f, 1f), new Color(1f, 0.2f, 0f, 0f));
    }

    private void BuildHitBurst()
    {
        _hitBurstScene = BuildParticleScene("HitBurst", 16, 0.35f, out var mat);
        mat.Spread = 120f;
        mat.Gravity = Vector3.Zero;
        mat.InitialVelocity = new Vector2(3f, 6f);
        mat.Scale = new Vector2(0.05f, 0.15f);
        mat.ColorRamp = MakeGradientTexture(new Color(1f, 0.3f, 0.2f, 1f), new Color(0.8f, 0.1f, 0f, 0f));
    }

    private void BuildWaveStart()
    {
        _waveStartScene = BuildParticleScene("WaveStart", 24, 0.8f, out var mat);
        mat.ParticleFlagAlignY = true;
        mat.Gravity = Vector3.Zero;
        mat.Damping = new Vector2(0.8f, 1.2f);
        mat.InitialVelocity = new Vector2(4f, 8f);
        mat.Scale = new Vector2(0.1f, 0.25f);
        mat.ColorRamp = MakeGradientTexture(new Color(0.8f, 0.6f, 1f, 0.8f), new Color(0.5f, 0.3f, 0.8f, 0f));
    }

    // ============================================================
    //  FACTORY HELPERS
    // ============================================================

    private PackedScene BuildParticleScene(string name, int amount, float lifetime, out ParticleProcessMaterial mat)
    {
        mat = new ParticleProcessMaterial
        {
            EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Sphere,
            EmissionSphereRadius = 0.3f,
        };

        var quadMesh = new QuadMesh { Size = new Vector2(0.4f, 0.4f) };

        var particles = new GpuParticles3D
        {
            Name = name,
            Amount = amount,
            Lifetime = lifetime,
            OneShot = true,
            Explosiveness = 0.8f,
            Randomness = 0.3f,
            LocalCoords = false,
            ProcessMaterial = mat,
            DrawPasses = 1,
            DrawPass1 = quadMesh,
        };

        var root = new Node3D { Name = name };
        root.AddChild(particles);

        var scene = new PackedScene();
        scene.Pack(root);
        return scene;
    }

    private static GradientTexture1D MakeGradientTexture(Color from, Color to)
    {
        var gradient = new Gradient();
        gradient.AddPoint(0f, from);
        gradient.AddPoint(1f, to);
        return new GradientTexture1D { Gradient = gradient, Width = 64 };
    }

    private void SpawnOneShot(PackedScene? scene, Vector3 position)
    {
        if (scene == null) return;
        var node = scene.Instantiate<Node3D>();
        node.GlobalPosition = position;
        AddChild(node);
        ScheduleCleanup(node);
    }

    private void SpawnOneShot(PackedScene? scene, Vector3 position, Color tint)
    {
        if (scene == null) return;
        var node = scene.Instantiate<Node3D>();
        node.GlobalPosition = position;

        if (node.GetChild(0) is GpuParticles3D gpu && gpu.ProcessMaterial is ParticleProcessMaterial mat)
        {
            mat.ColorRamp = MakeGradientTexture(tint, new Color(tint.R, tint.G, tint.B, 0f));
        }

        AddChild(node);
        ScheduleCleanup(node);
    }

    private void ScheduleCleanup(Node3D node)
    {
        if (node.GetChild(0) is GpuParticles3D gpu)
        {
            void Cleanup()
            {
                if (IsInstanceValid(node))
                    node.QueueFree();
            }
            gpu.Finished += Cleanup;
            GetTree().CreateTimer(gpu.Lifetime + 1.0f).Timeout += Cleanup;
        }
    }

    private static Color GetDeathColor(EnemyDeathColor c) => c switch
    {
        EnemyDeathColor.Red => new Color(1f, 0.3f, 0.2f),
        EnemyDeathColor.Green => new Color(0.3f, 0.9f, 0.3f),
        EnemyDeathColor.Grey => new Color(0.6f, 0.6f, 0.65f),
        EnemyDeathColor.Purple => new Color(0.7f, 0.3f, 0.9f),
        EnemyDeathColor.Gold => new Color(1f, 0.85f, 0.2f),
        _ => Colors.White,
    };
}
