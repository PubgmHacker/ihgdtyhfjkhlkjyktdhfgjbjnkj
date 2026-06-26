using Godot;
using MegabonkClone.Core;
using MegabonkClone.Systems;

namespace MegabonkClone.Weapons;

/// <summary>
/// AutoAxe — melee swing that hits every enemy within range around the
/// player each time it fires. No projectile, instant AoE damage + knockback.
/// The reliable starter weapon.
/// </summary>
public partial class AutoAxe : WeaponBase
{
    public override void _Ready()
    {
        DefaultDamage = 12f;
        DefaultCooldown = 0.9f;
        DefaultRange = 4f;
        DefaultKnockback = 5f;
        base._Ready();
    }

    protected override void Fire()
    {
        var player = GameManager.Instance.ActivePlayer;
        if (player == null) return;

        Vector3 origin = player.GlobalPosition;
        float dmg = RollDamage();
        float knockback = ScaledKnockback + PlayerStats.Instance.KnockbackBonus;
        float range = ScaledRange;

        foreach (var e in EnemyController.Instance.ActiveEnemies)
        {
            if (!e.IsAlive) continue;
            float sqr = e.GlobalPosition.DistanceSquaredTo(origin);
            if (sqr <= range * range)
            {
                e.TakeDamage(dmg, knockback);
                Vector3 push = (e.GlobalPosition - origin);
                push.Y = 0;
                if (push.LengthSquared() > 0.001f)
                {
                    push = push.Normalized();
                    e.Velocity += push * knockback;
                }
            }
        }

        // Also damage breakable pots in range
        foreach (var node in player.GetTree().GetNodesInGroup("breakable"))
        {
            if (node is Entities.BreakablePot pot)
            {
                float sqr = pot.GlobalPosition.DistanceSquaredTo(origin);
                if (sqr <= range * range)
                    pot.TakeDamage(dmg);
            }
        }

        EmitSignal(SignalName.SwingFired);
    }

    [Signal] public delegate void SwingFiredEventHandler();
}
