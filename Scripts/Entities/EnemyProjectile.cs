using Godot;
using MegabonkClone.Core;
using MegabonkClone.Interfaces;

namespace MegabonkClone.Entities;

/// <summary>
/// Projectile fired by RangedShooter/Boss — damages the player, not enemies.
/// Mirrors the "DoDamage" damagePlayer path from the Unity template.
/// </summary>
public partial class EnemyProjectile : Area3D
{
    [Export] public float Speed = 9f;
    [Export] public float Lifetime = 4f;

    private Vector3 _velocity;
    private float _damage;
    private float _age;
    private bool _active = true;

    public override void _Ready()
    {
        // Enemy projectiles live on layer 3, monitor the player on layer 1.
        CollisionLayer = 4u;        // layer 3
        CollisionMask = 1u;         // monitor layer 1 (player)
        Monitoring = true;
        Monitorable = false;

        BodyEntered += OnBodyEntered;
    }

    public void Initialize(Vector3 direction, float damage, float speed, float lifetime)
    {
        _velocity = direction.Normalized() * speed;
        Speed = speed;
        _damage = damage;
        Lifetime = lifetime;
        _age = 0f;
        _active = true;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (!_active) return;
        float dt = (float)delta;
        GlobalPosition += _velocity * dt;
        _age += dt;
        if (_age >= Lifetime) Deactivate();
    }

    private void OnBodyEntered(Node body)
    {
        if (!_active) return;
        if (body is Player player && player.IsAlive)
        {
            player.TakeDamage(_damage);
            Deactivate();
        }
    }

    private void Deactivate()
    {
        _active = false;
        ObjectPool.Instance.Release(this);
    }
}
