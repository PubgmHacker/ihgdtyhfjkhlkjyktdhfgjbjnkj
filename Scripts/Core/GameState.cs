namespace MegabonkClone.Core;

/// <summary>
/// Discrete game flow states. Transitions are guarded by <see cref="GameManager"/>.
/// </summary>
public enum GameState
{
    Booting,     // project just started, no scene loaded
    MainMenu,    // menu screen (future)
    Playing,     // active gameplay
    LevelUp,     // upgrade draft shown, simulation frozen
    Paused,      // user pause
    GameOver,    // player died or all waves cleared
    Victory,     // all waves cleared alive
}
