using Godot;
using MegabonkClone.Core;
using MegabonkClone.Data;
using MegabonkClone.Effects;
using MegabonkClone.Systems;
using MegabonkClone.Weapons;
using System;

namespace MegabonkClone.UI;

/// <summary>
/// Full HUD controller: health bar, XP bar, wave counter, kill count,
/// gold display, weapon icons with cooldown rings, minimap, level-up
/// overlay, pause overlay, and game-over/victory screen.
///
/// Code-built — no .tscn needed. Attaches to a CanvasLayer.
/// </summary>
public partial class HudController : Control
{
    // --- Theme colors ---
    private static readonly Color BgPanel = new(0.04f, 0.05f, 0.10f, 0.88f);
    private static readonly Color BorderCyan = new(0.25f, 0.75f, 1.0f, 0.7f);
    private static readonly Color HealthFill = new(0.95f, 0.25f, 0.20f);
    private static readonly Color HealthBg = new(0.30f, 0.10f, 0.08f);
    private static readonly Color HealthOutline = new(0.60f, 0.20f, 0.15f, 0.8f);
    private static readonly Color XpFill = new(0.30f, 0.85f, 1.0f);
    private static readonly Color XpBg = new(0.08f, 0.20f, 0.30f);
    private static readonly Color GoldColor = new(1.0f, 0.85f, 0.25f);
    private static readonly Color LevelColor = new(1.0f, 0.95f, 0.50f);
    private static readonly Color WaveColor = new(0.8f, 0.6f, 1.0f);
    private static readonly Color KillColor = new(1.0f, 0.45f, 0.30f);
    private static readonly Color TextWhite = new(1f, 1f, 1f, 0.95f);
    private static readonly Color TextDim = new(0.7f, 0.7f, 0.7f, 0.7f);
    private static readonly Color OverlayBg = new(0f, 0f, 0f, 0.55f);

    // --- Nodes ---
    private Panel _topBar = null!;
    private ProgressBar _healthBar = null!;
    private Label _healthLabel = null!;
    private ProgressBar _xpBar = null!;
    private Label _levelLabel = null!;
    private Label _xpLabel = null!;
    private Label _waveLabel = null!;
    private Label _killLabel = null!;
    private Label _goldLabel = null!;
    private Panel _weaponBar = null!;
    private HBoxContainer _weaponSlots = null!;
    private Minimap _minimap = null!;
    private Panel _overlayPanel = null!;
    private Label _overlayTitle = null!;
    private Label _overlaySubtitle = null!;
    private Label _overlayTimer = null!;
    private Panel _levelUpPanel = null!;

    // --- Weapon icon tracking ---
    private readonly (WeaponKind Kind, string Name, Color Color)[] _weaponMeta = new[]
    {
        (WeaponKind.AutoAxe, "AXE", new Color(1f, 0.85f, 0.4f)),
        (WeaponKind.ProjectileGun, "GUN", new Color(0.4f, 0.8f, 1f)),
        (WeaponKind.AuraWeapon, "AURA", new Color(0.8f, 0.4f, 1f)),
        (WeaponKind.Boomerang, "BOOM", new Color(1f, 0.5f, 0.3f)),
    };
    private readonly Label[] _weaponLevelLabels = new Label[4];
    private readonly TextureProgressBar[] _weaponCdBars = new TextureProgressBar[4];
    private readonly Panel[] _weaponSlotPanels = new Panel[4];

    // --- Overlay state ---
    private GameState _lastState;

    public override void _Ready()
    {
        // Full rect anchored to screen.
        AnchorsPreset = (int)LayoutPreset.FullRect;
        GrowHorizontal = GrowDirection.Both;
        GrowVertical = GrowDirection.Both;
        MouseFilter = MouseFilterEnum.Ignore;

        BuildTopBar();
        BuildWeaponBar();
        BuildMinimap();
        BuildOverlay();
        BuildLevelUpPanel();

        _lastState = GameManager.Instance.CurrentState;
    }

    public override void _Process(double delta)
    {
        if (PlayerStats.Instance == null) return;

        UpdateHealth();
        UpdateXP();
        UpdateWaveAndKills();
        UpdateGold();
        UpdateWeaponCooldowns();
        HandleStateOverlay();
    }

    // ============================================================
    //  BUILD UI ELEMENTS
    // ============================================================

