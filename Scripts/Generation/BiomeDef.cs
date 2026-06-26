using Godot;

namespace MegabonkClone.Generation;

/// <summary>
/// Defines a biome type with its visual appearance and decoration rules.
/// </summary>
[GlobalClass]
public partial class BiomeDef : Resource
{
    [Export] public string BiomeName { get; set; } = "Grassland";
    [Export] public Color FloorColor { get; set; } = new Color(0.22f, 0.38f, 0.18f);
    [Export] public Color FloorColorAlt { get; set; } = new Color(0.26f, 0.42f, 0.20f);
    [Export] public Color WallColor { get; set; } = new Color(0.35f, 0.30f, 0.25f);
    [Export] public Color WallTopColor { get; set; } = new Color(0.45f, 0.40f, 0.32f);
    [Export] public Color DecoColor1 { get; set; } = new Color(0.15f, 0.50f, 0.15f);
    [Export] public Color DecoColor2 { get; set; } = new Color(0.10f, 0.35f, 0.12f);
    [Export] public float Roughness { get; set; } = 0.85f;
    [Export] public float Metallic { get; set; } = 0.0f;
    [Export] public float DecoDensity { get; set; } = 0.12f; // probability per tile
    [Export] public float DecoScaleMin { get; set; } = 0.15f;
    [Export] public float DecoScaleMax { get; set; } = 0.4f;
}
