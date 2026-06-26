using Godot;
using MegabonkClone.Core;
using MegabonkClone.Effects;
using MegabonkClone.Systems;
using System;

namespace MegabonkClone.Entities;

/// <summary>
/// 3D player character. WASD movement, Space to jump, Shift to dash/slide.
/// Supports bunny-hopping momentum conservation and slide boost.
/// Auto-fires weapons via WeaponManager. Magnet pickup of XP/Gold orbs.
/// </summary>
public partial class Player : CharacterBody3D
{
	[ExportGroup("Movement")]
	[Export] public float BaseSpeed = 8f;
	[Export] public float DashSpeed = 25f;
	[Export] public float DashDuration = 0.15f;
	[Export] public float DashCooldown = 1.2f;
	[Export] public float MagnetRadius = 6f;
	[Export] public float JumpForce = 12f;
	[Export] public float SlideSpeedBoost = 1.6f;
	[Export] public float SlideDuration = 0.6f;
	[Export] public float SlideCooldown = 1.8f;
	[Export] public float BunnyHopBoost = 1.12f; // momentum multiplier per consecutive jump
	[Export] public float Gravity = 29.4f;
	[Export] public float GroundAccel = 10f;
	[Export] public float AirAccel = 6f;
	[Export] public float Friction = 8f;

	[ExportGroup("Visual")]
	[Export] public MeshInstance3D? BodyMesh;
	[Export] public Material? HitFlashMaterial;

	// --- Health ---
	public float MaxHealth { get; set; } = 100f;
	public float CurrentHealth { get; set; } = 100f;
	public bool IsAlive => CurrentHealth > 0;

	// --- Movement state ---
	public Vector3 LastMoveDirection { get; private set; } = Vector3.Forward;
	private Vector3 _wishDirection;
	private Vector3 _currentVelocity;
	private float _verticalVelocity;
	private bool _isOnFloor;
	private int _consecutiveJumps; // for bunny-hop tracking

	// --- Dash state ---
	private bool _isDashing;
	private float _dashTimer;
	private float _dashCooldownTimer;
	private float _dashSfxCooldown;

	// --- Slide state ---
	private bool _isSliding;
	private float _slideTimer;
	private float _slideCooldownTimer;
	private Vector3 _slideDirection;

	// --- Visual flash ---
	private Material? _baseMaterial;
	private float _flashTimer;
	private const float FlashDuration = 0.12f;

	// --- Scene cache for loot orbs ---
	public static PackedScene? XPOrbScene { get; private set; }
	public static PackedScene? GoldOrbScene { get; private set; }
	public static PackedScene? EnemyProjectileScene { get; private set; }

	public override void _Ready()
	{
		if (GameManager.Instance != null)
			GameManager.Instance.ActivePlayer = this;

		XPOrbScene ??= GD.Load<PackedScene>("res://Scenes/Entities/XPOrb.tscn");
		GoldOrbScene ??= GD.Load<PackedScene>("res://Scenes/Entities/GoldOrb.tscn");
		EnemyProjectileScene ??= GD.Load<PackedScene>("res://Scenes/Entities/EnemyProjectile.tscn");

		if (BodyMesh != null)
			_baseMaterial = BodyMesh.MaterialOverride;

		_currentVelocity = Vector3.Zero;
	}

