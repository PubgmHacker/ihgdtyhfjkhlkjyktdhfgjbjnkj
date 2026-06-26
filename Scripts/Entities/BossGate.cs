using Godot;
using MegabonkClone.Core;
using MegabonkClone.Effects;

namespace MegabonkClone.Entities;

/// <summary>
/// Boss summoning gate — interactive portal on the map. When the player
/// steps into it, summons a boss fight. Optional challenge for extra loot.
/// Has a cooldown after activation so it's not farmable.
/// </summary>
public partial class BossGate : Area3D
{
    [Export] public PackedScene? BossPrefab;
    [Export] public float ActivationRadius = 2.5f;
    [Export] public float CooldownTime = 60f;
    [Export] public bool IsActivated;

    private float _cooldownTimer;
    private MeshInstance3D? _gateMesh;
    private StandardMaterial3D? _idleMat;
    private StandardMaterial3D? _activeMat;
    private OmniLight3D? _gateLight;

    private static readonly string DefaultBossPath = "res://Scenes/Entities/Boss.tscn";

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
        CollisionLayer = 8u;  // layer 4
        CollisionMask = 1u;  // monitor player

        if (BossPrefab == null)
            BossPrefab = GD.Load<PackedScene>(DefaultBossPath);

        BuildVisuals();
    }

    public override void _Process(double delta)
    {
        // Rotate the gate for visual flair
        if (_gateMesh != null)
            _gateMesh.RotateY((float)delta * 1.5f);

        if (_cooldownTimer > 0f)
        {
            _cooldownTimer -= (float)delta;
            if (_cooldownTimer <= 0f)
            {
                IsActivated = false;
                UpdateVisualState();
            }
        }
    }

    private void BuildVisuals()
    {
        _idleMat = new StandardMaterial3D
        {
            AlbedoColor = new Color(0.8f, 0.2f, 0.9f),
            Emission = new Color(0.6f, 0.1f, 0.8f),
            EmissionEnergyMultiplier = 1.5f,
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
            NoDepthTest = true,
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
        };

        _activeMat = new StandardMaterial3D
        {
            AlbedoColor = new Color(0.2f, 0.2f, 0.25f, 0.3f),
            Emission = new Color(0.1f, 0.1f, 0.1f),
            EmissionEnergyMultiplier = 0.2f,
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
        };

        // Portal ring mesh
        _gateMesh = new MeshInstance3D
        {
            Name = "GateMesh",
            Mesh = new TorusMesh
            {
                InnerRadius = 0.8f,
                OuterRadius = 1.4f,
            },
            MaterialOverride = _idleMat,
            Position = new Vector3(0, 1.2f, 0),
        };
        AddChild(_gateMesh);

        // Inner glow disc
        var disc = new MeshInstance3D
        {
            Name = "GateDisc",
            Mesh = new CylinderMesh { TopRadius = 1.2f, BottomRadius = 1.2f, Height = 0.05f },
            MaterialOverride = new StandardMaterial3D
            {
                AlbedoColor = new Color(0.5f, 0.1f, 0.7f, 0.4f),
                Emission = new Color(0.4f, 0.05f, 0.6f),
                EmissionEnergyMultiplier = 1.0f,
                Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
                NoDepthTest = true,
                ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
            },
            Position = new Vector3(0, 1.2f, 0),
        };
        AddChild(disc);

        // Point light
        _gateLight = new OmniLight3D
        {
            Name = "GateLight",
            LightColor = new Color(0.7f, 0.2f, 0.9f),
            LightEnergy = 2.0f,
            OmniRange = 6.0f,
            Position = new Vector3(0, 1.2f, 0),
            ShadowEnabled = false,
        };
        AddChild(_gateLight);

        UpdateVisualState();
    }

    private void OnBodyEntered(Node body)
    {
        if (IsActivated) return;
        if (body is Player player && player.IsAlive)
            ActivateGate(player);
    }

    private void ActivateGate(Player activator)
    {
        IsActivated = true;
        _cooldownTimer = CooldownTime;

        // Big VFX burst
        VFXManager.Instance?.BossDeath(GlobalPosition + Vector3.Up);
        ScreenShake.Instance?.BossPhase();
        AudioManager.Instance?.PlaySfx(SfxKind.BossPhase);

        // Spawn the boss at a safe distance from the player
        Vector3 away = (GlobalPosition - activator.GlobalPosition).Normalized();
        if (away.LengthSquared() < 0.01f) away = Vector3.Forward;
        Vector3 spawnPos = GlobalPosition + away * 4f + Vector3.Up;

        if (BossPrefab != null)
        {
            var boss = ObjectPool.Instance.Spawn<Enemy>(BossPrefab, spawnPos, Vector3.Zero);
            if (boss is Boss b)
                b.InitializeBoss();
            else if (boss != null)
                boss.Initialize(new Data.EnemyDef
                {
                    DisplayName = "Gate Boss",
                    MaxHealth = 1200f,
                    MoveSpeed = 2.5f,
                    Damage = 30f,
                    XPValue = 100,
                    GoldValue = 25,
                });
        }

        UpdateVisualState();
        GD.Print("[BossGate] Boss summoned!");
    }

    private void UpdateVisualState()
    {
        if (_gateMesh == null) return;
        _gateMesh.MaterialOverride = IsActivated ? _activeMat : _idleMat;
        if (_gateLight != null)
            _gateLight.LightEnergy = IsActivated ? 0.3f : 2.0f;
    }
}
