using Godot;
using MegabonkClone.Core;
using MegabonkClone.Effects;
using MegabonkClone.Systems;

namespace MegabonkClone.Entities;

/// <summary>
/// Silver Coin pickup — rare meta-progression currency dropped by breakable
/// pots, challenges, and "Silver Tome" upgrades. Persists between runs.
/// </summary>
public partial class SilverCoin : Area3D
{
    public const string GroupName = "xp_orbs";

    [Export] public float Acceleration = 20f;
    [Export] public float MaxSpeed = 18f;
    [Export] public float PickupRadius = 1f;
    [Export] public float MaxLifetime = 30f;

    private int _value = 1;
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
            if (_age >= MaxLifetime) { ObjectPool.Instance.Release(this); return; }

            // Silver coins bob up and down gently
            Position = new Vector3(Position.X, Position.Y + Mathf.Sin(_age * 3f) * 0.003f, Position.Z);
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
        if (body is Player) Collect();
    }

    private void Collect()
    {
        PlayerStats.Instance.AddSilverCoins(_value);
        VFXManager.Instance?.SpawnGoldTrail(GlobalPosition);
        AudioManager.Instance?.PlaySfx(SfxKind.LevelUp, pitch: 1.5f, volumeDb: -4f);
        GameEvents.EmitGoldChanged(PlayerStats.Instance.Gold);
        ObjectPool.Instance.Release(this);
    }
}
