using Godot;

namespace MegabonkClone.Data;

/// <summary>
/// Enemy type definition. Ported from the Unity EnemyDef ScriptableObject.
/// Driven by <see cref="WaveManager"/> when picking which enemy to spawn.
/// </summary>
[GlobalClass]
public partial class EnemyDef : Resource
{
    [Export] public string Id = "";
    [Export] public string DisplayName = "Enemy";

    [ExportGroup("Prefab")]
    /// <summary>Packed scene for the normal variant.</summary>
    [Export] public PackedScene? Prefab;
    /// <summary>Optional tougher/flashier rare variant.</summary>
    [Export] public PackedScene? RarePrefab;
    /// <summary>0..1 chance to spawn the rare variant instead of the normal one.</summary>
    [Export(PropertyHint.Range, "0,1")] public float RareChance;

    [ExportGroup("Stats")]
    [Export] public float MaxHealth = 50f;
    [Export] public float MoveSpeed = 3f;
    [Export] public float AttackRange = 2f;
    [Export] public float AttackSpeed = 1f;     // attacks per second
    [Export] public float Damage = 10f;

    [ExportGroup("Rewards")]
    [Export] public int XPValue = 5;
    [Export] public int GoldValue = 2;
    [Export(PropertyHint.Range, "0,100")] public int GoldDropChance = 30;

    [Export] public Texture2D? Icon;

    /// <summary>
    /// Returns the prefab to spawn, rolling for a rare variant when configured.
    /// </summary>
    public PackedScene? GetPrefab()
    {
        if (RarePrefab == null || RareChance <= 0f)
            return Prefab;
        return GD.Randf() <= RareChance ? RarePrefab : Prefab;
    }
}
