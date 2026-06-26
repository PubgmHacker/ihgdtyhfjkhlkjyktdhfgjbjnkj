using Godot;
using MegabonkClone.Core;
using MegabonkClone.Generation;
using MegabonkClone.Systems;
using MegabonkClone.UI;
using MegabonkClone.Effects;

namespace MegabonkClone.Core;

/// <summary>
/// Scene-level wiring. Lives in Main.tscn and connects the autoloads to the
/// scene-local systems (WaveManager, UpgradeSystem, HUD, Player, LevelUpDraftUI).
///
/// This keeps autoloads decoupled from scene structure while ensuring the
/// full gameplay loop is wired up every run.
/// </summary>
public partial class SceneWire : Node
{
    public override void _Ready()
    {
        CallDeferred(nameof(WireSystems));
    }

    private void WireSystems()
    {
        var gm = GameManager.Instance;
        if (gm == null) return;

        // --- Start the run ---
        gm.StartRun();

        // --- Connect WaveManager signals to events/state ---
        var waveMgr = GetNodeOrNull<WaveManager>("../WaveManager");
        if (waveMgr != null)
        {
            gm.TotalWaves = waveMgr.Waves.Count;
            waveMgr.WaveStarted += (idx, total) =>
            {
                gm.CurrentWave = idx;
                gm.TotalWaves = total;
                GameEvents.EmitWaveStarted(idx, total);
            };
            waveMgr.WaveCompleted += idx => GameEvents.EmitWaveCleared(idx);
            waveMgr.AllWavesCompleted += () =>
            {
                GameEvents.EmitAllWavesCleared();
                gm.Victory();
            };
        }

        // --- Connect PlayerStats level-up -> UpgradeSystem draft ---
        var upgradeSys = GetNodeOrNull<UpgradeSystem>("../UpgradeSystem");
        var stats = PlayerStats.Instance;
        if (upgradeSys != null && stats != null)
        {
            stats.LevelledUp += () =>
            {
                int level = stats.Level;
                GameEvents.EmitPlayerLevelledUp(level);
                upgradeSys.RequestDraft();
            };
        }

        // --- Connect HUD to game events ---
        var hud = GetNodeOrNull<HudController>("../CanvasLayer/Hud");
        if (hud != null)
        {
            hud.Bind(waveMgr!, upgradeSys!);
        }

        // --- Wire FloatingTextManager to the CanvasLayer ---
        var ftm = GetNodeOrNull<FloatingTextManager>("../CanvasLayer/FloatingTextManager");
        if (ftm != null)
        {
            var canvasLayer = GetNodeOrNull<CanvasLayer>("../CanvasLayer");
            if (canvasLayer != null)
                ftm.SetLayer(canvasLayer);
        }

        // --- Wire LevelUpDraftUI to UpgradeSystem ---
        var draftUI = GetNodeOrNull<LevelUpDraftUI>("../CanvasLayer/LevelUpDraftUI");
        if (draftUI != null && upgradeSys != null)
        {
            draftUI.Bind(upgradeSys);
        }

        // --- GameOver/Victory: add restart capability ---
        GameEvents.StateChanged += OnStateChanged;

        GD.Print("[SceneWire] Gameplay loop wired: waves, upgrades, HUD, draft UI, events.");
    }

    private void OnStateChanged(GameState state)
    {
        if (state is GameState.GameOver or GameState.Victory)
        {
            // Defer scene reload so UI has time to render the overlay.
            GetTree().CreateTimer(3.0).Timeout += () =>
            {
                if (GameManager.Instance.CurrentState == state)
                {
                    // Save before going back to menu
                    PlayerStats.Instance?.Save();
                    GetTree().ChangeSceneToFile("res://Scenes/UI/MainMenu.tscn");
                }
            };
        }
    }
}
