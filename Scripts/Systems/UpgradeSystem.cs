using System.Collections.Generic;
using Godot;
using MegabonkClone.Core;
using MegabonkClone.Data;

namespace MegabonkClone.Systems;

/// <summary>
/// Manages the level-up upgrade draft. Holds the full pool of
/// <see cref="UpgradeDef"/>s, tracks how many times each has been taken,
/// and offers a random weighted selection of 3 valid choices.
///
/// When the player levels up, the Game scene calls <see cref="RequestDraft"/>
/// which pauses the game and emits <see cref="DraftReady"/> with 3 options.
/// The UI then calls <see cref="Apply"/> with the chosen one.
///
/// Ported from the Unity UpgradeManager.
/// </summary>
public partial class UpgradeSystem : Node
{
    [Export] public Godot.Collections.Array<UpgradeDef> Pool = new();
    [Export] public int DraftSize = 3;

    private readonly Dictionary<UpgradeType, int> _taken = new();

    public override void _Ready()
    {
        if (Pool.Count == 0)
        {
            GD.Print("[UpgradeSystem] No upgrades assigned — generating default pool.");
            Pool = BuildDefaultPool();
        }
    }

    /// <summary>
    /// Builds the full upgrade pool in code so the level-up draft works
    /// out of the box without hand-authored .tres resources.
    /// </summary>
    private Godot.Collections.Array<UpgradeDef> BuildDefaultPool()
    {
        var pool = new Godot.Collections.Array<UpgradeDef>();
        pool.Add(Mk(UpgradeType.AddDamage, "Sharper Edge", "+15% damage", 15f, 8, 100));
        pool.Add(Mk(UpgradeType.AddMaxHealth, "Vitality", "+25 max HP", 25f, 8, 90));
        pool.Add(Mk(UpgradeType.AddSpeed, "Swift Boots", "+12% move speed", 12f, 5, 80));
        pool.Add(Mk(UpgradeType.AddAttackSpeed, "Quick Hands", "+15% attack speed", 15f, 6, 85));
        pool.Add(Mk(UpgradeType.AddXPBonus, "Scholar", "+3 bonus XP per orb", 3f, 5, 70));
        pool.Add(Mk(UpgradeType.Heal, "Bandage", "Heal 50 HP", 50f, 99, 40));
        pool.Add(Mk(UpgradeType.AddArmor, "Iron Skin", "+10% damage reduction", 10f, 7, 75));
        pool.Add(Mk(UpgradeType.AddRegeneration, "Regrowth", "+1 HP/sec regen", 1f, 5, 65));
        pool.Add(Mk(UpgradeType.AddCooldownReduction, "Haste", "+8% cooldown reduction", 8f, 5, 70));
        pool.Add(Mk(UpgradeType.AddLuck, "Lucky Charm", "+10% luck", 10f, 5, 60));
        pool.Add(Mk(UpgradeType.AddKnockback, "Heavy Blows", "+30% knockback", 30f, 4, 50));
        pool.Add(Mk(UpgradeType.AddDoubleDamageChance, "Critical Eye", "+5% double damage", 5f, 8, 55));
        pool.Add(Mk(UpgradeType.UnlockAutoAxe, "Unlock: Auto Axe", "Auto-swings at nearby foes", 1f, 1, 30));
        pool.Add(Mk(UpgradeType.UnlockProjectileGun, "Unlock: Gun", "Fires homing bullets", 1f, 1, 30));
        pool.Add(Mk(UpgradeType.UnlockAuraWeapon, "Unlock: Aura", "Damages all around you", 1f, 1, 30));
        pool.Add(Mk(UpgradeType.UnlockBoomerang, "Unlock: Boomerang", "Throws returning blades", 1f, 1, 30));
        pool.Add(Mk(UpgradeType.LevelUpAutoAxe, "Axe Lv+", "Level up Auto Axe", 1f, 8, 45));
        pool.Add(Mk(UpgradeType.LevelUpProjectileGun, "Gun Lv+", "Level up Gun", 1f, 8, 45));
        pool.Add(Mk(UpgradeType.LevelUpAuraWeapon, "Aura Lv+", "Level up Aura", 1f, 8, 45));
        pool.Add(Mk(UpgradeType.LevelUpBoomerang, "Boomerang Lv+", "Level up Boomerang", 1f, 8, 45));

        // Economy upgrades
        pool.Add(Mk(UpgradeType.SilverTome, "Silver Tome", "+5% silver coin drop from pots", 5f, 5, 35));
        pool.Add(Mk(UpgradeType.GoldRush, "Gold Rush", "+50% gold from all sources", 50f, 3, 40));
        return pool;
    }

