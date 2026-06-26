using Godot;
using MegabonkClone.Core;
using MegabonkClone.Effects;
using MegabonkClone.Systems;

namespace MegabonkClone.Entities;

/// <summary>
/// Breakable pot (blue-silver jar). Spawns on the map as interactive decor.
/// Drops XP, gold, and has a chance to drop a rare Silver Coin.
/// Damaged by weapons (via Area3D overlap) or player contact.
/// </summary>
public partial class BreakablePot : StaticBody3D
{
    [ExportGroup("Visual")]
    [Export] public MeshInstance3D? PotMesh;
    [Export] public StandardMaterial3D? BaseMaterial;
    [Export] public StandardMaterial3D? HitMaterial;

    [ExportGroup("Loot")]
    [Export] public int XPDrop = 3;
    [Export] public int GoldDrop = 1;
    [Export] public int SilverCoinChance = 8; // percent (1-100)
    [Export] public int GoldChance = 50;

    [ExportGroup("Stats")]
    [Export] public float MaxHealth = 15f;

    private float _currentHealth;
    private float _flashTimer;
    private const float FlashDuration = 0.1f;
    private bool _broken;

    // Scene caches
    public static PackedScene? SilverCoinScene { get; private set; }

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
        _broken = false;
        AddToGroup("breakable");
        CollisionLayer = 8u;   // layer 4
        CollisionMask = 4u;    // monitor layer 3 (player projectiles)

        SilverCoinScene ??= GD.Load<PackedScene>("res://Scenes/Entities/SilverCoin.tscn");

        // Also allow player contact to break pots
        var area = new Area3D { Name = "BreakArea" };
        var shape = new CollisionShape3D
        {
            Shape = new SphereShape3D { Radius = 1.2f },
            Position = new Vector3(0, 0.5f, 0),
        };
        area.AddChild(shape);
        area.CollisionLayer = 0u;
        area.CollisionMask = 1u; // player
        area.BodyEntered += OnBodyEntered;
        AddChild(area);
    }

    public override void _Process(double delta)
    {
        if (_flashTimer > 0f)
        {
            _flashTimer -= (float)delta;
            if (_flashTimer <= 0f && PotMesh != null && BaseMaterial != null)
                PotMesh.MaterialOverride = BaseMaterial;
        }
    }

    public void TakeDamage(float amount)
    {
        if (_broken) return;

        _currentHealth -= amount;

        // Flash
        if (PotMesh != null && HitMaterial != null)
        {
            PotMesh.MaterialOverride = HitMaterial;
            _flashTimer = FlashDuration;
        }

        AudioManager.Instance?.PlaySfx(SfxKind.Hit, pitch: 1.5f, volumeDb: -10f);

        if (_currentHealth <= 0f)
            Break();
    }

    private void OnBodyEntered(Node body)
    {
        if (_broken) return;
        if (body is Player)
        {
            // Player breaks pots on contact
            TakeDamage(MaxHealth);
        }
    }

    private void Break()
    {
        _broken = true;

        // VFX
        VFXManager.Instance?.EnemyDeath(GlobalPosition, EnemyDeathColor.Purple);
        ScreenShake.Instance?.SmallHit();
        AudioManager.Instance?.PlaySfx(SfxKind.EnemyDeath, pitch: 1.3f, volumeDb: -8f);

        // Spawn loot
        SpawnLoot();

        // Hide and schedule cleanup
        Visible = false;
        ProcessMode = ProcessModeEnum.Disabled;
        var cols = FindChildren("*", "CollisionShape3D");
        foreach (var c in cols) ((CollisionShape3D)c).Disabled = true;

        GetTree().CreateTimer(0.5).Timeout += QueueFree;
    }

    private void SpawnLoot()
    {
        var stats = PlayerStats.Instance;

        // XP orb
        if (Player.XPOrbScene != null)
        {
            var xp = ObjectPool.Instance.Spawn<XPOrb>(Player.XPOrbScene,
                GlobalPosition + Vector3.Up, Vector3.Zero);
            xp?.SetValue(XPDrop + Mathf.RoundToInt(stats?.XPGainBonus ?? 0f));
        }

        // Gold by chance (scaled by GoldMultiplier)
        if (GD.RandRange(0, 100) <= GoldChance && Player.GoldOrbScene != null)
        {
            var gold = ObjectPool.Instance.Spawn<GoldOrb>(Player.GoldOrbScene,
                GlobalPosition + Vector3.Up, Vector3.Zero);
            gold?.SetValue(GoldDrop);
        }

        // Silver Coin — rare, boosted by Silver Tome upgrade
        float effectiveSilverChance = SilverCoinChance + (stats?.SilverCoinBonusChance ?? 0f);
        if (GD.RandRange(0, 100) <= effectiveSilverChance && SilverCoinScene != null)
        {
            var silver = ObjectPool.Instance.Spawn<SilverCoin>(SilverCoinScene,
                GlobalPosition + new Vector3(0, 1.5f, 0), Vector3.Zero);
            silver?.SetValue(1);
        }
    }
}
