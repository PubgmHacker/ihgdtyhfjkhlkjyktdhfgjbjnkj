using Godot;
using MegabonkClone.Data;

namespace MegabonkClone.Weapons;

/// <summary>
/// Owns the player's weapons. One child WeaponBase per archetype; locked
/// until an upgrade unlocks/levels it. Gives the player a clean API to
/// unlock + level weapons from the upgrade draft.
///
/// Lives as a child of the Player node.
/// </summary>
public partial class WeaponManager : Node
{
    private AutoAxe? _autoAxe;
    private ProjectileGun? _projectileGun;
    private AuraWeapon? _aura;
    private BoomerangWeapon? _boomerang;

    public override void _Ready()
    {
        // Defer lookup so children added after AddChild (in code-built scenes)
        // are present by the time we resolve them.
        CallDeferred(nameof(CacheWeapons));
    }

    private void CacheWeapons()
    {
        _autoAxe = GetNodeOrNull<AutoAxe>("AutoAxe");
        _projectileGun = GetNodeOrNull<ProjectileGun>("ProjectileGun");
        _aura = GetNodeOrNull<AuraWeapon>("AuraWeapon");
        _boomerang = GetNodeOrNull<BoomerangWeapon>("Boomerang");
    }

    /// <summary>Unlock a weapon (or level it if already owned) by kind.</summary>
    public void UnlockOrLevel(WeaponKind kind)
    {
        switch (kind)
        {
            case WeaponKind.AutoAxe:       _autoAxe?.LevelUp(); break;
            case WeaponKind.ProjectileGun: _projectileGun?.LevelUp(); break;
            case WeaponKind.AuraWeapon:    _aura?.LevelUp(); break;
            case WeaponKind.Boomerang:     _boomerang?.LevelUp(); break;
        }
    }

    public int GetLevel(WeaponKind kind) => kind switch
    {
        WeaponKind.AutoAxe       => _autoAxe?.Level ?? 0,
        WeaponKind.ProjectileGun => _projectileGun?.Level ?? 0,
        WeaponKind.AuraWeapon    => _aura?.Level ?? 0,
        WeaponKind.Boomerang     => _boomerang?.Level ?? 0,
        _ => 0,
    };

    /// <summary>Grant the character's signature starting weapon.</summary>
    public void GrantStartingWeapon(string weaponDefPath)
    {
        if (string.IsNullOrEmpty(weaponDefPath)) return;
        var def = ResourceLoader.Load<WeaponDef>(weaponDefPath);
        if (def == null) return;
        UnlockOrLevel(def.Kind);
    }
}
