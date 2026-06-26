using Godot;
using MegabonkClone.Core;
using System;
using System.Collections.Generic;

/// <summary>
/// SFX kinds played throughout gameplay.
/// </summary>
public enum SfxKind
{
    Bonk,
    Hit,
    Click,
    Spawn,
    GameOver,
    EnemyDeath,
    WaveStart,
    PlayerHurt,
    XPPickup,
    Dash,
    LevelUp,
    BossPhase,
    Shoot,
}

/// <summary>
/// Audio system. Generates procedural SFX at runtime (no external assets needed)
/// so the game ships with full audio coverage from day one. Real audio files
/// can be dropped in later via <see cref="AssignClip"/> without code changes.
///
/// Features:
///   • SFX pool of reusable AudioStreamPlayer nodes (no per-call allocation).
///   • Procedurally-synthesized one-shot sounds (blips, hits, sweeps).
///   • BGM with crossfade between tracks.
///   • Pitch + volume randomization for organic feel.
///
/// Autoload singleton.
/// </summary>
public partial class AudioManager : Node
{
    public static AudioManager Instance { get; private set; } = null!;

    [ExportGroup("Mixing")]
    [Export] public float MasterVolume { get; set; } = 0f;    // dB
    [Export] public float BgmVolume { get; set; } = -6f;
    [Export] public float SfxVolume { get; set; } = -3f;
    [Export] public int SfxPoolSize { get; set; } = 16;

    // --- BGM (two players for crossfade) ---
    private AudioStreamPlayer _bgmA = null!;
    private AudioStreamPlayer _bgmB = null!;
    private bool _bgmOnA = true;
    private AudioStream? _currentBgm;
    private Tween? _crossfadeTween;

    // --- SFX pool ---
    private readonly List<AudioStreamPlayer> _sfxPool = new();
    private int _sfxCursor;

    // --- Procedural SFX cache (built once per kind) ---
    private readonly Dictionary<SfxKind, AudioStream> _procCache = new();

    // --- Optional real clips (assign at runtime or via scene) ---
    private readonly Dictionary<SfxKind, AudioStream> _realClips = new();

    public override void _Ready()
    {
        Instance = this;

        // Bus setup — create dedicated buses if missing.
        EnsureBus("Master");
        EnsureBus("BGM");
        EnsureBus("SFX");

        // BGM players.
        _bgmA = MakePlayer("BGM_A", "BGM", BgmVolume);
        _bgmB = MakePlayer("BGM_B", "BGM", BgmVolume);
        AddChild(_bgmA);
        AddChild(_bgmB);

        // SFX pool.
        for (int i = 0; i < SfxPoolSize; i++)
        {
            var p = MakePlayer($"SFX_{i}", "SFX", SfxVolume);
            AddChild(p);
            _sfxPool.Add(p);
        }

        // Pre-generate procedural sounds.
        foreach (SfxKind kind in Enum.GetValues<SfxKind>())
            _procCache[kind] = Synthesize(kind);

        // Wire game events to sounds.
        GameEvents.EnemyDied += _ => PlaySfx(SfxKind.EnemyDeath, volumeDb: -8f, pitchVar: 0.15f);
        GameEvents.PlayerLevelledUp += _ => PlaySfx(SfxKind.LevelUp);
        GameEvents.PlayerDamaged += _ => PlaySfx(SfxKind.PlayerHurt, volumeDb: -6f);
        GameEvents.WaveStarted += (_, _) => PlaySfx(SfxKind.WaveStart);

        GD.Print("[AudioManager] Initialized — procedural SFX + BGM crossfade ready.");
    }

    // ============================================================
    //  PUBLIC API
    // ============================================================

    /// <summary>Plays a SFX from the pool. Pitches and randomizes for organic feel.</summary>
    public void PlaySfx(SfxKind kind, float volumeDb = 0f, float pitch = 1f, float pitchVar = 0f)
    {
        var stream = _realClips.GetValueOrDefault(kind) ?? _procCache[kind];
        if (stream == null) return;

        var player = _sfxPool[_sfxCursor];
        _sfxCursor = (_sfxCursor + 1) % _sfxPool.Count;

        float finalPitch = pitch + (pitchVar > 0f ? (float)GD.RandRange(-pitchVar, pitchVar) : 0f);
        player.Stream = stream;
        player.VolumeDb = SfxVolume + volumeDb;
        player.PitchScale = Mathf.Clamp(finalPitch, 0.1f, 4f);
        player.Play();
    }

