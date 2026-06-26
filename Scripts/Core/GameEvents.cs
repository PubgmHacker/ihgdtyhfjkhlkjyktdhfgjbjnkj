using System;
using Godot;

namespace MegabonkClone.Core;

/// <summary>
/// Global loosely-coupled event bus (Observer pattern). Any system can
/// subscribe/publish without holding references to each other. Keeps the
/// GameManager a thin coordinator instead of a god object.
///
/// Usage:
///   GameEvents.EnemyDied += OnEnemyDied;
///   GameEvents.EmitEnemyDied(enemy);
/// </summary>
public static class GameEvents
{
    // ---- Enemy events ----
    public static event Action<Entities.Enemy>? EnemyDied;
    public static void EmitEnemyDied(Entities.Enemy e) => EnemyDied?.Invoke(e);

    // ---- Player events ----
    public static event Action<int>? PlayerLevelledUp;
    public static void EmitPlayerLevelledUp(int level) => PlayerLevelledUp?.Invoke(level);

    public static event Action<float>? PlayerDamaged;
    public static void EmitPlayerDamaged(float amount) => PlayerDamaged?.Invoke(amount);

    public static event Action? PlayerDied;
    public static void EmitPlayerDied() => PlayerDied?.Invoke();

    // ---- Wave events ----
    public static event Action<int, int>? WaveStarted;   // (index, total)
    public static void EmitWaveStarted(int idx, int total) => WaveStarted?.Invoke(idx, total);

    public static event Action<int>? WaveCleared;
    public static void EmitWaveCleared(int idx) => WaveCleared?.Invoke(idx);

    public static event Action? AllWavesCleared;
    public static void EmitAllWavesCleared() => AllWavesCleared?.Invoke();

    // ---- Flow events ----
    public static event Action<GameState>? StateChanged;
    public static void EmitStateChanged(GameState s) => StateChanged?.Invoke(s);

    // ---- Economy events ----
    public static event Action<int>? GoldChanged;
    public static void EmitGoldChanged(int total) => GoldChanged?.Invoke(total);

    // ---- Utility ----
    /// <summary>Unsubscribe every listener. Call on scene change to avoid leaks.</summary>
    public static void ClearAll()
    {
        EnemyDied = null;
        PlayerLevelledUp = null;
        PlayerDamaged = null;
        PlayerDied = null;
        WaveStarted = null;
        WaveCleared = null;
        AllWavesCleared = null;
        StateChanged = null;
        GoldChanged = null;
        GD.Print("[GameEvents] All listeners cleared.");
    }
}
