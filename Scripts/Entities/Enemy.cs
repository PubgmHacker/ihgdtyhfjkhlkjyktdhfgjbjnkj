using Godot;
using MegabonkClone.Core;
using MegabonkClone.Data;
using MegabonkClone.Effects;
using MegabonkClone.Interfaces;
using MegabonkClone.Systems;

namespace MegabonkClone.Entities;

/// <summary>
/// Base enemy: chases the player, deals contact damage on a cooldown,
/// takes damage, flashes when hit, drops XP/gold and dies.
///
/// Movement & attack are NOT driven by _PhysicsProcess here — the central
/// <see cref="EnemyController"/> calls <see cref="Tick"/> each frame so we
/// avoid hundreds of per-node physics callbacks.
/// Ported from the Unity BeanBase.
/// </summary>
public partial class Enemy : CharacterBody3D, IDamageable
{
    [ExportGroup("Movement")]
    [Export] public float MoveSpeed = 3f;
    [Export] public float RotationSpeed = 10f;

    [ExportGroup("Attack")]
    [Export] public float AttackRange = 1.5f;
    [Export] public float AttackCooldown = 1f;
    [Export] public float AttackDamage = 10f;

    [ExportGroup("Rewards")]
    [Export] public int XPValue = 5;
    [Export] public int GoldValue = 2;
    [Export(PropertyHint.Range, "0,100")] public int GoldDropChance = 30;

    // --- IDamageable ---
    public float MaxHealth { get; protected set; } = 50f;
    public float CurrentHealth { get; protected set; }
    public bool IsAlive { get; protected set; }
    public bool IsRare { get; protected set; }

    /// <summary>VFX color for death particles. Override in subclasses.</summary>
    public virtual EnemyDeathColor DeathVfxColor => EnemyDeathColor.Red;

    // --- Visual flash ---
    protected MeshInstance3D? _mesh;
    protected Material? _baseMaterial;
    protected StandardMaterial3D? _flashMat;
    protected float _flashTimer;
    private const float FlashDuration = 0.1f;

    // --- Attack timing ---
    private float _lastAttackTime = -1f;

    public override void _Ready()
    {
        _mesh = GetNodeOrNull<MeshInstance3D>("Mesh");
        if (_mesh != null) _baseMaterial = _mesh.MaterialOverride;

        // Physics layers: enemies live on layer 2.
        CollisionLayer = 2u;
        CollisionMask = 1u; // collide with player body

        EnemyController.Instance.Register(this);
    }

    /// <summary>
    /// Initializes this enemy (called right after spawning from the pool)
    /// using a def + optional difficulty multiplier + rare flag.
    /// </summary>
    public virtual void Initialize(EnemyDef def, bool isRare = false, float difficulty = 1f)
    {
        MaxHealth     = def.MaxHealth * difficulty;
        MoveSpeed     = def.MoveSpeed;
        AttackRange   = def.AttackRange;
        AttackCooldown = 1f / Mathf.Max(0.01f, def.AttackSpeed);
        AttackDamage  = def.Damage * difficulty;
        XPValue       = def.XPValue;
        GoldValue     = def.GoldValue;
        GoldDropChance = def.GoldDropChance;

        IsRare = isRare;
        if (isRare)
        {
            MaxHealth *= 2f;
            AttackDamage *= 2f;
            MoveSpeed *= 1.1f;
            XPValue *= 2;
            GoldValue *= 3;
            GoldDropChance = 100;
        }

        CurrentHealth = MaxHealth;
        IsAlive = true;

        // Build a flash material clone once (reused on every hit).
        if (_mesh != null && _baseMaterial is StandardMaterial3D sm)
        {
            _flashMat = new StandardMaterial3D
            {
                AlbedoColor = Colors.White,
                EmissionEnergyMultiplier = 2f,
            };
        }
    }

    public override void _ExitTree()
    {
        if (EnemyController.Instance != null)
            EnemyController.Instance.Unregister(this);
    }

