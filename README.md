# 🎮 Megabonk Clone — 3D Auto-Shooter Roguelike

3D auto-shooter roguelike inspired by [Megabonk](https://store.steampowered.com/app/3405340/Megabonk/), rebuilt in **Godot 4 + C#**.

> Fight through hordes of enemies, level up, draft weapon/stat upgrades, and survive escalating waves — all while your weapons fire automatically. You only control movement.

## ✨ Features (MVP)

- **3D top-down movement** with jump, dash, slide & bunny-hop momentum (WASD + Space + Shift)
- **Auto-attacking weapons** (4 types: melee, projectile, aura, boomerang)
- **5 enemy types + 1 boss**, optimized for hundreds on screen
- **Boss summoning gates** — optional challenge portals for extra loot
- **Procedurally generated 3D maps** with biomes, hills & walls
- **Breakable pots** (blue-silver jars) dropping XP, gold, and rare Silver Coins
- **XP → level up → upgrade draft** (pause + pick 1 of 3)
- **Object pooling** for enemies, projectiles, XP orbs, damage numbers
- **Meta-progression**: gold + Silver Coins persist between runs
- **HUD** (HP bar, XP bar, kills, wave, timer) + minimap
- **Main menu + settings** (volume controls)
- **Procedural audio** — full SFX + BGM coverage, zero asset dependency
- **Post-processing** — bloom, vignette, chromatic aberration, screen shake

## 🎮 Controls

| Action | Key |
|--------|-----|
| Move | WASD |
| Jump | Space |
| Dash / Slide | Shift |
| Pause | Esc |
| Restart (on game over) | R |

## 🏗 Architecture

Ported from the [Zedtix Megabonk Unity template](https://github.com/zedtixPro/Megabonk-Game-Template) to Godot, with a cleaner modular structure.

| Unity (original) | Godot (this project) |
|---|---|
| `MonoBehaviour` + `ScriptableObject` | `Node` + Godot `Resource` + JSON |
| `GameManager.Instance` (singleton) | Autoload singleton |
| `ObjectPoolingManager` | `ObjectPool` autoload |
| `BeanController` (tick all enemies in FixedUpdate) | `EnemyController` (physics tick) |
| `Rigidbody` + `CapsuleCollider` | `CharacterBody3D` / `RigidBody3D` |
| NavMesh AI | Simple chase + optional NavigationServer |
| URP post-processing | Godot `WorldEnvironment` + `Environment` |

### Folder layout
```
Scripts/
├── Core/          GameManager, ObjectPool, EnemyController, CameraController
├── Entities/      Player, Enemy (base + 5 types + Boss), Projectile, XPOrb
├── Weapons/       WeaponBase + WeaponManager + 4 weapon types
├── Systems/       PlayerStats, ExperienceSystem, UpgradeSystem, SaveManager
├── Data/          Resource classes for Character/Weapon/Enemy/Upgrade defs
├── UI/            HUD, MainMenu, LevelUpMenu, GameOver
└── Generation/    LevelGenerator (procedural Megabonk-style arena)
Scenes/            Main, Game, entities, UI scenes
Resources/         JSON data + materials + audio
```

## 🚀 Getting started

1. Install **Godot 4.3+ (.NET version)** and **.NET 8 SDK**.
2. Open this folder in Godot (it auto-generates `.godot/` and the C# build).
3. Build the C# project (Build → Build Solutions, or run once).
4. Press **F5** to run `Scenes/Main.tscn`.

> Scripts are written and compile-ready. Scenes (`.tscn`) are provided as
> text templates — open them in the Godot editor and assign nodes/visuals
> (models, materials) as noted in each scene file.
