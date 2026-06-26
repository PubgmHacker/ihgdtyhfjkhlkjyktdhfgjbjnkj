using Godot;

namespace MegabonkClone.Generation;

/// <summary>
/// Defines a single tile in the arena grid. Each tile maps to a biome,
/// a mesh type (floor, wall, or decoration), and collision properties.
/// </summary>
public enum TileType
{
    Floor,
    Wall,
    Water,     // impassable visual
    Decoration // visual only, passable
}

[GlobalClass]
public partial class TileDef : Resource
{
    [Export] public TileType Type { get; set; } = TileType.Floor;
    [Export] public int BiomeIndex { get; set; } // index into biome palette
    [Export] public bool HasWallNorth { get; set; }
    [Export] public bool HasWallEast { get; set; }
    [Export] public bool HasWallSouth { get; set; }
    [Export] public bool HasWallWest { get; set; }
}
