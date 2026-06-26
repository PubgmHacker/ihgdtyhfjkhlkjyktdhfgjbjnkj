using Godot;

namespace MegabonkClone.Data;

/// <summary>
/// The category of effect an upgrade applies. Mirrors the Unity UpgardeEnum.
/// Weapons unlock/level their own subsystem; the rest mutate PlayerStats.
/// </summary>
public enum UpgradeType
{
    // Stat upgrades
    AddDamage,
    AddMaxHealth,
    AddSpeed,
    AddAttackSpeed,
    AddXPBonus,
    Heal,
    AddArmor,
    AddRegeneration,
    AddCooldownReduction,
    AddLuck,
    AddKnockback,
    AddDoubleDamageChance,

    // Weapon unlocks / levels
    UnlockAutoAxe,
    UnlockProjectileGun,
    UnlockAuraWeapon,
    UnlockBoomerang,
    LevelUpAutoAxe,
    LevelUpProjectileGun,
    LevelUpAuraWeapon,
    LevelUpBoomerang,

    // Economy
    SilverTome,        // permanently grants +1 Silver Coin per pot break chance
    GoldRush,          // +50% gold from all sources this run
}

/// <summary>
/// A level-up draft choice definition. Ported from UpgradeScriptableObject.
/// Each upgrade has a max number of times it can be taken (MaxPoints).
/// </summary>
[GlobalClass]
public partial class UpgradeDef : Resource
{
    [Export] public UpgradeType Type;
    [Export] public string Title = "Upgrade";
    [Export(PropertyHint.MultilineText)] public string Description = "";

    /// <summary>Icon shown on the draft card.</summary>
    [Export] public Texture2D? Icon;

    /// <summary>How strong each pickup is (% for stat upgrades, levels for weapons).</summary>
    [Export] public float ValuePerPick = 5f;

    /// <summary>Maximum times this upgrade can be drafted.</summary>
    [Export] public int MaxPoints = 5;

    /// <summary>Spawn weight for the random draft (higher = more likely to appear).</summary>
    [Export(PropertyHint.Range, "0,100")] public int Weight = 50;
}
