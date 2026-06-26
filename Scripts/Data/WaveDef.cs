using Godot;

namespace MegabonkClone.Data;

/// <summary>
/// How a wave decides it is over. Timer = ends after a duration;
/// Clear = ends once all spawned enemies are dead.
/// </summary>
public enum WaveEndCondition { Timer, Clear }

/// <summary>
/// One enemy entry inside a wave, weighted for random selection.
/// </summary>
[GlobalClass]
public partial class WaveEnemyChoice : Resource
{
    [Export] public EnemyDef? Def;
    [Export(PropertyHint.Range, "0,100")] public int Weight = 50;
}

/// <summary>
/// Definition of a single wave. Ported from the Unity Wave3D struct.
/// The <see cref="Generation.WaveManager"/> iterates a list of these.
/// </summary>
[GlobalClass]
public partial class WaveDef : Resource
{
    [Export] public Godot.Collections.Array<WaveEnemyChoice> Choices = new();

    [ExportGroup("Counts & Timing")]
    [Export] public int EnemyCount = 10;
    /// <summary>If true, all enemies spawn instantly at wave start.</summary>
    [Export] public bool SpawnAllAtOnce;
    /// <summary>Interval between streamed spawns (when not SpawnAllAtOnce).</summary>
    [Export] public float SpawnInterval = 0.5f;
    [Export] public float WaveDuration = 25f;
    [Export] public WaveEndCondition EndCondition = WaveEndCondition.Timer;

    /// <summary>Health/damage multiplier for this wave (difficulty ramp).</summary>
    [Export] public float DifficultyMultiplier = 1f;
}
