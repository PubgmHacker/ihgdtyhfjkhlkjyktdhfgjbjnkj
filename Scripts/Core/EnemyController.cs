using System.Collections.Generic;
using Godot;
using MegabonkClone.Entities;

namespace MegabonkClone.Core;

/// <summary>
/// Centralized tick driver for all active enemies. Instead of each enemy
/// running its own _PhysicsProcess, they register here and we iterate them
/// in one pass — exactly like the Unity BeanController. This drastically
/// reduces per-node overhead and lets us throttle updates (beansPerFrame)
/// to keep frame rate stable with hundreds of enemies.
/// </summary>
public partial class EnemyController : Node
{
    public static EnemyController Instance { get; private set; } = null!;

    /// <summary>
    /// 0 = tick every enemy each physics frame (default).
    /// &gt;0 = only tick that many enemies per frame, round-robin (chunked).
    /// Higher values = lower CPU but enemy movement updates are spread out.
    /// </summary>
    [Export] public int EnemiesPerFrame { get; set; } = 0;

    private readonly List<Enemy> _enemies = new();
    private int _tickIndex;
    private Vector3 _playerPos;

    public override void _Ready() => Instance = this;

    public void Register(Enemy enemy)
    {
        if (!_enemies.Contains(enemy))
            _enemies.Add(enemy);
    }

    public void Unregister(Enemy enemy)
    {
        _enemies.Remove(enemy);
        if (_tickIndex >= _enemies.Count) _tickIndex = 0;
    }

    /// <summary>All currently active enemies (read-only access).</summary>
    public IReadOnlyList<Enemy> ActiveEnemies => _enemies;

    public override void _PhysicsProcess(double delta)
    {
        if (_enemies.Count == 0) return;

        var player = GameManager.Instance.ActivePlayer;
        if (player == null) return;
        _playerPos = player.GlobalPosition;

        float dt = (float)delta;

        if (EnemiesPerFrame <= 0)
        {
            // Tick everything this frame.
            for (int i = 0; i < _enemies.Count; i++)
                if (_enemies[i].IsAlive)
                    _enemies[i].Tick(_playerPos, dt);
        }
        else
        {
            // Chunked round-robin: spread work across frames.
            int count = Mathf.Min(EnemiesPerFrame, _enemies.Count);
            for (int i = 0; i < count; i++)
            {
                var e = _enemies[_tickIndex];
                if (e.IsAlive)
                    e.Tick(_playerPos, dt);
                _tickIndex++;
                if (_tickIndex >= _enemies.Count) _tickIndex = 0;
            }
        }
    }
}
