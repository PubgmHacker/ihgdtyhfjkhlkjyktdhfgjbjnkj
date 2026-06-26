using Godot;
using MegabonkClone.Effects;
using MegabonkClone.Systems;

namespace MegabonkClone.Entities;

/// <summary>
/// Slow, bulky tank. Huge HP pool, heavy contact damage, but slow.
/// Forces the player to kite rather than facetank every enemy.
/// </summary>
public partial class TankEnemy : Enemy
{
    public override EnemyDeathColor DeathVfxColor => EnemyDeathColor.Grey;

    public override void _Ready()
    {
        base._Ready();
        MoveSpeed = 1.8f;
        MaxHealth = 250f;
        AttackDamage = 25f;
        AttackCooldown = 1.5f;
        AttackRange = 2.2f;
    }

    /// <summary>Tank shrugs off a fraction of all incoming damage.</summary>
    public override bool TakeDamage(float amount, float knockBackDuration = 0f)
    {
        // Tanks are armored: reduce damage by 25%.
        return base.TakeDamage(amount * 0.75f, knockBackDuration);
    }
}
