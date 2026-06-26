using Godot;
using MegabonkClone.Data;
using MegabonkClone.Systems;
using MegabonkClone.Core;

namespace MegabonkClone.UI;

/// <summary>
/// Level-up draft overlay: shows 3 random upgrade cards and lets the
/// player pick one. Wire to UpgradeSystem.DraftReady signal.
///
/// Code-built, no .tscn needed. Lives on the HUD CanvasLayer.
/// </summary>
public partial class LevelUpDraftUI : Control
{
    // --- Theme ---
    private static readonly Color PanelBg = new(0.03f, 0.02f, 0.08f, 0.94f);
    private static readonly Color PanelBorder = new(1.0f, 0.85f, 0.3f, 0.8f);
    private static readonly Color CardBg = new(0.06f, 0.05f, 0.12f, 0.95f);
    private static readonly Color CardBorder = new(0.3f, 0.7f, 1.0f, 0.7f);
    private static readonly Color CardHover = new(0.4f, 0.8f, 1.0f, 0.9f);
    private static readonly Color TitleColor = new(1.0f, 0.95f, 0.5f);
    private static readonly Color NameColor = new(1f, 1f, 1f, 0.95f);
    private static readonly Color DescColor = new(0.7f, 0.7f, 0.75f, 0.85f);
    private static readonly Color ButtonFill = new(0.15f, 0.55f, 0.85f);
    private static readonly Color ButtonHover = new(0.25f, 0.75f, 1.0f);
    private static readonly Color RarityCommon = new(0.7f, 0.7f, 0.75f);
    private static readonly Color RarityUncommon = new(0.3f, 0.85f, 0.4f);
    private static readonly Color RarityRare = new(0.4f, 0.6f, 1.0f);
    private static readonly Color RarityEpic = new(0.8f, 0.4f, 1.0f);

    private Panel _mainPanel = null!;
    private Label _titleLabel = null!;
    private HBoxContainer _cardsContainer = null!;
    private readonly CardWidget[] _cards = new CardWidget[3];

    private UpgradeSystem? _upgradeSystem;

    public override void _Ready()
    {
        Visible = false;
        AnchorsPreset = (int)LayoutPreset.FullRect;
        GrowHorizontal = GrowDirection.Both;
        GrowVertical = GrowDirection.Both;
        MouseFilter = MouseFilterEnum.Stop;

        BuildUI();
    }

    private void BuildUI()
    {
        // Background panel
        _mainPanel = new Panel
        {
            Name = "DraftPanel",
            AnchorsPreset = (int)LayoutPreset.FullRect,
        };
        _mainPanel.AddThemeStyleboxOverride("panel", new StyleBoxFlat
        {
            BgColor = PanelBg,
        });
        AddChild(_mainPanel);

        // Central VBox
        var centerVBox = new VBoxContainer
        {
            Name = "CenterContent",
            Alignment = BoxContainer.AlignmentMode.Center,
            AnchorsPreset = (int)LayoutPreset.Center,
            CustomMinimumSize = new Vector2(700, 0),
        };
        _mainPanel.AddChild(centerVBox);

        // Title
        _titleLabel = MakeLabel("⬆ LEVEL UP!", 32, TitleColor, bold: true);
        _titleLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _titleLabel.AnchorLeft = 0;
        _titleLabel.AnchorRight = 1;
        centerVBox.AddChild(_titleLabel);

        var subLabel = MakeLabel("Choose an upgrade to continue", 16, DescColor);
        subLabel.HorizontalAlignment = HorizontalAlignment.Center;
        subLabel.AnchorLeft = 0;
        subLabel.AnchorRight = 1;
        centerVBox.AddChild(subLabel);

        // Cards row
        _cardsContainer = new HBoxContainer
        {
            Name = "CardsRow",
            Alignment = BoxContainer.AlignmentMode.Center,
            CustomMinimumSize = new Vector2(650, 320),
        };
        _cardsContainer.AddThemeConstantOverride("separation", 20);
        centerVBox.AddChild(_cardsContainer);

        // Create 3 card slots
        for (int i = 0; i < 3; i++)
        {
            var card = new CardWidget(i, OnCardSelected);
            _cards[i] = card;
            _cardsContainer.AddChild(card);
        }
    }

