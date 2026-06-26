using System.Collections.Generic;
using Godot;
using MegabonkClone.Core;
using MegabonkClone.Data;
using MegabonkClone.Entities;

namespace MegabonkClone.Generation;

/// <summary>
/// Drives the run: spawns enemies according to a list of <see cref="WaveDef"/>.
/// Ported from the Unity WaveSpawner3D. Handles streaming + spawn-all modes,
/// timer/clear end conditions, difficulty ramp, and emits signals for UI.
/// </summary>
public partial class WaveManager : Node
{
    [Export] public Godot.Collections.Array<WaveDef> Waves = new();
    [Export] public float FirstWaveDelay = 2f;
    [Export] public bool AutoAdvance = true;

    /// <summary>Min/Max ring radius around the player to spawn enemies.</summary>
    [Export] public Vector2 AroundPlayerRadius = new(15f, 25f);

    private int _currentWaveIndex = -1;
    private int _spawnedThisWave;
    private int _livingEnemies;
    private float _nextSpawnAt;
    private float _waveEndsAt;
    private readonly System.Random _rng = new();

    [Signal] public delegate void WaveStartedEventHandler(int index, int total);
    [Signal] public delegate void WaveCompletedEventHandler(int index);
    [Signal] public delegate void AllWavesCompletedEventHandler();
    [Signal] public delegate void EnemySpawnedEventHandler();

    public override void _Ready()
    {
        if (Waves.Count == 0)
        {
            GD.Print("[WaveManager] No waves assigned — generating default wave set.");
            Waves = BuildDefaultWaves();
        }
        // Kick off after the initial delay.
        CallDeferred(nameof(StartNextWave));
    }

    /// <summary>
    /// Builds a playable default wave progression so the game works out of the
    /// box without manually-authored .tres resources. Escalates in difficulty.
    /// </summary>
    private Godot.Collections.Array<WaveDef> BuildDefaultWaves()
    {
        var swarm = BuildEnemyDef("Swarm", "res://Scenes/Entities/SwarmUnit.tscn",
            hp: 12, speed: 7, dmg: 4, xp: 5, gold: 1);
        var melee = BuildEnemyDef("Melee", "res://Scenes/Entities/MeleeCharger.tscn",
            hp: 25, speed: 6, dmg: 6, xp: 8, gold: 2);
        var tank = BuildEnemyDef("Tank", "res://Scenes/Entities/TankEnemy.tscn",
            hp: 250f, speed: 1.8f, dmg: 25f, xp: 20, gold: 5);
        var ranged = BuildEnemyDef("Ranged", "res://Scenes/Entities/RangedShooter.tscn",
            hp: 40f, speed: 3.5f, dmg: 12f, xp: 10, gold: 3);
        var boss = BuildEnemyDef("Boss", "res://Scenes/Entities/Boss.tscn",
            hp: 1500f, speed: 2.5f, dmg: 30f, xp: 100, gold: 30);

        var waves = new Godot.Collections.Array<WaveDef>();

        // Wave 1: swarm intro
        waves.Add(BuildWave(15, 0.4f, 20f, 1f, (swarm, 100)));
        // Wave 2: swarm + a few melee
        waves.Add(BuildWave(22, 0.35f, 25f, 1.1f, (swarm, 70), (melee, 30)));
        // Wave 3: melee-heavy
        waves.Add(BuildWave(20, 0.5f, 25f, 1.25f, (melee, 60), (swarm, 40)));
        // Wave 4: ranged introduce
        waves.Add(BuildWave(25, 0.45f, 30f, 1.4f, (melee, 40), (ranged, 40), (swarm, 20)));
        // Wave 5: tank appears
        waves.Add(BuildWave(18, 0.6f, 30f, 1.6f, (tank, 30), (melee, 50), (ranged, 20)));
        // Wave 6: mixed pressure
        waves.Add(BuildWave(35, 0.35f, 35f, 1.8f, (swarm, 40), (melee, 30), (ranged, 30)));
        // Wave 7: BOSS
        waves.Add(BuildWave(1, 1f, 999f, 2.0f, WaveEndCondition.Clear, (boss, 100)));

        return waves;
    }

    private static EnemyDef BuildEnemyDef(string id, string prefabPath,
        float hp, float speed, float dmg, int xp, int gold)
    {
        var def = new EnemyDef
        {
            Id = id,
            DisplayName = id,
            Prefab = GD.Load<PackedScene>(prefabPath),
            MaxHealth = hp,
            MoveSpeed = speed,
            AttackRange = 2f,
            AttackSpeed = dmg > 20 ? 0.6f : 1.5f,
            Damage = dmg,
            XPValue = xp,
            GoldValue = gold,
            GoldDropChance = 40,
        };
        return def;
    }

    private static WaveDef BuildWave(int count, float interval, float duration,
        float difficulty, params (EnemyDef def, int weight)[] choices)
        => BuildWave(count, interval, duration, difficulty, WaveEndCondition.Timer, choices);

