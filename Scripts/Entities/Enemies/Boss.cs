using System.Collections.Generic;
using Godot;
using MegabonkClone.Core;
using MegabonkClone.Effects;

namespace MegabonkClone.Entities;

/// <summary>
/// Boss enemy: high HP, multiple attack patterns (contact + radial projectile
/// burst), phases that trigger as HP drops. Spawns every Nth wave.
/// When it dies it drops a big XP/gold reward.
/// </summary>
public partial class Boss : Enemy
{
    public override EnemyDeathColor DeathVfxColor => EnemyDeathColor.Gold;
    [Export] public float RadialBurstCooldown = 3.5f;
    [Export] public int ProjectilesPerBurst = 12;
    [Export] public PackedScene? ProjectileScene;

    private float _nextBurstTime;
    private int _phase;

    // Phase thresholds as fraction of max health (0..1).
    private static readonly float[] PhaseThresholds = { 0.66f, 0.33f };

    public override void _Ready()
    {
        base._Ready();
        MoveSpeed = 2.5f;
        MaxHealth = 1500f;
        AttackDamage = 35f;
        AttackCooldown = 1.2f;
        AttackRange = 3f;

        if (ProjectileScene == null)
            ProjectileScene = ResourceLoader.Load<PackedScene>(
                "res://Scenes/Entities/EnemyProjectile.tscn");
    }

    /// <summary>
    /// Initializes the boss as summoned by a BossGate (default stats).
    /// </summary>
    public void InitializeBoss(float difficulty = 1f)
    {
        MaxHealth = 1500f * difficulty;
        CurrentHealth = MaxHealth;
        AttackDamage = 35f * difficulty;
        XPValue = 100;
        GoldValue = 30;
        GoldDropChance = 100;
        IsAlive = true;
        IsRare = false;
        _phase = 0;
        _nextBurstTime = 0f;
    }

    public override void Tick(Vector3 playerPos, float dt)
    {
        if (!IsAlive) return;

        // Advance phase based on HP.
        CheckPhases();

        // Standard chase + contact damage from base class.
        base.Tick(playerPos, dt);

        // Radial projectile burst on cooldown.
        float now = Time.GetTicksMsec() / 1000f;
        if (now >= _nextBurstTime)
        {
            _nextBurstTime = now + RadialBurstCooldown / (1f + _phase * 0.5f);
            RadialBurst(playerPos);
        }
    }

    private void CheckPhases()
    {
        float frac = CurrentHealth / MaxHealth;
        int desiredPhase = 0;
        for (int i = 0; i < PhaseThresholds.Length; i++)
            if (frac <= PhaseThresholds[i]) desiredPhase = i + 1;

        if (desiredPhase != _phase)
        {
            _phase = desiredPhase;
            // Phase transition: brief enrage — speed up + screen shake.
            MoveSpeed *= 1.15f;
            ScreenShake.Instance?.BossPhase();
            VFXManager.Instance?.SpawnRing(GlobalPosition, new Color(1f, 0.3f, 0.1f), radius: 5f, lifetime: 0.6f);
        }
    }

    private void RadialBurst(Vector3 playerPos)
    {
        if (ProjectileScene == null) return;
        int count = ProjectilesPerBurst + _phase * 4;
        for (int i = 0; i < count; i++)
        {
            float angle = i * Mathf.Tau / count;
            Vector3 dir = new(Mathf.Cos(angle), 0, Mathf.Sin(angle));
            var proj = ObjectPool.Instance.Spawn<EnemyProjectile>(
                ProjectileScene, GlobalPosition + Vector3.Up * 1.2f, Vector3.Zero);
            proj?.Initialize(dir, damage: 18f, speed: 7f, lifetime: 5f);
        }
    }

    protected override void DropLoot()
    {
        // Boss death: massive explosion VFX before drops.
        VFXManager.Instance?.BossDeath(GlobalPosition);

        // Bosses drop a big pile of XP + guaranteed gold.
        XPValue *= 8;
        GoldValue *= 10;
        GoldDropChance = 100;
        base.DropLoot();
    }
}
