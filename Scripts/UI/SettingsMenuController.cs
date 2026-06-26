using Godot;
using MegabonkClone.Systems;

namespace MegabonkClone.UI;

/// <summary>
/// Settings menu overlay: master/BGM/SFX volume sliders + back button.
/// Code-built — no .tscn needed. Toggle visibility from main menu or pause.
/// </summary>
public partial class SettingsMenuController : Control
{
    private HSlider _masterSlider = null!;
    private HSlider _bgmSlider = null!;
    private HSlider _sfxSlider = null!;
    private readonly HSlider?[] _sliders = new HSlider[3];
    private Label _masterValue = null!;
    private Label _bgmValue = null!;
    private Label _sfxValue = null!;

    private const string SettingsPath = "user://settings.json";

    public override void _Ready()
    {
        Visible = false;
        AnchorsPreset = (int)LayoutPreset.FullRect;
        GrowHorizontal = GrowDirection.Both;
        GrowVertical = GrowDirection.Both;
        MouseFilter = MouseFilterEnum.Stop;

        BuildUI();
        LoadSettings();
    }

    private void BuildUI()
    {
        // Background
        var bg = new ColorRect
        {
            Name = "BG",
            AnchorsPreset = (int)LayoutPreset.FullRect,
            Color = new Color(0.04f, 0.05f, 0.12f, 0.95f),
            MouseFilter = MouseFilterEnum.Stop,
        };
        AddChild(bg);

        // Center panel
        var panel = new Panel
        {
            Name = "SettingsPanel",
            AnchorsPreset = (int)LayoutPreset.Center,
            CustomMinimumSize = new Vector2(480, 380),
        };
        panel.AddThemeStyleboxOverride("panel", new StyleBoxFlat
        {
            BgColor = new Color(0.06f, 0.05f, 0.12f, 0.95f),
            BorderColor = new Color(0.3f, 0.7f, 1.0f, 0.7f),
            BorderWidthBottom = 3, BorderWidthTop = 3,
            BorderWidthLeft = 3, BorderWidthRight = 3,
            CornerRadiusTopLeft = 12, CornerRadiusTopRight = 12,
            CornerRadiusBottomLeft = 12, CornerRadiusBottomRight = 12,
        });
        AddChild(panel);

        var vbox = new VBoxContainer
        {
            Name = "Content",
            Alignment = BoxContainer.AlignmentMode.Center,
            AnchorsPreset = (int)LayoutPreset.FullRect,
        };
        vbox.AddThemeConstantOverride("separation", 16);
        vbox.OffsetLeft = 40; vbox.OffsetRight = -40;
        vbox.OffsetTop = 30; vbox.OffsetBottom = -30;
        panel.AddChild(vbox);

        // Title
        var title = new Label { Text = "⚙ SETTINGS" };
        title.AddThemeFontSizeOverride("font_size", 28);
        title.AddThemeColorOverride("font_color", new Color(0.3f, 0.7f, 1.0f));
        title.HorizontalAlignment = HorizontalAlignment.Center;
        vbox.AddChild(title);

        vbox.AddChild(new HSeparator { CustomMinimumSize = new Vector2(0, 10) });

        // Master volume
        _masterValue = new Label();
        vbox.AddChild(BuildVolumeRow("🔊 Master", 0, _masterValue));
        // BGM volume
        _bgmValue = new Label();
        vbox.AddChild(BuildVolumeRow("🎵 Music", 1, _bgmValue));
        // SFX volume
        _sfxValue = new Label();
        vbox.AddChild(BuildVolumeRow("💥 SFX", 2, _sfxValue));

        vbox.AddChild(new HSeparator { CustomMinimumSize = new Vector2(0, 10) });

        // Back button
        var backBtn = new Button { Text = "← BACK", CustomMinimumSize = new Vector2(0, 45) };
        backBtn.AddThemeStyleboxOverride("normal", new StyleBoxFlat
        {
            BgColor = new Color(0.2f, 0.3f, 0.45f),
            CornerRadiusTopLeft = 8, CornerRadiusTopRight = 8,
            CornerRadiusBottomLeft = 8, CornerRadiusBottomRight = 8,
        });
        backBtn.AddThemeFontSizeOverride("font_size", 18);
        backBtn.Pressed += OnBack;
        vbox.AddChild(backBtn);
    }