    /// <summary>Starts BGM with crossfade. Pass null to fade out.</summary>
    public void PlayBgm(AudioStream? stream, float fadeTime = 1.5f)
    {
        if (stream == _currentBgm) return;
        _currentBgm = stream;

        var from = _bgmOnA ? _bgmA : _bgmB;
        var to = _bgmOnA ? _bgmB : _bgmA;
        _bgmOnA = !_bgmOnA;

        if (stream != null)
        {
            to.Stream = stream;
            to.VolumeDb = -40f;
            to.Play();
        }

        _crossfadeTween?.Kill();
        _crossfadeTween = CreateTween();
        _crossfadeTween.SetParallel(true);
        _crossfadeTween.TweenProperty(from, "volume_db", -40f, fadeTime);
        if (stream != null)
            _crossfadeTween.TweenProperty(to, "volume_db", BgmVolume, fadeTime);
        _crossfadeTween.Chain();
        _crossfadeTween.TweenCallback(Callable.From(() =>
        {
            from.Stop();
        }));
    }

    /// <summary>Stops BGM with fade-out.</summary>
    public void StopBgm(float fadeTime = 1f) => PlayBgm(null, fadeTime);

    /// <summary>Assign a real audio clip to a kind (overrides procedural).</summary>
    public void AssignClip(SfxKind kind, AudioStream clip) => _realClips[kind] = clip;

    // ============================================================
    //  PROCEDURAL SFX SYNTHESIS
    //  Builds short AudioStreamWav buffers per kind — zero asset dependency.
    // ============================================================

    private static AudioStreamWav Synthesize(SfxKind kind)
    {
        return kind switch
        {
            SfxKind.Hit          => Blip(220f, 0.08f, decay: 18f, noise: 0.3f),
            SfxKind.EnemyDeath   => Blip(160f, 0.15f, decay: 12f, noise: 0.5f, sweepDown: 0.5f),
            SfxKind.PlayerHurt   => Blip(140f, 0.2f, decay: 8f, noise: 0.4f, sweepDown: 0.6f),
            SfxKind.Bonk         => Blip(330f, 0.06f, decay: 25f, noise: 0.2f),
            SfxKind.Click        => Blip(660f, 0.04f, decay: 30f),
            SfxKind.Spawn        => Blip(440f, 0.1f, decay: 10f, sweepUp: 0.5f),
            SfxKind.XPPickup     => Blip(880f, 0.08f, decay: 20f, sweepUp: 0.8f),
            SfxKind.Dash         => Sweep(200f, 1200f, 0.18f, noise: 0.2f),
            SfxKind.Shoot        => Blip(550f, 0.05f, decay: 28f, noise: 0.3f, sweepDown: 0.3f),
            SfxKind.WaveStart    => Chord(new[] { 261f, 329f, 392f }, 0.5f, decay: 4f),
            SfxKind.LevelUp      => Arpeggio(new[] { 523f, 659f, 784f, 1046f }, 0.08f),
            SfxKind.BossPhase    => Chord(new[] { 110f, 146f, 175f }, 0.6f, decay: 3f, noise: 0.3f),
            SfxKind.GameOver     => Arpeggio(new[] { 392f, 329f, 261f, 196f }, 0.15f, decay: 4f),
            _ => Blip(440f, 0.1f, decay: 15f),
        };
    }

    /// <summary>Sine + noise blip with exponential decay.</summary>
    private static AudioStreamWav Blip(float freq, float duration, float decay,
        float noise = 0f, float sweepUp = 0f, float sweepDown = 0f)
    {
        const int sampleRate = 22050;
        int samples = (int)(sampleRate * duration);
        var data = new byte[samples * 2]; // 16-bit mono

        for (int i = 0; i < samples; i++)
        {
            float t = i / (float)sampleRate;
            float env = MathF.Exp(-t * decay);
            float f = freq;
            if (sweepUp > 0f) f = freq * (1f + sweepUp * t / duration);
            if (sweepDown > 0f) f = freq * (1f - sweepDown * t / duration * 0.5f);

            float sine = MathF.Sin(2f * MathF.PI * f * t);
            float n = noise > 0f ? ((Random.Shared.NextSingle() * 2f) - 1f) * noise : 0f;

            float sample = (sine + n) * env * 0.5f;
            short s16 = (short)(Math.Clamp(sample, -1f, 1f) * short.MaxValue);
            BitConverter.TryWriteBytes(data.AsSpan(i * 2), s16);
        }

        return WavFromData(data, sampleRate);
    }

