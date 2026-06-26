using Godot;
using MegabonkClone.Core;
using MegabonkClone.Systems;

namespace MegabonkClone.Weapons;

/// <summary>
/// AuraWeapon — continuous damage zone around the player. Each tick it damages
/// every enemy inside an expanding radius. No projectiles, no aim — pure
/// "stand in the crowd and melt them" weapon. Grows in range with level.
/// </summary>
public partial class AuraWeapon : WeaponBase
{
    public override void _Ready()
    {
        DefaultDamage = 5f;
        DefaultCooldown = 0.5f;
        DefaultRange = 3.5f;
        DefaultKnockback = 0f;
        base._Ready();
    }

    protected override void Fire()
    {
        var player = GameManager.Instance.ActivePlayer;
        if (player == null) return;

        // Aura radius already scaled by ApplyLevelScaling (5%/level) + 10% bonus here.
        float range = ScaledRange * (1f + 0.1f * (Level - 1));
        Vector3 origin = player.GlobalPosition;
        float dmg = RollDamage();

        foreach (var e in EnemyController.Instance.ActiveEnemies)
        {
            if (!e.IsAlive) continue;
            float sqr = e.GlobalPosition.DistanceSquaredTo(origin);
            if (sqr <= range * range)
                e.TakeDamage(dmg, 0f);
        }

        // Also damage breakable pots in aura range
        foreach (var node in player.GetTree().GetNodesInGroup("breakable"))
        {
            if (node is Entities.BreakablePot pot)
            {
                float sqr = pot.GlobalPosition.DistanceSquaredTo(origin);
                if (sqr <= range * range)
                    pot.TakeDamage(dmg);
            }
        }

        EmitSignal(SignalName.PulseFired, range);
    }

    [Signal] public delegate void PulseFiredEventHandler(float radius);
}
