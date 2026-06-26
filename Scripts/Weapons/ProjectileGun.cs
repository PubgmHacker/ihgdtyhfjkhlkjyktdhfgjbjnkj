using Godot;
using MegabonkClone.Core;
using MegabonkClone.Systems;

namespace MegabonkClone.Weapons;

/// <summary>
/// ProjectileGun — fires homing-ish bullets at the nearest enemy each shot.
/// More projectiles per shot at higher levels (spread). Long-range, reliable
/// single-target DPS. Lazily loads its projectile scene if no Def assigned it.
/// </summary>
public partial class ProjectileGun : WeaponBase
{
    private const string ProjectilePath = "res://Scenes/Entities/Projectile.tscn";

    public override void _Ready()
    {
        DefaultDamage = 8f;
        DefaultCooldown = 0.6f;
        DefaultRange = 12f;
        DefaultProjectileSpeed = 14f;
        DefaultLifetime = 2.5f;
        ProjectileScene ??= ResourceLoader.Load<PackedScene>(ProjectilePath);
        base._Ready();
    }

    protected override void Fire()
    {
        var player = GameManager.Instance.ActivePlayer;
        if (player == null || ProjectileScene == null) return;

        Vector3 origin = player.GlobalPosition + Vector3.Up * 0.8f;
        var nearest = FindNearestEnemy(origin, ScaledRange);
        if (nearest == null) return;

        Vector3 baseDir = (nearest.GlobalPosition + Vector3.Up - origin).Normalized();
        float dmg = RollDamage();
        float speed = ScaledProjectileSpeed * (1f + PlayerStats.Instance.ProjectileSpeedBonus / 100f);

        int count = ScaledProjectileCount;
        for (int i = 0; i < count; i++)
        {
            float spread = count > 1 ? (i / (float)(count - 1) - 0.5f) * 0.6f : 0f;
            Vector3 dir = Spread(baseDir, spread);
            var proj = ObjectPool.Instance.Spawn<Entities.Projectile>(ProjectileScene, origin, Vector3.Zero);
            proj?.Initialize(dir, dmg, speed, ScaledLifetime);
        }
    }

    private static Vector3 Spread(Vector3 dir, float radians)
    {
        if (radians == 0f) return dir;
        float c = Mathf.Cos(radians), s = Mathf.Sin(radians);
        return new Vector3(dir.X * c - dir.Z * s, dir.Y, dir.X * s + dir.Z * c).Normalized();
    }
}
