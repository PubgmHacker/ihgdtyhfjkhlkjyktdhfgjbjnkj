using Godot;

namespace MegabonkClone.Effects;

/// <summary>
/// A single floating damage/heal number that drifts upward and fades out.
/// Spawned by <see cref="FloatingTextManager"/>. Code-built, no .tscn needed.
/// </summary>
public partial class FloatingText : Label
{
    public float Lifetime { get; set; } = 0.8f;
    public Vector3 WorldOffset { get; set; } = new(0, 1.5f, 0);

    private float _age;
    private Node3D? _anchor;
    private Vector3 _velocity = new(0, 2.5f, 0);
    private Vector2 _screenOffset;
    private bool _detached;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        _age += dt;

        if (!_detached && _anchor != null && IsInstanceValid(_anchor))
        {
            var cam = GetViewport().GetCamera3D();
            if (cam == null) { QueueFree(); return; }
            Vector3 worldPos = _anchor.GlobalPosition + WorldOffset + _velocity * _age;
            _screenOffset = cam.UnprojectPosition(worldPos);
        }

        float progress = _age / Lifetime;
        Modulate = new Color(1, 1, 1, 1f - progress);
        // Drift up on screen.
        Position = _screenOffset + new Vector2(-Size.X / 2f, -Size.Y / 2f - 40f * _age);

        if (_age >= Lifetime)
            QueueFree();
    }

    /// <summary>Anchor to a Node3D so the number tracks its world position.</summary>
    public void AttachTo(Node3D target)
    {
        _anchor = target;
        target.TreeExiting += () => { _detached = true; };
    }
}
