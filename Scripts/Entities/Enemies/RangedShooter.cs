using Godot;
using MegabonkClone.Core;
using MegabonkClone.Effects;
using MegabonkClone.Generation;

namespace MegabonkClone.Entities;

/// <summary>
/// Ranged attacker. Keeps distance from the player and periodically fires
/// a projectile. Adds ranged threat so the player can't just outrun everything.
/// </summary>
public partial class RangedShooter : Enemy
{
    public override EnemyDeathColor DeathVfxColor => EnemyDeathColor.Purple;
    [Export] public float PreferredRange = 9f;
    [Export] public float RangeTolerance = 1.5f;
    [Export] public float ShootCooldown = 1.8f;
    [Export] public PackedScene? ProjectileScene;

    private float _nextShotTime;
    private const string DefaultProjectilePath = "res://Scenes/Entities/EnemyProjectile.tscn";

    public override void _Ready()
    {
        base._Ready();
        MoveSpeed = 3.5f;
        MaxHealth = 40f;
        AttackDamage = 0f;
        AttackRange = 0.1f;
        if (ProjectileScene == null)
            ProjectileScene = Player.EnemyProjectileScene ?? GD.Load<PackedScene>(DefaultProjectilePath);
    }

    public override void Tick(Vector3 playerPos, float dt)
    {
        if (!IsAlive) return;

        // Flash decay (inherited from base Enemy)
        if (_flashTimer > 0f && _mesh != null && _flashMat != null)
        {
            _flashTimer -= dt;
            if (_flashTimer <= 0f && _baseMaterial != null)
                _mesh.MaterialOverride = _baseMaterial;
        }

        Vector3 toPlayer = playerPos - GlobalPosition;
        Vector3 flat = new(toPlayer.X, 0, toPlayer.Z);
        float dist = flat.Length();
        if (dist < 0.001f) return;
        Vector3 dir = flat / dist;

        Vector3 moveDir;
        if (dist > PreferredRange + RangeTolerance)
            moveDir = dir;
        else if (dist < PreferredRange - RangeTolerance)
            moveDir = -dir;
        else
            moveDir = Vector3.Zero;

        Velocity = moveDir * MoveSpeed;
        MoveAndSlide();

        if (dir != Vector3.Zero)
            GlobalBasis = GlobalBasis.Slerp(Basis.LookingAt(dir, Vector3.Up), RotationSpeed * dt);

        float now = Time.GetTicksMsec() / 1000f;
        if (now >= _nextShotTime)
        {
            _nextShotTime = now + ShootCooldown;
            FireProjectile(dir);
        }
    }

    private void FireProjectile(Vector3 dir)
    {
        if (ProjectileScene == null) return;
        var proj = ObjectPool.Instance.Spawn<EnemyProjectile>(
            ProjectileScene, GlobalPosition + Vector3.Up * 0.8f, Vector3.Zero);
        proj?.Initialize(dir, damage: 12f, speed: 9f, lifetime: 4f);
    }
}
