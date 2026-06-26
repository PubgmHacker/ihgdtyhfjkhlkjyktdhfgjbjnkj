using Godot;
using MegabonkClone.Core;
using MegabonkClone.Data;
using MegabonkClone.Entities;
using MegabonkClone.Systems;

namespace MegabonkClone.Weapons;

/// <summary>
/// Base class for all auto-firing weapons. Handles cooldown timing and
/// damage scaling from PlayerStats; subclasses implement <see cref="Fire"/>.
///
/// A weapon is owned by the player's WeaponManager node and fires entirely
/// automatically — the player never presses an attack button. If a
/// <see cref="WeaponDef"/> is assigned it overrides the code defaults.
/// </summary>
public abstract partial class WeaponBase : Node
{
    /// <summary>Optional design-time def. If null, code defaults are used.</summary>
    [Export] public WeaponDef? Def;

    // ---------------- Code defaults (used when no Def is assigned) ----------------
    /// <summary>Subclasses set these in _Ready if no Def.</summary>
    protected float DefaultDamage = 10f;
    protected float DefaultCooldown = 1f;
    protected int DefaultProjectileCount = 1;
    protected float DefaultRange = 6f;
    protected float DefaultKnockback = 4f;
    protected float DefaultProjectileSpeed = 12f;
    protected float DefaultLifetime = 3f;

    /// <summary>0 = locked, 1+ = current level. Weapons only fire at level &gt;= 1.</summary>
    public int Level { get; private set; }

    // Scaled runtime stats (grow with level)
    protected float ScaledDamage;
    protected float ScaledCooldown;
    protected int ScaledProjectileCount;
    protected float ScaledRange;
    protected float ScaledKnockback;
    protected float ScaledProjectileSpeed;
    protected float ScaledLifetime;
    protected PackedScene? ProjectileScene;

    private float _cooldownLeft;
    private bool _initialized;

    public override void _Ready()
    {
        LoadDefOrDefaults();
        ApplyLevelScaling();
        // Stagger first shots so weapons don't all fire on frame 0.
        _cooldownLeft = (float)GD.RandRange(0d, ScaledCooldown);
        _initialized = true;
    }

    /// <summary>Loads values from Def if present, otherwise keeps code defaults.</summary>
    private void LoadDefOrDefaults()
    {
        if (Def == null) return;
        DefaultDamage = Def.BaseDamage;
        DefaultCooldown = Def.BaseCooldown;
        DefaultProjectileCount = Def.ProjectileCount;
        DefaultRange = Def.Range;
        DefaultKnockback = Def.Knockback;
        DefaultProjectileSpeed = Def.ProjectileSpeed;
        DefaultLifetime = Def.Lifetime;
        ProjectileScene = Def.ProjectileScene;
    }

    /// <summary>Unlock or level up this weapon by one level.</summary>
    public void LevelUp()
    {
        Level++;
        if (_initialized) ApplyLevelScaling();
    }

    /// <summary>Force a specific level (used for character starting weapons).</summary>
    public void SetLevel(int level)
    {
        Level = level;
        if (_initialized) ApplyLevelScaling();
    }

    protected virtual void ApplyLevelScaling()
    {
        // Each level: +20% damage, -8% cooldown (min 30%), +1 projectile every 2 levels.
        ScaledDamage = DefaultDamage * (1f + 0.2f * (Level - 1));
        ScaledCooldown = DefaultCooldown * Mathf.Max(0.3f, 1f - 0.08f * (Level - 1));
        ScaledProjectileCount = DefaultProjectileCount + Mathf.FloorToInt((Level - 1) / 2f);
        ScaledRange = DefaultRange * (1f + 0.05f * (Level - 1));
        ScaledKnockback = DefaultKnockback;
        ScaledProjectileSpeed = DefaultProjectileSpeed;
        ScaledLifetime = DefaultLifetime;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (Level < 1) return;
        if (GameManager.Instance.IsPaused) return;

        float effCooldown = ScaledCooldown / (1f + PlayerStats.Instance.AttackSpeedBonus / 100f);
        effCooldown *= (1f - Mathf.Clamp(PlayerStats.Instance.CooldownReduction / 100f, 0f, 0.7f));

        _cooldownLeft -= (float)delta;
        if (_cooldownLeft <= 0f)
        {
            Fire();
            _cooldownLeft = effCooldown;
        }
    }

    /// <summary>Per-shot logic — implemented by each weapon archetype.</summary>
    protected abstract void Fire();

    /// <summary>Final damage including PlayerStats damage bonus + double-damage roll.</summary>
    protected float RollDamage() =>
        ScaledDamage * PlayerStats.Instance.RollDamageMultiplier();

    /// <summary>Helper: find the nearest alive enemy to a point, or null.</summary>
    protected Enemy? FindNearestEnemy(Vector3 from, float maxRange)
    {
        var enemies = EnemyController.Instance.ActiveEnemies;
        Enemy? best = null;
        float bestSqr = maxRange * maxRange;
        for (int i = 0; i < enemies.Count; i++)
        {
            var e = enemies[i];
            if (!e.IsAlive) continue;
            float sqr = e.GlobalPosition.DistanceSquaredTo(from);
            if (sqr < bestSqr) { bestSqr = sqr; best = e; }
        }
        return best;
    }
}
