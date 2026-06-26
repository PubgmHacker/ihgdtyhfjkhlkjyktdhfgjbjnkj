using Godot;
using MegabonkClone.Effects;

namespace MegabonkClone.Entities;

/// <summary>
/// Fast, fragile charger. Low HP, high move speed, low damage but very
/// frequent small attacks. Presses the player constantly.
/// </summary>
public partial class MeleeCharger : Enemy
{
    public override EnemyDeathColor DeathVfxColor => EnemyDeathColor.Red;

    public override void _Ready()
    {
        base._Ready();
        // Tuned defaults for the "charger" archetype if no def applied.
        MoveSpeed = 6f;
        MaxHealth = 25f;
        AttackDamage = 6f;
        AttackCooldown = 0.6f;
        AttackRange = 1.4f;
    }
}