    /// <summary>Frequency sweep (good for dash).</summary>
    private static AudioStreamWav Sweep(float fromFreq, float toFreq, float duration, float noise = 0f)
    {
        const int sampleRate = 22050;
        int samples = (int)(sampleRate * duration);
        var data = new byte[samples * 2];

        for (int i = 0; i < samples; i++)
        {
            float t = i / (float)samples;
            float env = MathF.Sin(MathF.PI * t); // bell envelope
            float f = Mathf.Lerp(fromFreq, toFreq, t);
            float sine = MathF.Sin(2f * MathF.PI * f * (i / (float)sampleRate));
            float n = noise > 0f ? ((Random.Shared.NextSingle() * 2f) - 1f) * noise : 0f;
            float sample = (sine + n) * env * 0.5f;
            short s16 = (short)(Math.Clamp(sample, -1f, 1f) * short.MaxValue);
            BitConverter.TryWriteBytes(data.AsSpan(i * 2), s16);
        }
        return WavFromData(data, sampleRate);
    }

    /// <summary>Layered chord.</summary>
    private static AudioStreamWav Chord(float[] freqs, float duration, float decay, float noise = 0f)
    {
        const int sampleRate = 22050;
        int samples = (int)(sampleRate * duration);
        var data = new byte[samples * 2];

        for (int i = 0; i < samples; i++)
        {
            float t = i / (float)sampleRate;
            float env = MathF.Exp(-t * decay);
            float sum = 0f;
            foreach (var f in freqs)
                sum += MathF.Sin(2f * MathF.PI * f * t);
            sum /= freqs.Length;
            float n = noise > 0f ? ((Random.Shared.NextSingle() * 2f) - 1f) * noise : 0f;
            float sample = (sum + n) * env * 0.5f;
            short s16 = (short)(Math.Clamp(sample, -1f, 1f) * short.MaxValue);
            BitConverter.TryWriteBytes(data.AsSpan(i * 2), s16);
        }
        return WavFromData(data, sampleRate);
    }

    /// <summary>Sequential arpeggio (notes one after another).</summary>
    private static AudioStreamWav Arpeggio(float[] freqs, float noteDuration, float decay = 8f)
    {
        const int sampleRate = 22050;
        int noteSamples = (int)(sampleRate * noteDuration);
        int totalSamples = noteSamples * freqs.Length;
        var data = new byte[totalSamples * 2];

        for (int n = 0; n < freqs.Length; n++)
        {
            for (int i = 0; i < noteSamples; i++)
            {
                float t = i / (float)sampleRate;
                float env = MathF.Exp(-t * decay);
                float sine = MathF.Sin(2f * MathF.PI * freqs[n] * t);
                float sample = sine * env * 0.5f;
                short s16 = (short)(Math.Clamp(sample, -1f, 1f) * short.MaxValue);
                int idx = (n * noteSamples + i) * 2;
                BitConverter.TryWriteBytes(data.AsSpan(idx), s16);
            }
        }
        return WavFromData(data, sampleRate);
    }

    private static AudioStreamWav WavFromData(byte[] data, int sampleRate)
    {
        return new AudioStreamWav
        {
            Format = AudioStreamWav.FormatEnum.Format16Bits,
            MixRate = sampleRate,
            Stereo = false,
            Data = data,
        };
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private static AudioStreamPlayer MakePlayer(string name, string bus, float vol)
    {
        return new AudioStreamPlayer
        {
            Name = name,
            Bus = bus,
            VolumeDb = vol,
        };
    }

    private static void EnsureBus(string name)
    {
        int idx = AudioServer.GetBusIndex(name);
        if (idx == -1)
        {
            AudioServer.AddBus();
            idx = AudioServer.BusCount - 1;
            AudioServer.SetBusName(idx, name);
        }
    }
}
