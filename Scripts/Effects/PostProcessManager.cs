using Godot;
using System;

namespace MegabonkClone.Effects;

/// <summary>
/// Post-processing stack: bloom + vignette + chromatic aberration.
/// Applies fullscreen shaders over the viewport and drives reactive
/// intensity pulses on gameplay events (hit, level-up, boss phase, low HP).
///
/// Singleton autoload. Attaches a CanvasLayer + ColorRect (post-process)
/// and a MeshInstance3D (bloom) to the current scene tree on _Ready.
/// </summary>
public partial class PostProcessManager : Node
{
    public static PostProcessManager Instance { get; private set; } = null!;

    private const string PostShaderPath = "res://Shaders/post_process.gdshader";
    private const string BloomShaderPath = "res://Shaders/bloom.gdshader";

    private ShaderMaterial? _postMat;
    private ShaderMaterial? _bloomMat;

    // Current dynamic values (lerped toward targets for smooth pulses).
    private float _chromaCurrent;
    private float _chromaTarget = 0.0015f;
    private float _bloomCurrent;
    private float _bloomTarget = 0.8f;
    private float _vignetteCurrent = 0.8f;
    private float _vignetteTarget = 0.8f;

    // Low-HP red pulse.
    private bool _lowHpPulse;
    private float _lowHpPhase;

    public override void _Ready()
    {
        Instance = this;

        BuildPostProcessLayer();
        BuildBloomQuad();

        // React to events.
        Core.GameEvents.PlayerDamaged += _ => PulseChroma(0.006f);
        Core.GameEvents.PlayerLevelledUp += _ =>
        {
            PulseBloom(2.5f);
            PulseChroma(0.004f);
        };
        Core.GameEvents.WaveStarted += (_, _) => PulseBloom(1.5f);
        Core.GameEvents.PlayerDied += () =>
        {
            _vignetteTarget = 1.6f;
            PulseChroma(0.012f);
        };

        GD.Print("[PostProcessManager] Post-processing stack ready.");
    }

    public override void _Process(double delta)
    {
        float dt = (float)delta;

        // Smooth lerp toward targets.
        _chromaCurrent = Mathf.Lerp(_chromaCurrent, _chromaTarget, dt * 6f);
        _bloomCurrent = Mathf.Lerp(_bloomCurrent, _bloomTarget, dt * 5f);
        _vignetteCurrent = Mathf.Lerp(_vignetteCurrent, _vignetteTarget, dt * 3f);

        // Decay pulses back to baseline.
        _chromaTarget = Mathf.Lerp(_chromaTarget, 0.0015f, dt * 2f);
        _bloomTarget = Mathf.Lerp(_bloomTarget, 0.8f, dt * 1.5f);

        // Low-HP pulsing red vignette.
        float vig = _vignetteCurrent;
        if (_lowHpPulse)
        {
            _lowHpPhase += dt * 4f;
            vig += MathF.Sin(_lowHpPhase) * 0.15f + 0.15f;
        }

        if (_postMat != null)
        {
            _postMat.SetShaderParameter("chromatic_amount", _chromaCurrent);
            _postMat.SetShaderParameter("vignette_intensity", vig);
        }
        if (_bloomMat != null)
            _bloomMat.SetShaderParameter("intensity", _bloomCurrent);
    }

    // ============================================================
    //  PUBLIC PULSE API
    // ============================================================

    public void PulseBloom(float peak) => _bloomTarget = Mathf.Max(_bloomTarget, peak);
    public void PulseChroma(float peak) => _chromaTarget = Mathf.Max(_chromaTarget, peak);

    /// <summary>Enables/disables the low-health red pulse.</summary>
    public void SetLowHp(bool enabled)
    {
        _lowHpPulse = enabled;
        if (!enabled) _lowHpPhase = 0f;
    }

    // ============================================================
    //  BUILD LAYERS
    // ============================================================

    private void BuildPostProcessLayer()
    {
        var shader = GD.Load<Shader>(PostShaderPath);
        if (shader == null)
        {
            GD.PrintErr("[PostProcess] post_process.gdshader not found.");
            return;
        }

        _postMat = new ShaderMaterial { Shader = shader };
        _postMat.SetShaderParameter("chromatic_amount", 0.0015f);
        _postMat.SetShaderParameter("vignette_intensity", 0.8f);
        _postMat.SetShaderParameter("vignette_radius", 0.75f);
        _postMat.SetShaderParameter("scanline_strength", 0.04f);

        var canvasLayer = new CanvasLayer { Name = "PostProcessLayer", Layer = 100 };
        var colorRect = new ColorRect
        {
            Name = "PostProcessRect",
            Material = _postMat,
            MouseFilter = Control.MouseFilterEnum.Ignore,
            AnchorsPreset = (int)Control.LayoutPreset.FullRect,
        };
        canvasLayer.AddChild(colorRect);
        AddChild(canvasLayer);
    }

    private void BuildBloomQuad()
    {
        var shader = GD.Load<Shader>(BloomShaderPath);
        if (shader == null)
        {
            GD.PrintErr("[PostProcess] bloom.gdshader not found.");
            return;
        }

        _bloomMat = new ShaderMaterial { Shader = shader };
        _bloomMat.SetShaderParameter("intensity", 0.8f);
        _bloomMat.SetShaderParameter("threshold", 1.2f);

        // Fullscreen additive quad in 3D space, parented under the viewport camera.
        // We use a MeshInstance3D with a quad that always faces the camera via
        // being rendered on a separate layer. Simpler: attach to a CanvasLayer
        // as a ColorRect with the spatial shader won't work — use a second rect.
        var canvasLayer = new CanvasLayer { Name = "BloomLayer", Layer = 99 };
        var colorRect = new ColorRect
        {
            Name = "BloomRect",
            Material = _bloomMat,
            MouseFilter = Control.MouseFilterEnum.Ignore,
            AnchorsPreset = (int)Control.LayoutPreset.FullRect,
        };
        canvasLayer.AddChild(colorRect);
        AddChild(canvasLayer);
    }
}