    private static UpgradeDef Mk(UpgradeType type, string title, string desc,
        float value, int maxPoints, int weight) => new()
    {
        Type = type,
        Title = title,
        Description = desc,
        ValuePerPick = value,
        MaxPoints = maxPoints,
        Weight = weight,
    };

    [Signal] public delegate void DraftReadyEventHandler(Godot.Collections.Array<UpgradeDef> choices);
    [Signal] public delegate void AppliedEventHandler(UpgradeDef def);

    /// <summary>Builds a draft and pauses the game. Called on level-up.</summary>
    public void RequestDraft()
    {
        GameManager.Instance.EnterLevelUp();

        var candidates = new List<UpgradeDef>();
        foreach (var def in Pool)
        {
            // Skip upgrades that are maxed out.
            _taken.TryGetValue(def.Type, out int count);
            if (count < def.MaxPoints)
                candidates.Add(def);
        }

        var chosen = new Godot.Collections.Array<UpgradeDef>();
        var rng = new System.Random();

        // Weighted selection without repeats.
        while (chosen.Count < DraftSize && candidates.Count > 0)
        {
            int total = 0;
            foreach (var c in candidates) total += Mathf.Max(1, c.Weight);

            int roll = rng.Next(1, total + 1);
            UpgradeDef? picked = null;
            foreach (var c in candidates)
            {
                roll -= Mathf.Max(1, c.Weight);
                if (roll <= 0) { picked = c; break; }
            }
            if (picked == null) picked = candidates[0];

            chosen.Add(picked);
            candidates.Remove(picked);
        }

        EmitSignal(SignalName.DraftReady, chosen);
    }

    /// <summary>Applies the chosen upgrade and unpauses the game.</summary>
    public void Apply(UpgradeDef def)
    {
        _taken[def.Type] = (_taken.TryGetValue(def.Type, out int c) ? c : 0) + 1;
        ApplyEffect(def);
        GameManager.Instance.ExitLevelUp();
        EmitSignal(SignalName.Applied, def);
    }

    private void ApplyEffect(UpgradeDef def)
    {
        var stats = PlayerStats.Instance;
        var player = GameManager.Instance.ActivePlayer;
        float v = def.ValuePerPick;

        switch (def.Type)
        {
            case UpgradeType.AddDamage:             stats.DamageBonus += v; break;
            case UpgradeType.AddMaxHealth:          player?.IncreaseMaxHealth(v); break;
            case UpgradeType.AddSpeed:              stats.SpeedBonus += v; break;
            case UpgradeType.AddAttackSpeed:        stats.AttackSpeedBonus += v; break;
            case UpgradeType.AddXPBonus:            stats.XPGainBonus += v; break;
            case UpgradeType.Heal:                  player?.Heal(50f); break;
            case UpgradeType.AddArmor:              stats.ArmorBonus += v; break;
            case UpgradeType.AddRegeneration:       stats.HealthRegen += v; break;
            case UpgradeType.AddCooldownReduction:  stats.CooldownReduction += v; break;
            case UpgradeType.AddLuck:               stats.LuckBonus += v; break;
            case UpgradeType.AddKnockback:          stats.KnockbackBonus += v; break;
            case UpgradeType.AddDoubleDamageChance: stats.DoubleDamageChance += v / 100f; break;

            case UpgradeType.UnlockAutoAxe:
            case UpgradeType.LevelUpAutoAxe:
                player?.GetNodeOrNull<Weapons.WeaponManager>("WeaponManager")?.UnlockOrLevel(WeaponKind.AutoAxe);
                break;
            case UpgradeType.UnlockProjectileGun:
            case UpgradeType.LevelUpProjectileGun:
                player?.GetNodeOrNull<Weapons.WeaponManager>("WeaponManager")?.UnlockOrLevel(WeaponKind.ProjectileGun);
                break;
            case UpgradeType.UnlockAuraWeapon:
            case UpgradeType.LevelUpAuraWeapon:
                player?.GetNodeOrNull<Weapons.WeaponManager>("WeaponManager")?.UnlockOrLevel(WeaponKind.AuraWeapon);
                break;
            case UpgradeType.UnlockBoomerang:
            case UpgradeType.LevelUpBoomerang:
                player?.GetNodeOrNull<Weapons.WeaponManager>("WeaponManager")?.UnlockOrLevel(WeaponKind.Boomerang);
                break;

            case UpgradeType.SilverTome:
                stats.SilverCoinBonusChance += v;
                break;
            case UpgradeType.GoldRush:
                stats.GoldMultiplier += v / 100f;
                break;
        }
    }
}
