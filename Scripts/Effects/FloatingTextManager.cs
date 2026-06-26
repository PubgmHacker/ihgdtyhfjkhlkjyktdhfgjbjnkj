using Godot;

namespace MegabonkClone.Effects;

/// <summary>
/// Manages floating damage/heal numbers. Singleton attached to the HUD canvas
/// layer so all numbers render on top of gameplay. Pool-free (numbers auto-free
/// via FloatingText._PhysicsProcess); cheap enough for MVP burst rates.
/// </summary>
public partial class FloatingTextManager : Node
{
    public static FloatingTextManager Instance { get; private set; } = null!;

    private CanvasLayer? _layer;

    public override void _Ready() => Instance = this;

    /// <summary>Bind the canvas layer that floating numbers parent to.</summary>
    public void SetLayer(CanvasLayer layer) => _layer = layer;

    /// <summary>Shows a floating damage number above the target.</summary>
    public void ShowDamage(Node3D target, float amount, bool isCrit = false)
    {
        var txt = Create(isCrit ? 28 : 20, isCrit ? Colors.Yellow : Colors.White);
        txt.Text = Mathf.RoundToInt(amount).ToString();
        txt.AttachTo(target);
    }

    public void ShowHeal(Node3D target, float amount)
    {
        var txt = Create(18, new Color(0.3f, 1f, 0.4f));
        txt.Text = $"+{Mathf.RoundToInt(amount)}";
        txt.AttachTo(target);
    }

    public void ShowXPGain(Node3D target, int amount)
    {
        var txt = Create(14, new Color(0.4f, 0.7f, 1f));
        txt.Text = $"+{amount} XP";
        txt.AttachTo(target);
    }

    private FloatingText Create(int fontSize, Color color)
    {
        var node = new FloatingText
        {
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };
        node.AddThemeFontSizeOverride("font_size", fontSize);
        node.AddThemeColorOverride("font_color", color);
        node.AddThemeColorOverride("font_outline_color", new Color(0, 0, 0, 0.8f));
        node.AddThemeConstantOverride("outline_size", 4);

        var parent = _layer as Node ?? this;
        parent.AddChild(node);
        return node;
    }
}
