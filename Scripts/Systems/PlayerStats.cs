using Godot;
using MegabonkClone.Data;

namespace MegabonkClone.Systems;

/// <summary>
/// Run-scoped + persistent player statistics (Autoload singleton).
/// Ported from the Unity PlayerStats: holds gold, level/XP, and all the
/// percentage stat bonuses that weapons, upgrades and characters apply.
///
/// Bonuses are reset per run (via ResetForNewRun) except gold/stage which
/// persist via SaveManager.
/// </summary>
public partial class PlayerStats : Node
{
    public static PlayerStats Instance { get; private set; } = null!;

    // ---------------- Persistent (saved) ----------------
    /// <summary>Gold carried between runs (shop currency).</summary>
    public int Gold { get; set; }

    /// <summary>Silver Coins — rare meta-progression currency for permanent upgrades.</summary>
    public int SilverCoins { get; set; }

    /// <summary>Highest stage cleared.</summary>
    public int StageCleared { get; set; }

    // ---------------- Run progression ----------------
    public int Level { get; private set; } = 1;
    public int CurrentXP { get; private set; }
    public float RequiredXP { get; private set; } = 50f;

    /// <summary>Raised whenever XP changes or a level-up occurs.</summary>
    public event System.Action? XPChanged;
    public event System.Action? LevelledUp;

    // ---------------- Stat bonuses (% unless noted) ----------------
    public float DamageBonus;            // extra % damage dealt by weapons
    public float SpeedBonus;             // extra % movement speed
    public float HealthRegen;            // HP per second
    public float XPGainBonus;            // flat extra XP per orb
    public float ProjectileSpeedBonus;   // extra % projectile speed
    public float CooldownReduction;      // % cooldown reduction
    public float LuckBonus;              // crit / drop chance
    public float KnockbackBonus;         // extra knockback applied
    public float ArmorBonus;             // % damage reduction
    public float DoubleDamageChance;     // 0..1 chance to double damage
    public float AttackSpeedBonus;       // extra % attack speed

    // --- Economy multipliers (run-scoped) ---
    public float GoldMultiplier = 1f;    // multiplies gold gained this run
    public float SilverCoinBonusChance;  // extra % chance for silver coin drops

    private SaveManager _save = null!;

    public override void _Ready()
    {
        Instance = this;
        _save = GetNode<SaveManager>("/root/SaveManager");
        Load();
    }

    /// <summary>Resets per-run state. Called when a new run begins.</summary>
    public void ResetForNewRun()
    {
        Level = 1;
        CurrentXP = 0;
        RequiredXP = 50f;

        DamageBonus = 0; SpeedBonus = 0; HealthRegen = 0;
        XPGainBonus = 0; ProjectileSpeedBonus = 0; CooldownReduction = 0;
        LuckBonus = 0; KnockbackBonus = 0; ArmorBonus = 0;
        DoubleDamageChance = 0; AttackSpeedBonus = 0;
        GoldMultiplier = 1f; SilverCoinBonusChance = 0f;
    }

    /// <summary>Adds XP and triggers level-up(s) + events.</summary>
    public void AddXP(int amount)
    {
        CurrentXP += amount + Mathf.RoundToInt(XPGainBonus);
        while (CurrentXP >= RequiredXP)
        {
            CurrentXP -= (int)RequiredXP;
            Level++;
            // Progression curve: each level requires 1.5x more XP.
            RequiredXP = Mathf.CeilToInt(RequiredXP * 1.5f);
            LevelledUp?.Invoke();
        }
        XPChanged?.Invoke();
    }

    /// <summary>Applies the starting stat bonuses from a character definition.</summary>
    public void ApplyCharacter(CharacterDef character)
    {
        if (character == null) return;
        DamageBonus          += character.Damage;
        SpeedBonus           += character.MovementSpeed;
        HealthRegen          += character.HealthRegeneration;
        XPGainBonus          += character.XPBoost;
        CooldownReduction    += character.CooldownReduction;
        LuckBonus            += character.LuckBoost;
        ArmorBonus           += character.Armor;
        DoubleDamageChance   += character.DoubleDamageChance;
    }

    public void AddGold(int amount)
    {
        Gold += Mathf.RoundToInt(amount * GoldMultiplier);
        Save();
    }

    public void AddSilverCoins(int amount)
    {
        SilverCoins += amount;
        Save();
    }

    // ---------------- Persistence ----------------
    public void Save() => _save.SavePlayer(this);

    public void Load()
    {
        var data = _save.LoadPlayer();
        Gold = data.Gold;
        SilverCoins = data.SilverCoins ?? 0;
        StageCleared = data.StageCleared;
    }

    // ---------------- Convenience getters for weapons ----------------
    /// <summary>Multiplier combining damage bonus + double-damage roll.</summary>
    public float RollDamageMultiplier()
    {
        float mult = 1f + Mathf.Max(0f, DamageBonus / 100f);
        if (GD.Randf() < DoubleDamageChance)
            mult *= 2f;
        return mult;
    }
}