	public override void _PhysicsProcess(double delta)
	{
		if (!IsAlive || GameManager.Instance.IsPaused) return;

		float dt = (float)delta;
		var stats = PlayerStats.Instance;

		// Health regen
		if (stats != null && stats.HealthRegen > 0f)
			Heal(stats.HealthRegen * dt);

		// Low HP post-process pulse
		if (stats != null)
			PostProcessManager.Instance?.SetLowHp(CurrentHealth < MaxHealth * 0.3f);

		// Magnet: pull nearby XP/Gold orbs
		float magnetR = MagnetRadius + (stats?.LuckBonus ?? 0f) * 0.5f;
		Vector3 pPos = GlobalPosition;
		foreach (var node in GetTree().GetNodesInGroup("xp_orbs"))
		{
			if (node is XPOrb xp)
				xp.TryMagnetFrom(pPos, magnetR);
			else if (node is GoldOrb gold)
				gold.TryMagnetFrom(pPos, magnetR);
		}

		// --- Timers ---
		if (_isDashing)
		{
			_dashTimer -= dt;
			if (_dashTimer <= 0f) _isDashing = false;
		}
		if (_dashCooldownTimer > 0f) _dashCooldownTimer -= dt;
		if (_dashSfxCooldown > 0f) _dashSfxCooldown -= dt;

		if (_isSliding)
		{
			_slideTimer -= dt;
			if (_slideTimer <= 0f) _isSliding = false;
		}
		if (_slideCooldownTimer > 0f) _slideCooldownTimer -= dt;

		// --- Input ---
		Vector2 input = Input.GetVector("move_left", "move_right", "move_up", "move_down");
		_wishDirection = new Vector3(input.X, 0, input.Y);

		// --- Physics: Gravity ---
		_isOnFloor = IsOnFloor();
		if (_isOnFloor)
		{
			_verticalVelocity = 0f;
			_consecutiveJumps = 0;
		}
		else
		{
			_verticalVelocity -= Gravity * dt;
		}

		// --- Movement ---
		float speed = BaseSpeed * (1f + (stats?.SpeedBonus ?? 0f) / 100f);

		Vector3 moveVelocity;

		if (_isDashing)
		{
			// Dash: fast burst in movement direction, overrides everything
			moveVelocity = LastMoveDirection.Normalized() * DashSpeed;
			moveVelocity.Y = _verticalVelocity * dt;
			VFXManager.Instance?.DashTrail(GlobalPosition);
			if (_dashSfxCooldown <= 0f)
			{
				AudioManager.Instance?.PlaySfx(SfxKind.Dash, volumeDb: -8f);
				_dashSfxCooldown = 0.08f;
			}
		}
		else if (_isSliding)
		{
			// Slide: fast, low friction, in current direction
			float slideSpeed = speed * SlideSpeedBoost;
			float slideFriction = 2f; // low friction for slide
			_slideDirection = _slideDirection.MoveToward(
				_wishDirection.Normalized() * slideSpeed, slideFriction * dt);
			if (_slideDirection.LengthSquared() < 0.01f)
				_slideDirection = LastMoveDirection.Normalized() * slideSpeed;
			moveVelocity = _slideDirection;
			moveVelocity.Y = _verticalVelocity * dt;

			// Slide VFX
			if (GD.Randf() < 0.3f)
				VFXManager.Instance?.DashTrail(GlobalPosition);
		}
		else
		{
			// Normal movement with acceleration/friction
			float accel = _isOnFloor ? GroundAccel : AirAccel;
			float fric = _isOnFloor ? Friction : Friction * 0.3f;

			Vector3 wishDir = _wishDirection.LengthSquared() > 0.01f
				? _wishDirection.Normalized() : Vector3.Zero;

			// Accelerate towards wish direction
			Vector3 currentHoriz = new(Velocity.X, 0, Velocity.Z);
			Vector3 accelDir = (wishDir * speed - currentHoriz);
			float accelLen = accelDir.Length();

			if (accelLen > 0.01f)
			{
				accelDir = accelDir.Normalized();
				float addSpeed = Mathf.Min(accel * dt, accelLen);
				currentHoriz += accelDir * addSpeed;
			}
			else
			{
				// Friction
				float control = Mathf.Max(speed, fric);
				float drop = control * fric * dt;
				float len = currentHoriz.Length();
				if (len > 0f)
				{
					float newSpeed = Mathf.Max(len - drop, 0f);
					currentHoriz = currentHoriz.Normalized() * newSpeed;
				}
			}

			moveVelocity = currentHoriz;
			moveVelocity.Y = _verticalVelocity * dt;
		}

		// Track direction for weapons/dash
		if (_wishDirection.LengthSquared() > 0.01f)
			LastMoveDirection = _wishDirection;

		Velocity = moveVelocity;
		MoveAndSlide();
	}