    private void BuildTopBar()
    {
        _topBar = MakePanel(BgPanel, BorderCyan, radius: 8);
        _topBar.AnchorLeft = 0.02f;
        _topBar.AnchorRight = 0.62f;
        _topBar.AnchorTop = 0.01f;
        _topBar.AnchorBottom = 0.15f;
        AddChild(_topBar);

        // --- Health bar (left) ---
        var healthBox = new VBoxContainer { Name = "HealthSection" };
        _topBar.AddChild(healthBox);

        var healthHeader = new HBoxContainer();
        healthBox.AddChild(healthHeader);
        healthHeader.AddChild(MakeLabel("❤ HP", 13, HealthFill));
        _healthLabel = MakeLabel("", 13, TextWhite);
        healthHeader.AddChild(_healthLabel);

        _healthBar = MakeProgressBar(HealthFill, HealthBg, HealthOutline, 22f);
        healthBox.AddChild(_healthBar);

        // --- XP bar + Level ---
        var xpBox = new VBoxContainer { Name = "XPSection" };
        xpBox.AnchorLeft = 0.32f;
        xpBox.Position = new Vector2(0, 0);
        _topBar.AddChild(xpBox);

        var xpHeader = new HBoxContainer();
        xpBox.AddChild(xpHeader);
        _levelLabel = MakeLabel("LV 1", 14, LevelColor, bold: true);
        xpHeader.AddChild(_levelLabel);
        _xpLabel = MakeLabel("", 11, TextDim);
        xpHeader.AddChild(_xpLabel);

        _xpBar = MakeProgressBar(XpFill, XpBg, BorderCyan, 14f);
        xpBox.AddChild(_xpBar);

        // --- Wave + Kill + Gold (right) ---
        var infoBox = new HBoxContainer { Name = "InfoSection" };
        infoBox.AddThemeConstantOverride("separation", 16);
        _topBar.AddChild(infoBox);
        infoBox.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.TopRight);
        infoBox.AnchorTop = 0.02f;
        infoBox.AnchorBottom = 0.98f;
        infoBox.AnchorRight = 0.98f;
        infoBox.AnchorLeft = 0.55f;

