using Godot;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MegabonkClone.Systems;

/// <summary>
/// JSON persistence for gold + stage progress (Autoload singleton).
/// Uses System.Text.Json for clean typed (de)serialization. The file lives
/// in user:// which maps to Application.persistentDataPath on every platform.
/// Ported from the Unity SaveManager.
/// </summary>
public partial class SaveManager : Node
{
    public static SaveManager Instance { get; private set; } = null!;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private string _path = "";

    public override void _Ready()
    {
        Instance = this;
        _path = ProjectSettings.GlobalizePath("user://playerStats.json");
    }

    // ---------------- Player ----------------
    public void SavePlayer(PlayerStats stats)
    {
        var data = new PlayerSaveData
        {
            Gold = stats.Gold,
            SilverCoins = stats.SilverCoins,
            StageCleared = stats.StageCleared,
        };
        File.WriteAllText(_path, JsonSerializer.Serialize(data, JsonOpts));
    }

    public PlayerSaveData LoadPlayer()
    {
        try
        {
            if (!File.Exists(_path)) return new PlayerSaveData();
            var json = File.ReadAllText(_path);
            var data = JsonSerializer.Deserialize<PlayerSaveData>(json);
            if (data == null) return new PlayerSaveData();

            // Migration: if SilverCoins key is missing from old saves, default to 0
            data.SilverCoins ??= 0;
            return data;
        }
        catch (System.Exception e)
        {
            GD.PrintErr($"[SaveManager] Failed to load player save: {e.Message}");
            return new PlayerSaveData();
        }
    }

    public void DeleteSave()
    {
        if (File.Exists(_path)) File.Delete(_path);
    }
}

/// <summary>Serialized player progression data.</summary>
public class PlayerSaveData
{
    public int Gold { get; set; }
    public int? SilverCoins { get; set; }
    public int StageCleared { get; set; }
}