	public override void _UnhandledInput(InputEvent @event)
	{
		if (!IsAlive) return;

		// Jump (Space)
		if (@event is InputEventKey key && key.Pressed && key.PhysicalKeycode == Key.Space)
			TryJump();

		// Dash/Slide (Shift)
		if (@event is InputEventKey shiftKey && shiftKey.Pressed &&
			shiftKey.PhysicalKeycode == Key.Shift)
			TryDash();
	}

	private void TryJump()
	{
		if (!_isOnFloor && _consecutiveJumps >= 1) return; // only one jump (no double-jump)
		if (_isDashing || _isSliding) return;

		// --- Bunny-hop boost ---
		_consecutiveJumps++;
		float boost = 1f;
		if (_consecutiveJumps > 1)
		{
			boost = Mathf.Min(BunnyHopBoost, 1f + (_consecutiveJumps - 1) * 0.02f);
		}

		_verticalVelocity = JumpForce * boost;

		// Preserve horizontal momentum for bunny-hop
		Vector3 currentHoriz = new(Velocity.X, 0, Velocity.Z);
		if (currentHoriz.LengthSquared() > BaseSpeed * BaseSpeed * 0.5f)
		{
			// Keep the extra speed
		}

		VFXManager.Instance?.DashTrail(GlobalPosition + Vector3.Down * 0.5f);
		AudioManager.Instance?.PlaySfx(SfxKind.Dash, pitch: 1.2f, volumeDb: -6f);
	}

	private void TryDash()
	{
		if (_isDashing || _dashCooldownTimer > 0f) return;
		if (LastMoveDirection.LengthSquared() < 0.01f) return;

		if (_isOnFloor && _wishDirection.LengthSquared() > 0.01f)
		{
			// On ground + moving = Slide
			_isSliding = true;
			_slideTimer = SlideDuration;
			_slideCooldownTimer = SlideCooldown;
			_slideDirection = _wishDirection.Normalized() * BaseSpeed * SlideSpeedBoost;
		}
		else
		{
			// Air or stationary = Dash
			_isDashing = true;
			_dashTimer = DashDuration;
			_dashCooldownTimer = DashCooldown;
		}
	}

	public void TakeDamage(float amount)
	{
		if (!IsAlive) return;

		float armorReduction = Mathf.Clamp(PlayerStats.Instance.ArmorBonus / 100f, 0f, 0.75f);
		float finalDamage = amount * (1f - armorReduction);

		CurrentHealth -= finalDamage;

		if (BodyMesh != null && HitFlashMaterial != null)
		{
			BodyMesh.MaterialOverride = HitFlashMaterial;
			_flashTimer = FlashDuration;
		}

		VFXManager.Instance?.PlayerHit(GlobalPosition);
		ScreenShake.Instance?.PlayerHit();
		AudioManager.Instance?.PlaySfx(SfxKind.PlayerHurt, volumeDb: -4f);

		GameEvents.EmitPlayerDamaged(finalDamage);
		FloatingTextManager.Instance?.ShowDamage(this, finalDamage);

		if (CurrentHealth <= 0f)
			Die();
	}

	public void Heal(float amount)
	{
		if (!IsAlive || amount <= 0f) return;
		CurrentHealth = Mathf.Min(CurrentHealth + amount, MaxHealth);
	}

	public void IncreaseMaxHealth(float amount)
	{
		MaxHealth += amount;
		CurrentHealth += amount;
	}

	private void Die()
	{
		CurrentHealth = 0f;
		GameManager.Instance.EndRun();
		GameEvents.EmitPlayerDied();
		AudioManager.Instance?.PlaySfx(SfxKind.GameOver);
	}
}