        _waveLabel = MakeLabel("", 14, WaveColor);
        infoBox.AddChild(_waveLabel);
        _killLabel = MakeLabel("", 14, KillColor);
        infoBox.AddChild(_killLabel);
        _goldLabel = MakeLabel("", 14, GoldColor);
        infoBox.AddChild(_goldLabel);
    }

    private void BuildWeaponBar()
    {
        _weaponBar = MakePanel(BgPanel, BorderCyan, radius: 8);
        _weaponBar.AnchorLeft = 0.02f;
        _weaponBar.AnchorRight = 0.98f;
        _weaponBar.AnchorTop = 0.84f;
        _weaponBar.AnchorBottom = 0.98f;
        AddChild(_weaponBar);

        _weaponSlots = new HBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            AnchorsPreset = (int)LayoutPreset.FullRect,
        };
        _weaponSlots.AddThemeConstantOverride("separation", 12);
        _weaponBar.AddChild(_weaponSlots);

        for (int i = 0; i < _weaponMeta.Length; i++)
        {
            var (kind, name, color) = _weaponMeta[i];

            var slotPanel = MakePanel(new Color(0f, 0f, 0f, 0.5f), color * 0.5f, radius: 6);
            slotPanel.CustomMinimumSize = new Vector2(64, 52);
            _weaponSlotPanels[i] = slotPanel;

            var vbox = new VBoxContainer
            {
                Alignment = BoxContainer.AlignmentMode.Center,
                AnchorsPreset = (int)LayoutPreset.FullRect,
            };
            slotPanel.AddChild(vbox);

            var icon = MakeLabel(name, 12, color, bold: true);
            icon.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(icon);

            _weaponLevelLabels[i] = MakeLabel("", 10, TextDim);
            _weaponLevelLabels[i].HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(_weaponLevelLabels[i]);

            // Cooldown bar overlay.
            var cdBar = new TextureProgressBar
            {
                AnchorsPreset = (int)LayoutPreset.FullRect,
                MinValue = 0,
                MaxValue = 1,
                Value = 0,
                ZIndex = -1,
            };
            // Style it.
            var styleNormal = new StyleBoxFlat
            {
                BgColor = new Color(color.R, color.G, color.B, 0.15f),
                CornerRadiusTopLeft = 6, CornerRadiusTopRight = 6,
                CornerRadiusBottomLeft = 6, CornerRadiusBottomRight = 6,
            };
            cdBar.AddThemeStyleboxOverride("fill", styleNormal);
            var styleBg = new StyleBoxFlat
            {
                BgColor = new Color(0f, 0f, 0f, 0.3f),
                CornerRadiusTopLeft = 6, CornerRadiusTopRight = 6,
                CornerRadiusBottomLeft = 6, CornerRadiusBottomRight = 6,
            };
            cdBar.AddThemeStyleboxOverride("background", styleBg);
            slotPanel.AddChild(cdBar);
            _weaponCdBars[i] = cdBar;

            _weaponSlots.AddChild(slotPanel);
        }
    }

    private void BuildMinimap()
    {
        _minimap = new Minimap();
        _minimap.CustomMinimumSize = new Vector2(140, 140);
        _minimap.AnchorLeft = 0.85f;
        _minimap.AnchorRight = 0.99f;
        _minimap.AnchorTop = 0.16f;
        _minimap.AnchorBottom = 0.55f;
        _minimap.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_minimap);
    }

    private void BuildOverlay()
    {
        // Full-screen overlay for Pause / GameOver / Victory.
        _overlayPanel = new Panel
        {
            Visible = false,
            AnchorsPreset = (int)LayoutPreset.FullRect,
        };
        _overlayPanel.AddThemeStyleboxOverride("panel", new StyleBoxFlat
        {
            BgColor = OverlayBg,
        });
        AddChild(_overlayPanel);

        var vbox = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            AnchorsPreset = (int)LayoutPreset.Center,
        };
        _overlayPanel.AddChild(vbox);

        _overlayTitle = MakeLabel("", 36, TextWhite, bold: true);
        _overlayTitle.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(_overlayTitle);

        _overlaySubtitle = MakeLabel("", 16, TextDim);
        _overlaySubtitle.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(_overlaySubtitle);

        _overlayTimer = MakeLabel("", 13, WaveColor);
        _overlayTimer.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(_overlayTimer);
    }

    private void BuildLevelUpPanel()
    {
        _levelUpPanel = new Panel
        {
            Visible = false,
            Name = "LevelUpPanel",
            AnchorsPreset = (int)LayoutPreset.Center,
            CustomMinimumSize = new Vector2(500, 80),
        };
        _levelUpPanel.AddThemeStyleboxOverride("panel", new StyleBoxFlat
        {
            BgColor = new Color(0.05f, 0.04f, 0.15f, 0.92f),
            BorderColor = new Color(1f, 0.85f, 0.3f, 0.8f),
            BorderWidthBottom = 3, BorderWidthTop = 3,
            BorderWidthLeft = 3, BorderWidthRight = 3,
            CornerRadiusTopLeft = 12, CornerRadiusTopRight = 12,
            CornerRadiusBottomLeft = 12, CornerRadiusBottomRight = 12,
        });
        AddChild(_levelUpPanel);

        var vbox = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            AnchorsPreset = (int)LayoutPreset.FullRect,
        };
        _levelUpPanel.AddChild(vbox);

        var title = MakeLabel("⬆ LEVEL UP!", 28, LevelColor, bold: true);
        title.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(title);

        var sub = MakeLabel("Choose an upgrade to continue", 14, TextDim);
        sub.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(sub);
    }

    // ============================================================
    //  UPDATE UI ELEMENTS
    // ============================================================

    private void UpdateHealth()
    {
        var player = GameManager.Instance.ActivePlayer;
        if (player == null) return;

        float maxH = player.MaxHealth;
        float curH = Mathf.Max(0f, player.CurrentHealth);
        _healthBar.MaxValue = maxH;
        _healthBar.Value = curH;
        _healthLabel.Text = $"{Mathf.CeilToInt(curH)} / {Mathf.CeilToInt(maxH)}";
    }

    private void UpdateXP()
    {
        var stats = PlayerStats.Instance;
        float req = stats.RequiredXP;
        float cur = stats.CurrentXP;

        _xpBar.MaxValue = req;
        _xpBar.Value = cur;
        _levelLabel.Text = $"LV {stats.Level}";
        _xpLabel.Text = $"{cur} / {(int)req}";
    }

    private void UpdateWaveAndKills()
    {
        var gm = GameManager.Instance;
        _waveLabel.Text = $"⏱ Wave {gm.CurrentWave}/{gm.TotalWaves}";
        _killLabel.Text = $"💀 {gm.KillCount}";
    }

    private void UpdateGold()
    {
        _goldLabel.Text = $"🪙 {PlayerStats.Instance.Gold}";
    }

    private void UpdateWeaponCooldowns()
    {
        var player = GameManager.Instance.ActivePlayer;
        var wm = player?.GetNodeOrNull<WeaponManager>("WeaponManager");
        if (wm == null) return;

        for (int i = 0; i < _weaponMeta.Length; i++)
        {
            var kind = _weaponMeta[i].Kind;
            int level = wm.GetLevel(kind);

            if (level > 0)
            {
                _weaponSlotPanels[i].Modulate = Colors.White;
                _weaponLevelLabels[i].Text = $"Lv.{level}";
            }
            else
            {
                _weaponSlotPanels[i].Modulate = new Color(0.4f, 0.4f, 0.4f);
                _weaponLevelLabels[i].Text = "—";
                _weaponCdBars[i].Value = 0;
            }
        }
    }

    private void HandleStateOverlay()
    {
        var state = GameManager.Instance.CurrentState;
        if (state == _lastState) return;
        _lastState = state;

        _overlayPanel.Visible = state switch
        {
            GameState.Paused => true,
            GameState.GameOver => true,
            GameState.Victory => true,
            _ => false,
        };

        _levelUpPanel.Visible = state == GameState.LevelUp;

        _overlayTitle.Text = state switch
        {
            GameState.Paused => "⏸ PAUSED",
            GameState.GameOver => "💀 GAME OVER",
            GameState.Victory => "🏆 VICTORY!",
            _ => "",
        };

        _overlaySubtitle.Text = state switch
        {
            GameState.Paused => "Press ESC to resume",
            GameState.GameOver => $"Survived {GameManager.Instance.CurrentWave} waves | Kills: {GameManager.Instance.KillCount}",
            GameState.Victory => $"All {GameManager.Instance.TotalWaves} waves cleared! | Kills: {GameManager.Instance.KillCount}",
            _ => "",
        };

        _overlayTimer.Text = "";
    }

    // ============================================================
    //  PUBLIC BIND
    // ============================================================

    /// <summary>Bind to subsystems (called from GameBootstrap or Main scene).</summary>
    public void Bind(Node arg1, Node arg2)
    {
        // Subscribe to game events for reactive updates.
        Core.GameEvents.StateChanged += OnStateChanged;
        Core.GameEvents.GoldChanged += _ => UpdateGold();
        Core.GameEvents.WaveStarted += (idx, total) =>
        {
            GameManager.Instance.CurrentWave = idx;
            GameManager.Instance.TotalWaves = total;
            AudioManager.Instance?.PlaySfx(SfxKind.WaveStart, volumeDb: -2f);
        };
        Core.GameEvents.WaveCleared += idx =>
        {
            UpdateWaveAndKills();
        };
        Core.GameEvents.AllWavesCleared += () =>
        {
            GameManager.Instance.Victory();
        };
        Core.GameEvents.PlayerLevelledUp += level =>
        {
            AudioManager.Instance?.PlaySfx(SfxKind.LevelUp);
        };

        GD.Print("[HUD] Bound to game events.");
    }

    private void OnStateChanged(GameState state)
    {
        // Handled in _Process via HandleStateOverlay.
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventKey key && key.Pressed && key.PhysicalKeycode == Key.Escape)
        {
            GameManager.Instance.TogglePause();
        }
    }

    // ============================================================
    //  FACTORY HELPERS
    // ============================================================

    private static Panel MakePanel(Color bg, Color border, float radius = 6)
    {
        var panel = new Panel();
        panel.AddThemeStyleboxOverride("panel", new StyleBoxFlat
        {
            BgColor = bg,
            BorderColor = border,
            BorderWidthBottom = 2, BorderWidthTop = 2,
            BorderWidthLeft = 2, BorderWidthRight = 2,
            CornerRadiusTopLeft = (int)radius, CornerRadiusTopRight = (int)radius,
            CornerRadiusBottomLeft = (int)radius, CornerRadiusBottomRight = (int)radius,
        });
        return panel;
    }

    private static ProgressBar MakeProgressBar(Color fill, Color bg, Color outline, float height)
    {
        var bar = new ProgressBar
        {
            CustomMinimumSize = new Vector2(0, height),
            MaxValue = 100,
            Value = 100,
            ShowPercentage = false,
            AnchorsPreset = (int)LayoutPreset.FullRect,
        };

        bar.AddThemeStyleboxOverride("fill", new StyleBoxFlat
        {
            BgColor = fill,
            CornerRadiusTopLeft = (int)(height * 0.4f),
            CornerRadiusTopRight = (int)(height * 0.4f),
            CornerRadiusBottomLeft = (int)(height * 0.4f),
            CornerRadiusBottomRight = (int)(height * 0.4f),
            ContentMarginLeft = 2, ContentMarginRight = 2,
            ContentMarginTop = 2, ContentMarginBottom = 2,
        });

        bar.AddThemeStyleboxOverride("background", new StyleBoxFlat
        {
            BgColor = bg,
            CornerRadiusTopLeft = (int)(height * 0.4f),
            CornerRadiusTopRight = (int)(height * 0.4f),
            CornerRadiusBottomLeft = (int)(height * 0.4f),
            CornerRadiusBottomRight = (int)(height * 0.4f),
        });

        return bar;
    }

    private static Label MakeLabel(string text, int fontSize, Color color, bool bold = false)
    {
        var label = new Label { Text = text };
        label.AddThemeFontSizeOverride("font_size", fontSize);
        label.AddThemeColorOverride("font_color", color);
        label.AddThemeColorOverride("font_outline_color", new Color(0f, 0f, 0f, 0.7f));
        label.AddThemeConstantOverride("outline_size", 3);
        return label;
    }
}
