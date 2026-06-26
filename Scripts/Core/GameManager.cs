using Godot;
using MegabonkClone.Core;
using MegabonkClone.Entities;
using MegabonkClone.Effects;
using MegabonkClone.Systems;
using System;

namespace MegabonkClone.Core;

/// <summary>
/// Central game coordinator. Manages game state transitions, kill tracking,
/// run lifecycle, and pause control. Singleton autoload.
/// </summary>
public partial class GameManager : Node
{
	public static GameManager Instance { get; private set; } = null!;

	public Player ActivePlayer { get; set; } = null!;
	public bool IsPaused { get; private set; }

	/// <summary>Current game flow state.</summary>
	public GameState CurrentState { get; private set; } = GameState.Booting;

	/// <summary>Total kills this run (used for scoring).</summary>
	public int KillCount { get; private set; }

	/// <summary>Current wave index (1-based) for UI display.</summary>
	public int CurrentWave { get; set; }
	public int TotalWaves { get; set; }

	public override void _Ready()
	{
		Instance = this;
		GD.Print("[GameManager] Megabonk 2026 initialized.");
	}

	/// <summary>Transition to a new state. Guards against invalid transitions.</summary>
	public void SetState(GameState newState)
	{
		if (CurrentState == newState) return;

		// Validate transition.
		bool valid = (CurrentState, newState) switch
		{
			(GameState.Booting, GameState.Playing) => true,
			(GameState.MainMenu, GameState.Playing) => true,
			(GameState.Playing, GameState.Paused) => true,
			(GameState.Playing, GameState.LevelUp) => true,
			(GameState.Playing, GameState.GameOver) => true,
			(GameState.Playing, GameState.Victory) => true,
			(GameState.Paused, GameState.Playing) => true,
			(GameState.Paused, GameState.GameOver) => true,
			(GameState.LevelUp, GameState.Playing) => true,
			(GameState.LevelUp, GameState.GameOver) => true,
			_ => false,
		};

		if (!valid)
		{
			GD.PrintErr($"[GameManager] Invalid transition: {CurrentState} -> {newState}");
			return;
		}

		var oldState = CurrentState;
		CurrentState = newState;
		GameEvents.EmitStateChanged(newState);
		GD.Print($"[GameManager] State: {oldState} -> {newState}");
	}

	/// <summary>Called when a run starts. Resets run-scoped stats.</summary>
	public void StartRun()
	{
		KillCount = 0;
		CurrentWave = 0;
		TotalWaves = 0;
		IsPaused = false;

		PlayerStats.Instance?.ResetForNewRun();
		ObjectPool.Instance?.Clear();
		GameEvents.ClearAll();

		SetState(GameState.Playing);
	}

	/// <summary>Called when the player dies.</summary>
	public void EndRun()
	{
		if (CurrentState == GameState.GameOver) return;
		SetState(GameState.GameOver);
		IsPaused = true;

		AudioManager.Instance?.PlaySfx(SfxKind.GameOver);
		GD.Print($"[GameManager] Run over. Kills: {KillCount}, Level: {PlayerStats.Instance?.Level}");
	}

	/// <summary>Called when all waves are cleared alive.</summary>
	public void Victory()
	{
		if (CurrentState == GameState.Victory) return;
		SetState(GameState.Victory);
		IsPaused = true;

		if (PlayerStats.Instance != null)
			PlayerStats.Instance.StageCleared = Mathf.Max(PlayerStats.Instance.StageCleared, CurrentWave);
		PlayerStats.Instance?.Save();

		AudioManager.Instance?.PlaySfx(SfxKind.LevelUp);
		GD.Print($"[GameManager] Victory! Kills: {KillCount}, Level: {PlayerStats.Instance?.Level}");
	}

	/// <summary>Pauses gameplay for level-up draft.</summary>
	public void EnterLevelUp()
	{
		if (CurrentState != GameState.Playing) return;
		IsPaused = true;
		SetState(GameState.LevelUp);
		GetTree().Paused = true;
	}

	/// <summary>Resumes gameplay after upgrade selection.</summary>
	public void ExitLevelUp()
	{
		if (CurrentState != GameState.LevelUp) return;
		GetTree().Paused = false;
		SetState(GameState.Playing);
	}

	/// <summary>Toggles user pause.</summary>
	public void TogglePause()
	{
		if (CurrentState is GameState.GameOver or GameState.Victory or GameState.LevelUp) return;

		if (CurrentState == GameState.Paused)
		{
			GetTree().Paused = false;
			IsPaused = false;
			SetState(GameState.Playing);
		}
		else if (CurrentState == GameState.Playing)
		{
			GetTree().Paused = true;
			IsPaused = true;
			SetState(GameState.Paused);
		}
	}

	/// <summary>Tracks a kill. Called by Enemy.Die().</summary>
	public void RegisterKill()
	{
		KillCount++;
		// GameEvents.EmitEnemyDied is called by Enemy itself before this.
	}
}
