using Godot;
using MegabonkClone.Core;
using MegabonkClone.Systems;

namespace MegabonkClone.Entities;

/// <summary>
/// XP pickup orb dropped by enemies. Lies still until the player's magnet
/// pulls it, then accelerates toward the player and grants XP on contact.
/// </summary>
public partial class XPOrb : Area3D
{
    public const string GroupName = "xp_orbs";

    [Export] public float Acceleration = 25f;
    [Export] public float MaxSpeed = 20f;
    [Export] public float PickupRadius = 1f;
    [Export] public float MaxLifetime = 20f;

    private int _value;
    private bool _magnetized;
    private float _currentSpeed;
    private float _age;

    public override void _Ready()
    {
        AddToGroup(GroupName);
        BodyEntered += OnBodyEntered;
    }

    public void SetValue(int value) => _value = value;

    public void TryMagnetFrom(Vector3 playerPos, float magnetRadius)
    {
        if (_magnetized) return;
        if (GlobalPosition.DistanceSquaredTo(playerPos) <= magnetRadius * magnetRadius)
        {
            _magnetized = true;
            _currentSpeed = 0f;
        }
    }

    public override void _PhysicsProcess(double delta)
    {
        if (!_magnetized)
        {
            _age += (float)delta;
            if (_age >= MaxLifetime) ObjectPool.Instance.Release(this);
            return;
        }

        var player = GameManager.Instance.ActivePlayer;
        if (player == null) return;

        float dt = (float)delta;
        Vector3 toPlayer = player.GlobalPosition - GlobalPosition;
        float dist = toPlayer.Length();
        if (dist <= PickupRadius)
        {
            Collect();
            return;
        }
        Vector3 dir = toPlayer / dist;
        _currentSpeed = Mathf.Min(_currentSpeed + Acceleration * dt, MaxSpeed);
        GlobalPosition += dir * _currentSpeed * dt;
    }

    private void OnBodyEntered(Node body)
    {
        if (body is Player)
            Collect();
    }

    private void Collect()
    {
        PlayerStats.Instance.AddXP(_value);
        Effects.VFXManager.Instance?.SpawnXpTrail(GlobalPosition);
        AudioManager.Instance?.PlaySfx(SfxKind.XPPickup, pitch: 1f + (_value / 20f));
        ObjectPool.Instance.Release(this);
    }
}