    private HBoxContainer BuildVolumeRow(string label, int busIndex, Label valueLabel)
    {
        var row = new HBoxContainer { CustomMinimumSize = new Vector2(0, 40) };
        row.AddThemeConstantOverride("separation", 12);

        var lbl = new Label { Text = label, CustomMinimumSize = new Vector2(130, 0) };
        lbl.AddThemeFontSizeOverride("font_size", 16);
        lbl.AddThemeColorOverride("font_color", new Color(0.85f, 0.85f, 0.9f));
        row.AddChild(lbl);

        var slider = new HSlider
        {
            CustomMinimumSize = new Vector2(220, 20),
            MinValue = -40f,
            MaxValue = 6f,
            Step = 1f,
        };
        slider.ValueChanged += v => OnVolumeChanged(busIndex, v, valueLabel);
        row.AddChild(slider);

        valueLabel.Text = "0 dB";
        valueLabel.CustomMinimumSize = new Vector2(70, 0);
        valueLabel.AddThemeFontSizeOverride("font_size", 14);
        valueLabel.AddThemeColorOverride("font_color", new Color(0.6f, 0.65f, 0.75f));
        row.AddChild(valueLabel);

        // Stash the slider so _Ready can set its value after LoadSettings
        _sliders[busIndex] = slider;

        return row;
    }

    private void OnVolumeChanged(int busIndex, double value, Label valueLabel)
    {
        float v = (float)value;
        string busName = busIndex switch { 0 => "Master", 1 => "BGM", 2 => "SFX", _ => "Master" };
        int idx = AudioServer.GetBusIndex(busName);
        if (idx >= 0)
        {
            AudioServer.SetBusVolumeDb(idx, v);
            AudioServer.SetBusMute(idx, v <= -39f);
        }
        valueLabel.Text = v <= -39f ? "MUTED" : $"{v:F0} dB";
        SaveSettings();
    }

    private void OnBack()
    {
        AudioManager.Instance?.PlaySfx(SfxKind.Click);
        Visible = false;
    }

    // ---------------- Persistence ----------------
    private void SaveSettings()
    {
        var data = new SettingsData
        {
            Master = _sliders[0]?.Value ?? 0d,
            Bgm = _sliders[1]?.Value ?? -6d,
            Sfx = _sliders[2]?.Value ?? -3d,
        };
        var json = Json.Stringify(data.ToGodotDict(), "  ");
        var f = FileAccess.Open(SettingsPath, FileAccess.ModeFlags.Write);
        f?.StoreString(json);
        f?.Close();
    }

    private void LoadSettings()
    {
        var f = FileAccess.Open(SettingsPath, FileAccess.ModeFlags.Read);
        double master = 0d, bgm = -6d, sfx = -3d;
        if (f != null)
        {
            var json = f.GetAsText();
            f.Close();

            var parsed = Json.ParseString(json);
            if (parsed.VariantType == Variant.Type.Dictionary)
            {
                var d = (Godot.Collections.Dictionary)parsed;
                master = (double)d["master"];
                bgm = (double)d["bgm"];
                sfx = (double)d["sfx"];
            }
        }

        if (_sliders[0] != null) _sliders[0].Value = master;
        if (_sliders[1] != null) _sliders[1].Value = bgm;
        if (_sliders[2] != null) _sliders[2].Value = sfx;
    }

    private class SettingsData
    {
        public double Master, Bgm, Sfx;
        public Godot.Collections.Dictionary ToGodotDict() => new()
        {
            ["master"] = Master, ["bgm"] = Bgm, ["sfx"] = Sfx,
        };
    }
}