    /// <summary>
    /// Binds to the UpgradeSystem's DraftReady signal.
    /// Called from SceneWire or SceneWire-like setup.
    /// </summary>
    public void Bind(UpgradeSystem upgradeSystem)
    {
        _upgradeSystem = upgradeSystem;
        upgradeSystem.DraftReady += ShowDraft;
    }

    private void ShowDraft(Godot.Collections.Array<UpgradeDef> choices)
    {
        // Clear and rebuild cards
        for (int i = 0; i < 3; i++)
        {
            if (i < choices.Count && choices[i] != null)
                _cards[i].Setup(choices[i]);
            else
                _cards[i].Hide();
        }

        Visible = true;
    }

    private void OnCardSelected(int index)
    {
        Visible = false;
        // Retrieve the UpgradeDef from the card
        var def = _cards[index].UpgradeDef;
        if (def != null && _upgradeSystem != null)
        {
            _upgradeSystem.Apply(def);
        }
    }

    // ============================================================
    //  CARD WIDGET
    // ============================================================

    private partial class CardWidget : PanelContainer
    {
        public UpgradeDef? UpgradeDef { get; private set; }
        private readonly int _index;
        private readonly System.Action<int> _onSelected;
        private Label _nameLabel = null!;
        private Label _descLabel = null!;
        private Panel _cardPanel = null!;
        private Button _pickButton = null!;
        private ColorRect _rarityStripe = null!;
        private bool _hovered;

        public CardWidget(int index, System.Action<int> onSelected)
        {
            _index = index;
            _onSelected = onSelected;
            BuildCard();
        }

        private void BuildCard()
        {
            CustomMinimumSize = new Vector2(200, 280);

            _cardPanel = new Panel
            {
                Name = "CardBg",
                AnchorsPreset = (int)LayoutPreset.FullRect,
            };
            _cardPanel.AddThemeStyleboxOverride("panel", new StyleBoxFlat
            {
                BgColor = CardBg,
                BorderColor = CardBorder,
                BorderWidthBottom = 3, BorderWidthTop = 3,
                BorderWidthLeft = 3, BorderWidthRight = 3,
                CornerRadiusTopLeft = 12, CornerRadiusTopRight = 12,
                CornerRadiusBottomLeft = 12, CornerRadiusBottomRight = 12,
            });
            AddChild(_cardPanel);

            // Rarity stripe at top
            _rarityStripe = new ColorRect
            {
                Name = "RarityStripe",
                CustomMinimumSize = new Vector2(0, 6),
                AnchorsPreset = (int)LayoutPreset.TopWide,
                Color = RarityCommon,
            };
            AddChild(_rarityStripe);

            // Vertical layout for content
            var vbox = new VBoxContainer
            {
                Name = "CardContent",
                Alignment = BoxContainer.AlignmentMode.Center,
                AnchorsPreset = (int)LayoutPreset.FullRect,
            };
            vbox.AddThemeConstantOverride("separation", 12);
            AddChild(vbox);

            // Icon placeholder (emoji based on type)
            _nameLabel = MakeLabel("", 16, NameColor, bold: true);
            _nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
            _nameLabel.AnchorLeft = 0.05f;
            _nameLabel.AnchorRight = 0.95f;
            vbox.AddChild(_nameLabel);

            _descLabel = MakeLabel("", 13, DescColor);
            _descLabel.HorizontalAlignment = HorizontalAlignment.Center;
            _descLabel.AnchorLeft = 0.05f;
            _descLabel.AnchorRight = 0.95f;
            _descLabel.AutowrapMode = TextServer.AutowrapMode.WordSmart;
            vbox.AddChild(_descLabel);

            // Pick button
            _pickButton = new Button
            {
                Text = "SELECT",
                CustomMinimumSize = new Vector2(0, 40),
                AnchorsPreset = (int)LayoutPreset.BottomWide,
            };
            _pickButton.AddThemeStyleboxOverride("normal", new StyleBoxFlat
            {
                BgColor = ButtonFill,
                CornerRadiusTopLeft = 8, CornerRadiusTopRight = 8,
                CornerRadiusBottomLeft = 8, CornerRadiusBottomRight = 8,
            });
            _pickButton.AddThemeStyleboxOverride("hover", new StyleBoxFlat
            {
                BgColor = ButtonHover,
                CornerRadiusTopLeft = 8, CornerRadiusTopRight = 8,
                CornerRadiusBottomLeft = 8, CornerRadiusBottomRight = 8,
            });
            _pickButton.AddThemeStyleboxOverride("pressed", new StyleBoxFlat
            {
                BgColor = new Color(0.2f, 0.6f, 0.9f),
                CornerRadiusTopLeft = 8, CornerRadiusTopRight = 8,
                CornerRadiusBottomLeft = 8, CornerRadiusBottomRight = 8,
            });
            _pickButton.AddThemeFontSizeOverride("font_size", 18);
            _pickButton.AddThemeColorOverride("font_color", Colors.White);
            _pickButton.AddThemeColorOverride("font_outline_color", new Color(0f, 0f, 0f, 0.8f));
            _pickButton.AddThemeConstantOverride("outline_size", 3);
            vbox.AddChild(_pickButton);

            _pickButton.Pressed += () => _onSelected?.Invoke(_index);
            _pickButton.MouseEntered += () =>
            {
                _hovered = true;
                var sb = (StyleBoxFlat)_cardPanel.GetThemeStylebox("panel");
                sb.BorderColor = CardHover;
            };
            _pickButton.MouseExited += () =>
            {
                _hovered = false;
                var sb = (StyleBoxFlat)_cardPanel.GetThemeStylebox("panel");
                sb.BorderColor = CardBorder;
            };
        }

