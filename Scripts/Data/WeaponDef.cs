using Godot;

namespace MegabonkClone.Data;

/// <summary>
/// The four MVP weapon archetypes. Each has different fire logic.
/// </summary>
public enum WeaponKind
{
    AutoAxe,        // melee swing around the player
    ProjectileGun,  // fires homing-ish bullets at the nearest enemy
    AuraWeapon,     // continuous damage zone around the player
    Boomerang,      // throws a returning projectile in movement direction
}

/// <summary>
/// Tunable stats for a weapon. One def per kind; levels scale these values.
/// </summary>
[GlobalClass]
public partial class WeaponDef : Resource
{
    [Export] public WeaponKind Kind;
    [Export] public string DisplayName = "Weapon";
    [Export(PropertyHint.MultilineText)] public string Description = "";

    [ExportGroup("Damage")]
    [Export] public float BaseDamage = 10f;
    [Export] public float Knockback = 4f;

    [ExportGroup("Cadence")]
    [Export] public float BaseCooldown = 1f;   // seconds between activations
    [Export] public int ProjectileCount = 1;   // bullets per shot / swings per tick

    [ExportGroup("Geometry")]
    [Export] public float Range = 6f;          // detection radius / aura radius
    [Export] public float ProjectileSpeed = 12f;
    [Export] public float Lifetime = 3f;       // for projectiles / boomerangs

    [Export] public PackedScene? ProjectileScene; // used by gun & boomerang
    [Export] public Texture2D? Icon;
}
