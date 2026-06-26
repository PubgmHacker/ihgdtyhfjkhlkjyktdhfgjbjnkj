using Godot;
using MegabonkClone.Core;
using MegabonkClone.Systems;

namespace MegabonkClone.UI;

/// <summary>
/// Main menu controller. Code-built — no .tscn needed.
/// Shows title, Play button, Quit button, and gold display.
/// </summary>
public partial class MainMenuController : Control
{
    private Label _titleLabel = null!;
    private Label _goldLabel = null!;
    private Label _versionLabel = null!;

    public override void _Ready()
    {
        AnchorsPreset = (int)LayoutPreset.FullRect;
        GrowHorizontal = GrowDirection.Both;
        GrowVertical = GrowDirection.Both;

        BuildBackground();
        BuildUI();

        // Ensure we're in MainMenu state.
        GameManager.Instance.SetState(GameState.MainMenu);
    }

    private void BuildBackground()
    {
        var bg = new ColorRect
        {
            Name = "Background",
            AnchorsPreset = (int)LayoutPreset.FullRect,
            Color = new Color(0.04f, 0.05f, 0.12f),
        };
        AddChild(bg);

        // Decorative animated gradient overlay
        var overlay = new ColorRect
        {
            Name = "GradientOverlay",
            AnchorsPreset = (int)LayoutPreset.FullRect,
            Color = new Color(0.08f, 0.12f, 0.25f, 0.4f),
        };
        AddChild(overlay);
    }

    private void BuildUI()
    {
        var vbox = new VBoxContainer
        {
            Name = "MenuContent",
            Alignment = BoxContainer.AlignmentMode.Center,
            AnchorsPreset = (int)LayoutPreset.Center,
            CustomMinimumSize = new Vector2(400, 350),
        };
        vbox.AddThemeConstantOverride("separation", 16);
        AddChild(vbox);

        // Title
        _titleLabel = MakeLabel("⚔ MEGABONK ⚔", 48, new Color(1f, 0.85f, 0.3f), bold: true);
        _titleLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _titleLabel.AnchorLeft = 0;
        _titleLabel.AnchorRight = 1;
        vbox.AddChild(_titleLabel);

        var subtitle = MakeLabel("3D Auto-Shooter Roguelike", 18, new Color(0.6f, 0.65f, 0.8f));
        subtitle.HorizontalAlignment = HorizontalAlignment.Center;
        subtitle.AnchorLeft = 0;
        subtitle.AnchorRight = 1;
        vbox.AddChild(subtitle);

        // Spacer
        vbox.AddChild(new Control { CustomMinimumSize = new Vector2(0, 20) });

        // Gold display
        _goldLabel = MakeLabel("", 20, new Color(1f, 0.85f, 0.25f));
        _goldLabel.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(_goldLabel);
        UpdateGold();

        vbox.AddChild(new Control { CustomMinimumSize = new Vector2(0, 10) });

        // Play button
        var playBtn = MakeButton("▶  START RUN", new Color(0.15f, 0.55f, 0.85f));
        playBtn.Pressed += OnPlayPressed;
        vbox.AddChild(playBtn);

        // Settings button
        var settingsBtn = MakeButton("⚙  SETTINGS", new Color(0.2f, 0.3f, 0.45f));
        settingsBtn.Pressed += OnSettingsPressed;
        vbox.AddChild(settingsBtn);

        // Quit button
        var quitBtn = MakeButton("✕  QUIT", new Color(0.6f, 0.2f, 0.2f));
        quitBtn.Pressed += OnQuitPressed;
        vbox.AddChild(quitBtn);

        // Version
        _versionLabel = MakeLabel("v0.1.0-alpha", 12, new Color(0.4f, 0.4f, 0.5f, 0.6f));
        _versionLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _versionLabel.AnchorTop = 0.95f;
        _versionLabel.AnchorBottom = 1.0f;
        _versionLabel.AnchorLeft = 0;
        _versionLabel.AnchorRight = 1;
        AddChild(_versionLabel);
    }

    private void UpdateGold()
    {
        if (PlayerStats.Instance != null)
            _goldLabel.Text = $"🪙 Gold: {PlayerStats.Instance.Gold}";
    }

    private void OnPlayPressed()
    {
        AudioManager.Instance?.PlaySfx(SfxKind.Click);
        GetTree().ChangeSceneToFile("res://Scenes/Main.tscn");
    }

    private void OnSettingsPressed()
    {
        AudioManager.Instance?.PlaySfx(SfxKind.Click);
        GetTree().ChangeSceneToFile("res://Scenes/UI/SettingsMenu.tscn");
    }

    private void OnQuitPressed()
    {
        AudioManager.Instance?.PlaySfx(SfxKind.Click);
        GetTree().Quit();
    }

    private static Label MakeLabel(string text, int fontSize, Color color, bool bold = false)
    {
        var label = new Label { Text = text };
        label.AddThemeFontSizeOverride("font_size", fontSize);
        label.AddThemeColorOverride("font_color", color);
        label.AddThemeColorOverride("font_outline_color", new Color(0f, 0f, 0f, 0.9f));
        label.AddThemeConstantOverride("outline_size", 4);
        return label;
    }

    private static Button MakeButton(string text, Color bgColor)
    {
        var btn = new Button
        {
            Text = text,
            CustomMinimumSize = new Vector2(300, 55),
        };
        btn.AddThemeStyleboxOverride("normal", new StyleBoxFlat
        {
            BgColor = bgColor,
            CornerRadiusTopLeft = 10, CornerRadiusTopRight = 10,
            CornerRadiusBottomLeft = 10, CornerRadiusBottomRight = 10,
        });
        btn.AddThemeStyleboxOverride("hover", new StyleBoxFlat
        {
            BgColor = bgColor.Lightened(0.15f),
            CornerRadiusTopLeft = 10, CornerRadiusTopRight = 10,
            CornerRadiusBottomLeft = 10, CornerRadiusBottomRight = 10,
        });
        btn.AddThemeStyleboxOverride("pressed", new StyleBoxFlat
        {
            BgColor = bgColor.Darkened(0.15f),
            CornerRadiusTopLeft = 10, CornerRadiusTopRight = 10,
            CornerRadiusBottomLeft = 10, CornerRadiusBottomRight = 10,
        });
        btn.AddThemeFontSizeOverride("font_size", 22);
        btn.AddThemeColorOverride("font_color", Colors.White);
        btn.AddThemeColorOverride("font_outline_color", new Color(0f, 0f, 0f, 0.8f));
        btn.AddThemeConstantOverride("outline_size", 3);
        return btn;
    }
}