        public void Setup(UpgradeDef def)
        {
            UpgradeDef = def;
            Show();

            _nameLabel.Text = GetIcon(def.Type) + " " + def.Title;
            _descLabel.Text = def.Description;

            // Set rarity stripe color based on weight
            Color rarity = def.Weight >= 80 ? RarityUncommon
                : def.Weight >= 60 ? RarityCommon
                : def.Weight >= 40 ? RarityRare
                : RarityEpic;
            _rarityStripe.Color = rarity;
        }

        private static string GetIcon(UpgradeType type) => type switch
        {
            UpgradeType.AddDamage => "⚔",
            UpgradeType.AddMaxHealth => "❤",
            UpgradeType.AddSpeed => "👢",
            UpgradeType.AddAttackSpeed => "⚡",
            UpgradeType.AddXPBonus => "📖",
            UpgradeType.Heal => "🩹",
            UpgradeType.AddArmor => "🛡",
            UpgradeType.AddRegeneration => "🌿",
            UpgradeType.AddCooldownReduction => "⏳",
            UpgradeType.AddLuck => "🍀",
            UpgradeType.AddKnockback => "💥",
            UpgradeType.AddDoubleDamageChance => "🎯",
            UpgradeType.UnlockAutoAxe => "🪓",
            UpgradeType.UnlockProjectileGun => "🔫",
            UpgradeType.UnlockAuraWeapon => "🔮",
            UpgradeType.UnlockBoomerang => "🪃",
            UpgradeType.LevelUpAutoAxe => "🪓",
            UpgradeType.LevelUpProjectileGun => "🔫",
            UpgradeType.LevelUpAuraWeapon => "🔮",
            UpgradeType.LevelUpBoomerang => "🪃",
            _ => "✨",
        };
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private static Label MakeLabel(string text, int fontSize, Color color, bool bold = false)
    {
        var label = new Label { Text = text };
        label.AddThemeFontSizeOverride("font_size", fontSize);
        label.AddThemeColorOverride("font_color", color);
        label.AddThemeColorOverride("font_outline_color", new Color(0f, 0f, 0f, 0.8f));
        label.AddThemeConstantOverride("outline_size", 3);
        return label;
    }
}
