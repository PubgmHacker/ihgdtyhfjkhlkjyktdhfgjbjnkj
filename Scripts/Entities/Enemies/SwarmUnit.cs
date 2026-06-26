using Godot;
using MegabonkClone.Effects;

namespace MegabonkClone.Entities;

/// <summary>
/// Tiny swarm enemy: very low HP, very fast, tiny attack range.
/// Spawned in large numbers to create "horde" pressure. Ported idea from
/// the Vampire Survivors swarm archetype present in the template.
/// </summary>
public partial class SwarmUnit : Enemy
{
    public override EnemyDeathColor DeathVfxColor => EnemyDeathColor.Green;

    public override void _Ready()
    {
        base._Ready();
        MoveSpeed = 7f;
        MaxHealth = 12f;
        AttackDamage = 4f;
        AttackCooldown = 0.5f;
        AttackRange = 1.0f;
        // Visually smaller — scale handled in scene, but we ensure speed/aggression.
    }
}