    /// <summary>
    /// Per-frame logic driven centrally by EnemyController.
    /// <param name="playerPos">Where the player currently is.</param>
    /// <param name="dt">Physics delta time.</param>
    /// </summary>
    public virtual void Tick(Vector3 playerPos, float dt)
    {
        if (!IsAlive) return;

        // Direction to player on the horizontal plane
        Vector3 toPlayer = playerPos - GlobalPosition;
        Vector3 dir = new Vector3(toPlayer.X, 0, toPlayer.Z);
        float sqrMag = dir.LengthSquared();
        if (sqrMag < 0.0001f) return;
        dir /= Mathf.Sqrt(sqrMag);

        // Move toward player
        Velocity = dir * MoveSpeed;
        MoveAndSlide();

        // Face the player (Y rotation only)
        if (RotationSpeed > 0f)
        {
            Basis target = LookingAtSafe(dir);
            GlobalBasis = GlobalBasis.Slerp(target, RotationSpeed * dt);
        }

        // Contact damage on cooldown
        float dist = toPlayer.Length();
        if (dist <= AttackRange)
        {
            float now = Time.GetTicksMsec() / 1000f;
            if (now >= _lastAttackTime + AttackCooldown)
            {
                _lastAttackTime = now;
                var player = GameManager.Instance.ActivePlayer;
                player?.TakeDamage(AttackDamage);
            }
        }

        // Decay hit flash
        if (_flashTimer > 0 && _mesh != null && _flashMat != null)
        {
            _flashTimer -= dt;
            if (_flashTimer <= 0 && _baseMaterial != null)
                _mesh.MaterialOverride = _baseMaterial;
        }
    }

    // ---------------- Combat ----------------
    public virtual bool TakeDamage(float amount, float knockBackDuration = 0f)
    {
        if (!IsAlive || amount <= 0f) return false;

        StartFlash();
        CurrentHealth -= amount;

        // Floating damage number
        FloatingTextManager.Instance?.ShowDamage(this, amount);

        if (CurrentHealth <= 0f)
        {
            Die();
            return true;
        }
        return false;
    }

    public void Heal(float amount)
    {
        if (!IsAlive || amount <= 0f) return;
        CurrentHealth = Mathf.Min(MaxHealth, CurrentHealth + amount);
    }

    protected void StartFlash()
    {
        if (_mesh != null && _flashMat != null)
        {
            _mesh.MaterialOverride = _flashMat;
            _flashTimer = FlashDuration;
        }
    }

    protected virtual void Die()
    {
        IsAlive = false;

        // Emit game event before anything else.
        GameEvents.EmitEnemyDied(this);
        GameManager.Instance.RegisterKill();

        // Explicitly unregister before pool release (safe iteration).
        if (EnemyController.Instance != null)
            EnemyController.Instance.Unregister(this);

        // Death VFX + SFX
        VFXManager.Instance?.EnemyDeath(GlobalPosition, DeathVfxColor);
        ScreenShake.Instance?.SmallHit();
        AudioManager.Instance?.PlaySfx(SfxKind.EnemyDeath, volumeDb: -6f);

        // Drop XP (and maybe gold)
        DropLoot();

        // Return to pool instead of freeing
        Core.ObjectPool.Instance.Release(this);
    }

    protected virtual void DropLoot()
    {
        // XP orb always (use cached scene from Player to avoid per-death ResourceLoader.Load)
        if (Player.XPOrbScene != null)
        {
            var orb = Core.ObjectPool.Instance.Spawn<XPOrb>(Player.XPOrbScene, GlobalPosition, Vector3.Zero);
            orb?.SetValue(XPValue);
        }

        // Gold by chance
        if (GD.RandRange(0, 100) <= GoldDropChance && Player.GoldOrbScene != null)
        {
            var gold = Core.ObjectPool.Instance.Spawn<GoldOrb>(Player.GoldOrbScene, GlobalPosition, Vector3.Zero);
            gold?.SetValue(GoldValue);
        }
    }

    private static Basis LookingAtSafe(Vector3 forward)
    {
        forward = forward.Normalized();
        if (forward.Abs() == Vector3.Up) forward = Vector3.Forward;
        return Basis.LookingAt(forward, Vector3.Up);
    }
}
