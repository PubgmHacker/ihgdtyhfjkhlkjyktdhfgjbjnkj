using System.Collections.Generic;
using Godot;

namespace MegabonkClone.Core;

/// <summary>
/// Generic object-pooling autoload. Avoids per-frame allocations for
/// enemies, projectiles, XP orbs, and floating damage numbers.
///
/// Usage:
///   var enemy = ObjectPool.Spawn(enemyScene, position, rotation);
///   ObjectPool.Release(pooledNode);   // returns it to its pool
/// </summary>
public partial class ObjectPool : Node
{
    public static ObjectPool Instance { get; private set; } = null!;

    private readonly Dictionary<string, Queue<Node>> _pools = new();
    private readonly Dictionary<string, PackedScene> _scenes = new();
    private Node _storage = null!;

    public override void _Ready()
    {
        Instance = this;
        _storage = new Node { Name = "PooledStorage" };
        AddChild(_storage);
    }

    /// <summary>Typed spawn at position + rotation.</summary>
    public T Spawn<T>(PackedScene scene, Vector3 position, Vector3 rotationRadians)
        where T : class
    {
        var node = SpawnInternal(scene, position, rotationRadians);
        return (T)(object)node;
    }

    /// <summary>Typed spawn at position only.</summary>
    public T Spawn<T>(PackedScene scene, Vector3 position)
        where T : class
    {
        var node = SpawnInternal(scene, position, Vector3.Zero);
        return (T)(object)node;
    }

    public Node Spawn(PackedScene scene, Vector3 position, Vector3 rotationRadians)
        => SpawnInternal(scene, position, rotationRadians);

    public Node Spawn(PackedScene scene, Vector3 position)
        => SpawnInternal(scene, position, Vector3.Zero);

    private Node SpawnInternal(PackedScene scene, Vector3 pos, Vector3 rot)
    {
        var node = SpawnInternal(scene);
        if (node is Node3D n3d)
        {
            n3d.GlobalPosition = pos;
            n3d.GlobalRotation = rot;
        }
        return node;
    }

    private Node SpawnInternal(PackedScene scene)
    {
        string key = scene.ResourcePath;
        _scenes[key] = scene;

        if (_pools.TryGetValue(key, out var queue) && queue.Count > 0)
        {
            var node = queue.Dequeue();
            if (node.GetParent() != this)
                node.GetParent()?.RemoveChild(node);
            if (!node.IsInsideTree())
                AddChild(node);
            node.ProcessMode = Node.ProcessModeEnum.Inherit;
            if (node is Node3D n3d) n3d.Visible = true;
            return node;
        }

        var fresh = scene.Instantiate();
        fresh.SetMeta("pool_key", key);
        AddChild(fresh);
        return fresh;
    }

    /// <summary>Returns a node to its pool. Frees non-pooled nodes.</summary>
    public void Release(Node node)
    {
        if (!node.HasMeta("pool_key"))
        {
            node.QueueFree();
            return;
        }

        string key = (string)node.GetMeta("pool_key");
        if (!_pools.ContainsKey(key))
            _pools[key] = new Queue<Node>();

        if (node is Node3D n3d) n3d.Visible = false;
        node.ProcessMode = Node.ProcessModeEnum.Disabled;

        if (node.GetParent() != _storage)
        {
            node.GetParent()?.RemoveChild(node);
            _storage.AddChild(node);
        }

        _pools[key].Enqueue(node);
    }

    public int PooledCount(PackedScene scene) =>
        _pools.TryGetValue(scene.ResourcePath, out var q) ? q.Count : 0;

    public void Clear()
    {
        foreach (var q in _pools.Values)
            while (q.Count > 0)
                q.Dequeue().QueueFree();
        _pools.Clear();
    }
}
