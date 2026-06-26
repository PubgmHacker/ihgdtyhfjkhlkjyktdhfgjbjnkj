using Godot;

namespace MegabonkClone.Data;

/// <summary>
/// Static definition of a playable character. Ported from the Unity
/// CharacterScriptableObject. In Godot we expose these as Resource (.tres)
/// files and/or JSON so designers can tweak without recompiling.
///
/// Each character has base stats + a signature starting weapon.
/// </summary>
[GlobalClass]
public partial class CharacterDef : Resource
{
	[Export] public string Id = "";
	[Export] public string DisplayName = "Hero";
	[Export(PropertyHint.MultilineText)] public string Description = "";

	[ExportGroup("Combat")]
	[Export] public float BaseHP = 100f;
	[Export] public float Damage;             // bonus % damage
	[Export] public float Armor;              // % damage reduction
	[Export] public float DoubleDamageChance; // 0..1

	[ExportGroup("Utility")]
	[Export] public float MovementSpeed;      // bonus % speed
	[Export] public float HealthRegeneration; // HP/sec
	[Export] public float LuckBoost;
	[Export] public float CooldownReduction;  // %
	[Export] public float XPBoost;            // flat extra XP

	[ExportGroup("Economy")]
	[Export] public int Cost;                 // gold to unlock
	[Export] public bool UnlockedByDefault;

	[ExportGroup("Visual")]
	[Export] public Texture2D? Icon;
	/// <summary>Resource path to the character's 3D model scene, if any.</summary>
	[Export] public string ModelScenePath = "";

	/// <summary>Resource path to this character's signature starting weapon def.</summary>
	[Export] public string StartingWeaponPath = "";
}
