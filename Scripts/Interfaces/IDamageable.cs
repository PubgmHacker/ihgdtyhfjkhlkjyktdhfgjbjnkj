namespace MegabonkClone.Interfaces;

/// <summary>
/// Implemented by anything that can be damaged: the player, enemies, bosses.
/// Mirrors the Unity IDamageable contract.
/// </summary>
public interface IDamageable
{
    /// <summary>Current health.</summary>
    float CurrentHealth { get; }

    /// <summary>Maximum health.</summary>
    float MaxHealth { get; }

    /// <summary>True while the entity is still alive.</summary>
    bool IsAlive { get; }

    /// <summary>Apply <paramref name="amount"/> damage. Returns true if this killed it.</summary>
    bool TakeDamage(float amount, float knockBackDuration = 0f);

    /// <summary>Restore <paramref name="amount"/> health (clamped to MaxHealth).</summary>
    void Heal(float amount);
}
