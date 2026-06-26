using Godot;
using MegabonkClone.Core;
using MegabonkClone.Systems;

namespace MegabonkClone.Weapons;

/// <summary>
/// BoomerangWeapon — throws a projectile in the player's movement (or aim)
/// direction that flies out and returns, hitting enemies on both legs of
/// the trip. Pierces multiple enemies. More boomerangs per shot at higher
/// levels, fired in a rotating fan.
/// </summary>
public partial class BoomerangWeapon : WeaponBase
{
    private const string ProjectilePath = "res://Scenes/Entities/Projectile.tscn";
    private float _fanAngle;

    public override void _Ready()
    {
        DefaultDamage = 14f;
        DefaultCooldown = 1.4f;
        DefaultRange = 14f;
        DefaultProjectileSpeed = 10f;
        DefaultLifetime = 1.8f;
        ProjectileScene ??= ResourceLoader.Load<PackedScene>(ProjectilePath);
        base._Ready();
    }

    protected override void Fire()
    {
        var player = GameManager.Instance.ActivePlayer;
        if (player == null || ProjectileScene == null) return;

        // Aim in movement direction; fall back to nearest enemy; else forward.
        Vector3 aim;
        Vector3 vel = player.Velocity;
        if (vel.LengthSquared() > 0.1f)
            aim = new Vector3(vel.X, 0, vel.Z).Normalized();
        else
        {
            var nearest = FindNearestEnemy(player.GlobalPosition, ScaledRange * 2f);
            aim = nearest != null
                ? (nearest.GlobalPosition - player.GlobalPosition).Normalized()
                : Vector3.Forward;
        }

        Vector3 origin = player.GlobalPosition + Vector3.Up * 0.8f;
        float dmg = RollDamage();
        float speed = ScaledProjectileSpeed * (1f + PlayerStats.Instance.ProjectileSpeedBonus / 100f);

        _fanAngle += 0.4f;
        int count = ScaledProjectileCount;
        for (int i = 0; i < count; i++)
        {
            float offset = count > 1 ? (i / (float)(count - 1) - 0.5f) * 0.8f : 0f;
            Vector3 dir = RotateY(aim, offset + _fanAngle * 0.05f);
            var proj = ObjectPool.Instance.Spawn<Entities.Projectile>(ProjectileScene, origin, Vector3.Zero);
            proj?.Initialize(dir, dmg, speed, ScaledLifetime);
            if (proj != null) proj.Returning = true;
        }
    }

    private static Vector3 RotateY(Vector3 v, float radians)
    {
        float c = Mathf.Cos(radians), s = Mathf.Sin(radians);
        return new Vector3(v.X * c - v.Z * s, 0, v.X * s + v.Z * c).Normalized();
    }
}
