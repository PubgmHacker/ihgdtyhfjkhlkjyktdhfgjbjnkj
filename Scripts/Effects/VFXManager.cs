using Godot;

namespace MegabonkClone.Effects;

/// <summary>
/// Spawns one-shot particle bursts for death, hit, dash, level-up VFX.
/// Uses lightweight MeshInstance3D nodes with tween animation for reliability.
/// Singleton autoload so any system can call it.
/// </summary>
public partial class VFXManager : Node
{
    public static VFXManager Instance { get; private set; } = null!;

    public override void _Ready() => Instance = this;

    /// <summary>Spawns a brief expanding/contracting sphere that fades out.</summary>
    private void SpawnPulse(Vector3 position, Color color, float startScale,
        float endScale, float lifetime)
    {
        var mat = new StandardMaterial3D
        {
            AlbedoColor = color,
            EmissionEnergyMultiplier = 1.5f,
            Emission = color,
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
            NoDepthTest = true,
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
        };

        var mesh = new MeshInstance3D
        {
            GlobalPosition = position,
            Mesh = new SphereMesh { Radius = 0.3f, Height = 0.6f },
            MaterialOverride = mat,
            Scale = Vector3.One * startScale,
        };

        AddChild(mesh);

        var tween = CreateTween();
        tween.SetParallel(true);
        tween.TweenMethod(Callable.From<float>(s => mesh.Scale = Vector3.One * s),
            startScale, endScale, lifetime);
        tween.TweenMethod(Callable.From<float>(a => mat.AlbedoColor = new Color(color.R, color.G, color.B, a)),
            1f, 0f, lifetime);
        tween.Chain();
        tween.TweenCallback(Callable.From(() =>
        {
            if (IsInstanceValid(mesh)) mesh.QueueFree();
        }));

        // Fallback cleanup in case tween fails.
        var timer = GetTree().CreateTimer(lifetime + 0.2f);
        timer.Timeout += () => { if (IsInstanceValid(mesh)) mesh.QueueFree(); };
    }

    /// <summary>Ring pulse: flat expanding torus on the ground.</summary>
    public void SpawnRing(Vector3 position, Color color, float radius, float lifetime)
    {
        var mat = new StandardMaterial3D
        {
            AlbedoColor = color,
            Emission = color,
            EmissionEnergyMultiplier = 2f,
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
            NoDepthTest = true,
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
        };

        var mesh = new MeshInstance3D
        {
            GlobalPosition = position + Vector3.Up * 0.05f,
            Mesh = new SphereMesh { Radius = 0.3f, Height = 0.05f },
            MaterialOverride = mat,
            Scale = Vector3.One * 0.1f,
        };

        AddChild(mesh);

        var tween = CreateTween();
        tween.SetParallel(true);
        tween.TweenMethod(Callable.From<float>(s => mesh.Scale = new Vector3(s, 0.1f, s)),
            0.1f, radius, lifetime);
        tween.TweenMethod(Callable.From<float>(a => mat.AlbedoColor = new Color(color.R, color.G, color.B, a)),
            1f, 0f, lifetime);
        tween.Chain();
        tween.TweenCallback(Callable.From(() =>
        {
            if (IsInstanceValid(mesh)) mesh.QueueFree();
        }));

        var timer = GetTree().CreateTimer(lifetime + 0.2f);
        timer.Timeout += () => { if (IsInstanceValid(mesh)) mesh.QueueFree(); };
    }

    // ---------- Presets ----------

    public void EnemyDeath(Vector3 position, EnemyDeathColor deathColor)
    {
        Color c = deathColor switch
        {
            EnemyDeathColor.Red => new Color(1f, 0.3f, 0.2f),
            EnemyDeathColor.Green => new Color(0.3f, 0.9f, 0.3f),
            EnemyDeathColor.Grey => new Color(0.6f, 0.6f, 0.65f),
            EnemyDeathColor.Purple => new Color(0.7f, 0.3f, 0.9f),
            EnemyDeathColor.Gold => new Color(1f, 0.85f, 0.2f),
            _ => Colors.White,
        };
        SpawnPulse(position, c, startScale: 0.5f, endScale: 2f, lifetime: 0.4f);
        ParticleManager.Instance?.SpawnDeathBurst(position, deathColor);
    }

    public void BossDeath(Vector3 position)
    {
        SpawnPulse(position, new Color(1f, 0.5f, 0.1f), startScale: 1f, endScale: 6f, lifetime: 0.8f);
        SpawnRing(position, new Color(1f, 0.3f, 0.1f), radius: 8f, lifetime: 0.6f);
        SpawnRing(position, new Color(1f, 0.8f, 0.2f), radius: 5f, lifetime: 0.4f);
        ScreenShake.Instance?.BigExplosion();
        ParticleManager.Instance?.SpawnBossDeath(position);
    }

    public void DashTrail(Vector3 position)
    {
        SpawnPulse(position, new Color(0.3f, 0.7f, 1f, 0.6f),
            startScale: 0.3f, endScale: 0.8f, lifetime: 0.25f);
        ParticleManager.Instance?.SpawnDashTrail(position);
    }

    public void LevelUp(Vector3 position)
    {
        SpawnRing(position, new Color(1f, 0.85f, 0.3f), radius: 5f, lifetime: 0.6f);
        SpawnPulse(position + Vector3.Up * 0.5f, new Color(1f, 0.95f, 0.5f),
            startScale: 0.2f, endScale: 1.5f, lifetime: 0.6f);
        SpawnRing(position, new Color(0.9f, 0.7f, 1f), radius: 3.5f, lifetime: 0.7f);
    }

    public void AxeSwing(Vector3 position, Vector3 direction)
    {
        SpawnPulse(position + Vector3.Up, new Color(1f, 0.85f, 0.4f),
            startScale: 0.3f, endScale: 1f, lifetime: 0.2f);
    }

    public void SpawnXpTrail(Vector3 position)
    {
        ParticleManager.Instance?.SpawnXpCollect(position);
    }

    public void SpawnGoldTrail(Vector3 position)
    {
        ParticleManager.Instance?.SpawnGoldCollect(position);
    }

    public void PlayerHit(Vector3 position)
    {
        SpawnPulse(position + Vector3.Up * 0.5f, new Color(1f, 0.2f, 0.2f),
            startScale: 0.4f, endScale: 1.2f, lifetime: 0.25f);
        ParticleManager.Instance?.SpawnHitBurst(position);
    }
}

/// <summary>Color palette for enemy death VFX by archetype.</summary>
public enum EnemyDeathColor
{
    Red,
    Green,
    Grey,
    Purple,
    Gold,
}
