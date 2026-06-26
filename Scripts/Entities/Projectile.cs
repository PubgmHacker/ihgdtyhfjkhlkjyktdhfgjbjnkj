using Godot;
using MegabonkClone.Core;
using MegabonkClone.Interfaces;
using MegabonkClone.Systems;

namespace MegabonkClone.Entities;

/// <summary>
/// Player-fired projectile (used by ProjectileGun & Boomerang spawn). Travels
/// in a direction, damages the first enemy it touches, and returns to the
/// pool on hit or after lifetime expires.
///
/// Uses an Area3D for hit detection (overlapping bodies) which is far
/// cheaper than per-frame raycasts against hundreds of enemies.
/// </summary>
public partial class Projectile : Area3D
{
    [Export] public float Speed = 12f;
    [Export] public float Lifetime = 3f;
    [Export] public float Damage = 10f;
    [Export] public float Knockback = 4f;
    /// <summary>True for boomerang-type projectiles that return to the player.</summary>
    [Export] public bool Returning;

    private Vector3 _velocity;
    private float _age;
    private bool _active = true;

    public override void _Ready()
    {
        // Player projectiles live on layer 3, monitor enemies on layer 2.
        CollisionLayer = 4u;        // layer 3 (bit value 4)
        CollisionMask = 2u;         // monitor layer 2 (enemies)
        Monitoring = true;
        Monitorable = false;

        // Connect the overlap signal in code so we don't depend on scene wiring.
        BodyEntered += OnBodyEntered;
    }

    public void Initialize(Vector3 direction, float damage, float? speed = null, float? lifetime = null)
    {
        _velocity = direction.Normalized() * (speed ?? Speed);
        Damage = damage;
        if (lifetime.HasValue) Lifetime = lifetime.Value;
        _age = 0f;
        _active = true;
        // Reset collisions for pooled reuse.
        Monitoring = true;
        Monitoring = false;
        Monitoring = true;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (!_active) return;
        float dt = (float)delta;

        // Boomerang behaviour: reverse velocity halfway through life.
        if (Returning && _age > Lifetime * 0.5f)
        {
            var player = GameManager.Instance.ActivePlayer;
            if (player != null)
            {
                Vector3 back = (player.GlobalPosition - GlobalPosition).Normalized();
                _velocity = _velocity.Lerp(back * Speed, 4f * dt);
            }
        }

        GlobalPosition += _velocity * dt;
        _age += dt;

        if (_age >= Lifetime)
        {
            Deactivate();
        }
    }

    /// <summary>Area3D body-entered: damage the first enemy overlapped.</summary>
    private void OnBodyEntered(Node body)
    {
        if (!_active) return;
        if (body is Enemy enemy && enemy.IsAlive)
        {
            float dmg = Damage * PlayerStats.Instance.RollDamageMultiplier();
            enemy.TakeDamage(dmg, Knockback);
            if (!Returning)
                Deactivate();
        }
    }

    private void Deactivate()
    {
        _active = false;
        Monitoring = false;
        ObjectPool.Instance.Release(this);
    }
}
