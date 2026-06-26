using System.Collections.Generic;
using Godot;
using MegabonkClone.Core;
using MegabonkClone.Entities;

namespace MegabonkClone.UI;

/// <summary>
/// Code-built top-down minimap. Draws the player (cyan dot), enemies
/// (red dots) and XP orbs (yellow dots) as colored pixels on a dark panel.
/// Lightweight: redraws at ~10fps via timer, not every frame.
/// </summary>
public partial class Minimap : Panel
{
    private static readonly Color PlayerColor = new(0.30f, 0.80f, 1.00f);
    private static readonly Color EnemyColor = new(1.00f, 0.25f, 0.25f);
    private static readonly Color XpColor    = new(1.00f, 0.85f, 0.30f);
    private static readonly Color BgColor    = new(0.04f, 0.05f, 0.08f, 0.85f);
    private static readonly Color BorderColor= new(0.30f, 0.80f, 1.00f, 0.6f);
    private static readonly Color GridColor  = new(1f, 1f, 1f, 0.05f);

    private float _worldRadius = 35f; // half-extent of arena shown on map
    private float _redrawAccum;
    private const float RedrawInterval = 0.1f;

    public Minimap()
    {
        AddThemeStyleboxOverride("panel", new StyleBoxFlat
        {
            BgColor = BgColor,
            BorderWidthLeft = 2, BorderWidthRight = 2,
            BorderWidthTop = 2, BorderWidthBottom = 2,
            BorderColor = BorderColor,
            CornerRadiusTopLeft = 10, CornerRadiusTopRight = 10,
            CornerRadiusBottomLeft = 10, CornerRadiusBottomRight = 10,
        });
    }

    public override void _Process(double delta)
    {
        _redrawAccum += (float)delta;
        if (_redrawAccum >= RedrawInterval)
        {
            _redrawAccum = 0f;
            QueueRedraw();
        }
    }

    public override void _Draw()
    {
        Vector2 center = Size * 0.5f;
        float scale = (Mathf.Min(Size.X, Size.Y) * 0.5f) / _worldRadius;

        // Grid lines for spatial reference.
        for (int i = -3; i <= 3; i++)
        {
            float o = i * (Size.X * 0.5f / 3f);
            DrawLine(center + new Vector2(o, -center.Y), center + new Vector2(o, center.Y), GridColor);
            DrawLine(center + new Vector2(-center.X, o), center + new Vector2(center.X, o), GridColor);
        }

        Vector3 playerPos = GameManager.Instance.ActivePlayer?.GlobalPosition ?? Vector3.Zero;

        // Player as a bright pulsing dot + direction ring.
        Vector2 pScreen = WorldToMap(playerPos, center, scale);
        DrawCircle(pScreen, 5f, PlayerColor);
        DrawArc(pScreen, 8f, 0, Mathf.Tau, 24, PlayerColor * 0.5f, 1.5f);

        // Enemies.
        var ctrl = EnemyController.Instance;
        if (ctrl != null)
        {
            foreach (var e in ctrl.ActiveEnemies)
            {
                if (!IsInstanceValid(e) || !e.IsAlive) continue;
                DrawCircle(WorldToMap(e.GlobalPosition, center, scale), 2.5f, EnemyColor);
            }
        }

        // XP orbs (limited count for perf).
        int orbCount = 0;
        foreach (var node in GetTree().GetNodesInGroup("xp_orbs"))
        {
            if (node is Node3D n3d)
            {
                DrawCircle(WorldToMap(n3d.GlobalPosition, center, scale), 1.5f, XpColor);
                if (++orbCount > 120) break;
            }
        }
    }

    private Vector2 WorldToMap(Vector3 world, Vector2 center, float scale)
    {
        // Top-down: X->map X, Z->map Y (flipped so up = -Z / forward).
        return center + new Vector2(world.X * scale, world.Z * scale);
    }
}
