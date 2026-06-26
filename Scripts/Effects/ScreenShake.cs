using Godot;

namespace MegabonkClone.Effects;

/// <summary>
/// Camera screen shake system. Applies a decaying random offset to the active
/// CameraController. Singleton autoload; any system can call the Shake presets.
/// </summary>
public partial class ScreenShake : Node
{
    public static ScreenShake Instance { get; private set; } = null!;

    /// <summary>Seconds remaining for the active shake.</summary>
    public float RemainingTime { get; private set; }

    /// <summary>Peak intensity of the current shake (decays with time).</summary>
    public float CurrentIntensity { get; private set; }

    /// <summary>External offset applied to the camera each frame.</summary>
    public Vector3 Offset { get; private set; }

    [Export] public float NoiseSpeed = 30f;

    private FastNoiseLite _noise = null!;
    private float _seed;

    public override void _Ready()
    {
        Instance = this;
        _noise = new FastNoiseLite
        {
            NoiseType = FastNoiseLite.NoiseTypeEnum.Simplex,
            FractalOctaves = 3,
            Frequency = 0.5f,
        };
        _seed = (float)GD.RandRange(0f, 1000f);
    }

    public override void _Process(double delta)
    {
        if (RemainingTime <= 0f)
        {
            Offset = Vector3.Zero;
            CurrentIntensity = 0f;
            return;
        }

        float dt = (float)delta;
        RemainingTime -= dt;

        // Intensity decays linearly to zero as time runs out.
        float startDuration = Mathf.Max(0.01f, RemainingTime + dt);
        float intensity = CurrentIntensity * (RemainingTime / startDuration);
        if (RemainingTime <= 0f) intensity = 0f;

        float t = (float)Time.GetTicksMsec() / 1000f * NoiseSpeed;
        float nx = _noise.GetNoise2D(_seed + t, 0f);
        float nz = _noise.GetNoise2D(0f, _seed + t);
        float ny = _noise.GetNoise2D(_seed + 0.5f, _seed + t) * 0.3f;

        Offset = new Vector3(nx, ny, nz) * intensity;

        // Apply to the active camera controller if present.
        var cam = GetViewport().GetCamera3D();
        if (cam is Core.CameraController cc)
            cc.PositionOffset = Offset;
    }

    /// <summary>Start or extend a screen shake.</summary>
    public void Shake(float intensity, float duration)
    {
        if (intensity > CurrentIntensity)
            CurrentIntensity = intensity;
        RemainingTime = Mathf.Max(RemainingTime, duration);
    }

    public void SmallHit() => Shake(0.15f, 0.12f);
    public void BigExplosion() => Shake(0.5f, 0.35f);
    public void BossPhase() => Shake(0.8f, 0.5f);
    public void PlayerHit() => Shake(0.25f, 0.18f);
}
