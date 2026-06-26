using Godot;
using MegabonkClone.Core;

namespace MegabonkClone.Core;

/// <summary>
/// Entry point autoload. Clears stale event listeners, ensures the game
/// starts in MainMenu state, then loads the main menu scene.
///
/// GameManager is already an autoload — we do NOT create it here.
/// </summary>
public partial class GameBootstrap : Node
{
    public override void _Ready()
    {
        GD.Print("=========================================================");
        GD.Print("MEGABONK 2026 — Game Bootstrap");
        GD.Print("=========================================================");

        // Clear stale event listeners from any previous scene.
        GameEvents.ClearAll();

        // Ensure GameManager starts in MainMenu state.
        GameManager.Instance?.SetState(GameState.MainMenu);

        // Load main menu scene.
        CallDeferred(MethodName.LoadMainMenuScene);
    }

    private void LoadMainMenuScene()
    {
        // If MainMenu scene exists, load it; otherwise fall back to Main.
        var menuPath = "res://Scenes/UI/MainMenu.tscn";
        if (ResourceLoader.Exists(menuPath))
        {
            GetTree().ChangeSceneToFile(menuPath);
        }
        else
        {
            // No menu scene yet — go straight to gameplay.
            GetTree().ChangeSceneToFile("res://Scenes/Main.tscn");
        }
    }
}