    private static WaveDef BuildWave(int count, float interval, float duration,
        float difficulty, WaveEndCondition end, params (EnemyDef def, int weight)[] choices)
    {
        var wave = new WaveDef
        {
            EnemyCount = count,
            SpawnInterval = interval,
            WaveDuration = duration,
            DifficultyMultiplier = difficulty,
            EndCondition = end,
        };
        foreach (var (def, weight) in choices)
        {
            wave.Choices.Add(new WaveEnemyChoice { Def = def, Weight = weight });
        }
        return wave;
    }

    public override void _Process(double delta)
    {
        if (_currentWaveIndex < 0 || _currentWaveIndex >= Waves.Count) return;
        if (GameManager.Instance.ActivePlayer == null) return;

        var wave = Waves[_currentWaveIndex];

        // Streaming mode: spawn over time until count reached.
        float time = Time.GetTicksMsec() / 1000f;
        if (!wave.SpawnAllAtOnce && time >= _nextSpawnAt && _spawnedThisWave < wave.EnemyCount)
        {
            SpawnOne(wave);
            _nextSpawnAt = time + wave.SpawnInterval;
        }

        // End conditions.
        bool timeExpired = time >= _waveEndsAt;
        bool allSpawned = _spawnedThisWave >= wave.EnemyCount;
        bool cleared = _livingEnemies <= 0;

        bool done = wave.EndCondition == WaveEndCondition.Timer
            ? timeExpired
            : (allSpawned && cleared);

        if (done) CompleteWave();
    }

    private void StartNextWave()
    {
        // Honor the first-wave delay.
        if (_currentWaveIndex == -1)
        {
            GetTree().CreateTimer(FirstWaveDelay).Timeout += () => ActuallyStartNext();
            return;
        }
        ActuallyStartNext();
    }

    private void ActuallyStartNext()
    {
        _currentWaveIndex++;
        if (_currentWaveIndex >= Waves.Count)
        {
            EmitSignal(SignalName.AllWavesCompleted);
            GameManager.Instance.EndRun();
            return;
        }

        var wave = Waves[_currentWaveIndex];
        _spawnedThisWave = 0;
        _livingEnemies = 0;

        float time = Time.GetTicksMsec() / 1000f;
        _waveEndsAt = time + wave.WaveDuration;
        _nextSpawnAt = time + (wave.SpawnAllAtOnce ? 0f : wave.SpawnInterval);

        if (wave.SpawnAllAtOnce)
            for (int i = 0; i < wave.EnemyCount; i++)
                SpawnOne(wave);

        EmitSignal(SignalName.WaveStarted, _currentWaveIndex + 1, Waves.Count);
    }

    private void CompleteWave()
    {
        EmitSignal(SignalName.WaveCompleted, _currentWaveIndex + 1);
        if (AutoAdvance) StartNextWave();
    }

    private void SpawnOne(WaveDef wave)
    {
        var choice = PickEnemy(wave.Choices);
        if (choice?.Def == null) return;

        var prefab = choice.Def.GetPrefab();
        if (prefab == null) return;

        if (!TryGetSpawnPoint(out Vector3 pos)) return;

        var go = ObjectPool.Instance.Spawn(prefab, pos, Vector3.Zero);
        bool isRare = choice.Def.RarePrefab != null && prefab == choice.Def.RarePrefab;

        if (go is Enemy enemy)
        {
            enemy.Initialize(choice.Def, isRare, wave.DifficultyMultiplier);
            // Track death so "Clear" end condition works.
            enemy.TreeExited += () => _livingEnemies = Mathf.Max(0, _livingEnemies - 1);
        }

        _spawnedThisWave++;
        _livingEnemies++;
        EmitSignal(SignalName.EnemySpawned);
    }

    private WaveEnemyChoice? PickEnemy(Godot.Collections.Array<WaveEnemyChoice> choices)
    {
        if (choices.Count == 0) return null;
        int total = 0;
        foreach (var c in choices) total += Mathf.Max(0, c.Weight);
        if (total <= 0) return null;

        int roll = _rng.Next(1, total + 1);
        foreach (var c in choices)
        {
            roll -= Mathf.Max(0, c.Weight);
            if (roll <= 0) return c;
        }
        return choices[0];
    }

    private bool TryGetSpawnPoint(out Vector3 pos)
    {
        var player = GameManager.Instance.ActivePlayer;
        if (player == null) { pos = Vector3.Zero; return false; }

        float r = (float)_rng.NextDouble() *
            (AroundPlayerRadius.Y - AroundPlayerRadius.X) + AroundPlayerRadius.X;
        double a = _rng.NextDouble() * System.Math.PI * 2;
        pos = player.GlobalPosition + new Vector3(Mathf.Cos((float)a) * r, 0, Mathf.Sin((float)a) * r);
        return true;
    }

    /// <summary>Tracks enemy deaths to keep _livingEnemies accurate.</summary>
    public void NotifyEnemyDeath() => _livingEnemies = Mathf.Max(0, _livingEnemies - 1);
}
