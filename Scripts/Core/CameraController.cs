using Godot;
using MegabonkClone.Core;

namespace MegabonkClone.Core;

/// <summary>
/// Top-down follow camera. Smoothly tracks the player from an angled
/// overhead view. Mouse wheel zooms in/out within a clamped range.
/// Attach to a Camera3D that is a child of the Game scene (not the player,
/// so the camera doesn't inherit dash velocity).
/// </summary>
public partial class CameraController : Camera3D
{
	[Export] public Vector3 Offset = new(0, 22f, 14f);
	[Export] public float FollowLerp = 6f;
	[Export] public float MinZoom = 12f;
	[Export] public float MaxZoom = 32f;
	[Export] public float ZoomStep = 2f;
	[Export] public float ZoomLerp = 8f;

	/// <summary>External offset applied by ScreenShake.</summary>
	public Vector3 PositionOffset { get; set; }

	private float _targetZoom;

	public override void _Ready()
	{
		_targetZoom = Offset.Length();
	}

	public override void _PhysicsProcess(double delta)
	{
		var player = GameManager.Instance.ActivePlayer;
		if (player == null) return;

		float dt = (float)delta;

		// Position follows the player with smoothing.
		Vector3 desired = player.GlobalPosition + Offset + PositionOffset;
		GlobalPosition = GlobalPosition.Lerp(desired, FollowLerp * dt);

		// Zoom via mouse wheel.
		Vector2 wheel = Input.GetVector("ui_page_up", "ui_page_down", "ui_page_up", "ui_page_down");
		// Godot has no built-in wheel action; handle it in _Input instead.
	}

	public override void _Input(InputEvent @event)
	{
		if (@event is InputEventMouseButton mb && mb.Pressed)
		{
			if (mb.ButtonIndex == MouseButton.WheelUp)
				_targetZoom = Mathf.Max(MinZoom, _targetZoom - ZoomStep);
			else if (mb.ButtonIndex == MouseButton.WheelDown)
				_targetZoom = Mathf.Min(MaxZoom, _targetZoom + ZoomStep);
		}
	}

	/// <summary>Recompute the offset direction each frame to apply zoom.</summary>
	public override void _Process(double delta)
	{
		float dt = (float)delta;
		// Smoothly interpolate current offset length toward target zoom.
		Vector3 dir = Offset.Normalized();
		float cur = Offset.Length();
		cur = Mathf.Lerp(cur, _targetZoom, ZoomLerp * dt);
		Offset = dir * cur;
	}
}
